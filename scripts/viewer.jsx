/* global THREE */
/* Speculative Antennology — 3D model viewer.
   Loads a whole GLB file (assets/models/*.glb) and renders its entire scene as a
   single specimen. Strict B/W: flat-shaded silhouette on white, 1px ink outlines
   derived from world-space normals via a near-binary "ink" shader. */

const SA_VIEWER_CSS = `
  .sa-viewer-root{ position:absolute; inset:0; }
  .sa-viewer-root canvas{ background:#fff; display:block; }
  .sa-viewer-overlay{
    position:absolute; inset:0; pointer-events:none;
    color:#000; font-family:"Courier New", monospace; font-size:10px;
  }
  .sa-viewer-overlay .tl, .sa-viewer-overlay .tr,
  .sa-viewer-overlay .bl, .sa-viewer-overlay .br{
    position:absolute; padding:.6rem .8rem;
    letter-spacing:.12em; text-transform:uppercase;
  }
  .sa-viewer-overlay .tl{ top:0; left:0 }
  .sa-viewer-overlay .tr{ top:0; right:0; text-align:right }
  .sa-viewer-overlay .bl{ bottom:0; left:0 }
  .sa-viewer-overlay .br{ bottom:0; right:0; text-align:right }
  .sa-viewer-overlay .crosshair{
    position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
    width:80px; height:80px;
  }
  .sa-viewer-overlay .crosshair::before,
  .sa-viewer-overlay .crosshair::after{
    content:""; position:absolute; background:#000;
  }
  .sa-viewer-overlay .crosshair::before{ left:0; right:0; top:50%; height:1px }
  .sa-viewer-overlay .crosshair::after{ top:0; bottom:0; left:50%; width:1px }
  .sa-viewer-overlay .tick{
    position:absolute; background:#000;
  }
  .sa-viewer-overlay .tick.x{ height:1px; width:8px; top:50%; transform:translateY(-50%) }
  .sa-viewer-overlay .tick.y{ width:1px; height:8px; left:50%; transform:translateX(-50%) }
`;

(function(){
  const s = document.createElement('style'); s.textContent = SA_VIEWER_CSS; document.head.appendChild(s);
})();

function SAModelViewer({ src, autoRotate }){
  const mountRef = React.useRef(null);
  const stateRef = React.useRef({});

  React.useEffect(()=>{
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 200);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 1);
    mount.appendChild(renderer.domElement);

    // flat ambient + a directional to get minimal shading; we'll force near-binary
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(2, 3, 2);
    scene.add(key);

    const root = new THREE.Group();
    scene.add(root);

    const state = stateRef.current;
    state.scene = scene;
    state.camera = camera;
    state.renderer = renderer;
    state.root = root;
    state.mount = mount;
    state.currentMesh = null;
    state.loadedGLTF = null;

    // ── resize ──
    function resize(){
      const r = mount.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ── interaction: drag to orbit, wheel to zoom ──
    const rot = { x: 0.25, y: 0.6 };
    const target = new THREE.Vector3();
    let dist = 6.7;

    let dragging = false, lx = 0, ly = 0;
    mount.addEventListener('pointerdown', (e)=>{
      dragging = true; lx = e.clientX; ly = e.clientY;
      mount.setPointerCapture(e.pointerId);
    });
    mount.addEventListener('pointerup', (e)=>{
      dragging = false;
      try { mount.releasePointerCapture(e.pointerId) } catch(_){}
    });
    mount.addEventListener('pointermove', (e)=>{
      if (!dragging) return;
      rot.y += (e.clientX - lx) * 0.005;
      rot.x += (e.clientY - ly) * 0.005;
      rot.x = Math.max(-1.3, Math.min(1.3, rot.x));
      lx = e.clientX; ly = e.clientY;
    });
    mount.addEventListener('wheel', (e)=>{
      e.preventDefault();
      dist = Math.max(1.2, Math.min(8, dist + e.deltaY * 0.002));
    }, { passive:false });

    // ── black outline shader using normal/view ──
    // We create an "ink" material that draws a near-binary silhouette: very dark
    // where normal faces away from the camera, white where it faces towards.
    const inkMat = new THREE.ShaderMaterial({
      uniforms: {
        uEdge: { value: 0.35 }, // threshold
      },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vN;
        varying vec3 vV;
        uniform float uEdge;
        void main(){
          float n = dot(normalize(vN), normalize(vV));
          // ink rim: dark when near-grazing
          float rim = smoothstep(uEdge, uEdge + 0.05, n);
          // a faint hatching step to suggest form without becoming "illustrative"
          float shade = step(0.55, n);
          // camera-facing surfaces get a light-grey fill (not pure white) so the
          // specimen and its podium read against the white background.
          vec3 col = mix(vec3(0.0), vec3(0.82), rim);
          // subtle mid tone step
          col = mix(col, vec3(0.35), (1.0 - shade) * rim);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
    state.inkMat = inkMat;

    const loader = new window.SA_GLTFLoader();

    // Load a whole GLB and fit it: apply the ink material to every mesh, then
    // centre + scale the assembled scene to a unit bounding sphere.
    function loadModel(url){
      if (!url) return;
      state.loading = url;
      loader.load(url, (gltf)=>{
        if (state.disposed || state.loading !== url) return;
        while (root.children.length) root.remove(root.children[0]);
        const obj = gltf.scene;
        obj.traverse(o => { if (o.isMesh) o.material = inkMat; });
        const box = new THREE.Box3().setFromObject(obj);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const group = new THREE.Group();
        obj.position.set(-sphere.center.x, -sphere.center.y, -sphere.center.z);
        group.add(obj);
        group.scale.setScalar(1.0 / Math.max(0.0001, sphere.radius));
        root.add(group);
        if (!state.animating){ state.animating = true; animate(); }
      }, undefined, (err)=>{
        console.error('GLB load error', url, err);
      });
    }
    state.loadModel = loadModel;
    loadModel(src);

    function animate(){
      if (state.disposed) return;
      requestAnimationFrame(animate);
      if (state.autoRotate) rot.y += 0.0018;
      // apply orbit
      const cx = Math.sin(rot.y) * Math.cos(rot.x) * dist;
      const cy = Math.sin(rot.x) * dist;
      const cz = Math.cos(rot.y) * Math.cos(rot.x) * dist;
      camera.position.set(cx, cy, cz);
      camera.lookAt(target);
      renderer.render(scene, camera);
    }

    state.autoRotate = autoRotate;

    return ()=>{
      state.disposed = true;
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  React.useEffect(()=>{
    const state = stateRef.current;
    if (state && state.loadModel) state.loadModel(src);
  }, [src]);

  React.useEffect(()=>{
    const state = stateRef.current;
    if (state) state.autoRotate = autoRotate;
  }, [autoRotate]);

  const fileLabel = (src || '').split('/').pop()?.toUpperCase() || '—';

  return (
    <div className="sa-viewer-root" ref={mountRef}>
      <div className="sa-viewer-overlay">
        <div className="tl">SPECIMEN</div>
        <div className="tr">ORTH. PROJ. · ROT. {autoRotate ? 'AUTO' : 'MAN.'}</div>
        <div className="bl">computed radiator</div>
        <div className="br">GLB / {fileLabel}</div>
        <div className="crosshair"><i className="tick x" style={{left:0}}></i><i className="tick x" style={{right:0}}></i><i className="tick y" style={{top:0}}></i><i className="tick y" style={{bottom:0}}></i></div>
      </div>
    </div>
  );
}

window.SAModelViewer = SAModelViewer;
