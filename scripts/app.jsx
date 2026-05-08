/* Speculative Antennology — rhizomatic field app.
   A pannable 2D plane. Islands are placed at absolute (x, y); nothing is
   numbered, very little is titled, metadata is mostly stripped. Movement is
   free in both axes; threads connect islands by association. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "grid": true,
  "numbering": "arabic",
  "threads": true,
  "autoRotate": true
}/*EDITMODE-END*/;

const ARCHIVE = window.SA_ARCHIVE || [];

const VIEWER_SPECIMENS = [
  { i: 80, meshIdx: 37   },
  { i: 81, meshIdx: 154  },
  { i: 82, meshIdx: 321  },
  { i: 83, meshIdx: 498  },
  { i: 84, meshIdx: 780  },
  { i: 85, meshIdx: 1012 },
  { i: 86, meshIdx: 1333 },
  { i: 87, meshIdx: 1604 },
  { i: 88, meshIdx: 1870 },
  { i: 89, meshIdx: 2099 },
  { i: 90, meshIdx: 2287 },
  { i: 91, meshIdx: 2440 },
];

// ───────────────────────────────────────────────────────────────────────────
// Archive photograph plate — cycles through 48 real images

function Plate({ n }){
  const idx = (n - 1).toString().padStart(2, '0');
  return (
    <img
      src={`assets/archive/ant-${idx}.jpg`}
      alt=""
      style={{ display:'block', width:'100%', height:'100%', objectFit:'cover',
               filter:'grayscale(1) contrast(1.05)' }}
    />
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Layout — absolute coords in the infinite plane. No section order.
// Organized loosely into zones so threads read, but with no TOC surface.
// (0,0) is the title; negative/positive in both axes.

const ISLANDS = (function(){
  const items = [];

  items.push({ id: "title", kind: "title", x: -380, y: -260, w: 820 });

  // Essay fragments scattered north-east, overlapping with viewer and quotes
  items.push({ id: "ess-1",  kind: "prose", x:  560, y: -340, w: 460,
    lede: true,
    text: "Everything that has actual existence in the world of the elements emits rays in every direction, which fill the whole world.",
    cite: "Al-Kindi, De Radiis, 9th century."
  });
  items.push({ id: "ess-2", kind: "prose", x: 1080, y: -180, w: 460,
    text: "Robert Barry buried <em>0.5 Microcurie Radiation Installation</em> in Central Park on 5 January 1969 — a small amount of Barium-133 placed beneath the ground, unbeknownst to the ballplayers, dog walkers, and picnickers on the grass above. The minuscule radioactivity has been decaying there ever since. It is hardly the only trace left by the work."
  });
  items.push({ id: "ess-3", kind: "prose", x: 1620, y: -20, w: 460,
    text: "What began as a conceptual gesture ends as an ontological provocation: a negligible quantity of radioactivity, withdrawn from view, initiates an event that does not cease. The work persists as a modification of an energetic field — a measurable perturbation that outruns exhibition, documentation, and ordinary human perception."
  });
  items.push({ id: "pq-1", kind: "pullquote", x: 1200, y: 220, w: 560,
    q: "Energy, too, remembers.",
    cite: "Authors' emphasis"
  });
  items.push({ id: "ess-4", kind: "prose", x: 2100, y: 280, w: 460,
    text: "The <em>material turn</em> has urged us to treat matter as agentic and co-constitutive. But this discourse remains strikingly material-centric. Energy — radiation, electromagnetism, flux — has often been treated as evanescent, a carrier without remainder. This is misaligned with the electrodynamics we already use to navigate the world."
  });
  items.push({ id: "ess-5", kind: "prose", x: 2560, y: 80, w: 460,
    text: "The <em>electromagnetic memory effect</em> designates a permanent change induced by a finite radiation pulse — a residual kick to charged test bodies after the wave has passed. An energetic event that leaves a difference that continues. Not speculative: an entailment of the theory."
  });
  items.push({ id: "ess-6", kind: "prose", x: 2160, y: 620, w: 460,
    text: "The antenna is the <em>only</em> object explicitly designed to participate in that exchange — the shaped interface at which current becomes field, and field becomes current. Its geometry is not decoration. It is the partial embodiment of a theory of propagation. To catalogue antennas is to catalogue an infrastructure of assumption."
  });

  // East arc — Cosmos to Canvas: VLA, Lightning Field, biology, directivity, transceiver
  items.push({ id: "ess-7", kind: "prose", x: 2820, y: 1000, w: 460,
    text: "On the Plains of San Agustin, twenty-seven dish antennas — each twenty-five metres across — sit on tracks that let them be reconfigured from compact to thirty-nine kilometres apart. Each dish collects radio frequency from space; the interferences are combined into a single high-resolution image. The instrument is, in effect, an aperture the size of the desert."
  });
  items.push({ id: "ess-8", kind: "prose", x: 3380, y: 720, w: 460,
    text: "On a level plane in Catron County, four hundred stainless-steel poles stand in a grid one mile by one kilometre, spaced two hundred and twenty feet apart. The pole tips form a plane fine enough to support an imaginary sheet of glass. The structure is at once sculpture, a study in atmospheric physics, and an array of lightning rods awaiting weather."
  });
  items.push({ id: "ess-9", kind: "prose", x: 3380, y: 1280, w: 460,
    text: "Antennae appeared first as biological appendages — extending the membrane of an animate body out into its environment. Insect and crustacean antennae translate chemical, mechanical, and electromagnetic signals into electrical impulses a nervous system can read. Engineered antennae arrived later, doing the same work in metal: <em>Maxwell&rsquo;s equations made into a rod</em>."
  });
  items.push({ id: "ess-10", kind: "prose", x: 3940, y: 1000, w: 460,
    text: "Form follows wavelength. The lengths and diameters of antennae are tuned to fractions of the waves they receive. The fan of a Rhipicera beetle maps the gradient of a pheromone; the parabola of a radio telescope focuses cosmic signal onto a receiver suspended at its focus. In biology and in engineering, the same constraint operates — proportion to the unseen."
  });
  items.push({ id: "ess-11", kind: "prose", x: 3940, y: 1540, w: 460,
    text: "The decisive difference between biological and engineered antennae is not direction but <em>directivity</em>: the patterned distribution of sensitivity across space. A moth scans, aligning to a chemical gradient. A Yagi-Uda antenna does not move. Its preferred angles are baked into geometry. To install one is to make a permanent claim about where signal lives."
  });
  items.push({ id: "ess-12", kind: "prose", x: 4500, y: 1280, w: 460,
    text: "Connected to a transceiver, an antenna can transmit and receive on the same frequency — through other antennae of the same species. The function refers to itself: filtration, materiality, conductivity, applied recursively from a ground station, through one continent to the next, all the way to the rig aboard the International Space Station. An operative chain extending from human to element to cosmos."
  });

  items.push({ id: "pq-2", kind: "pullquote", x: 3060, y: 1740, w: 540,
    q: "Antennae are doors — but doors opening to a cosmos devoid of an outdoors.",
    cite: "After Blake, by way of Siegert."
  });
  items.push({ id: "pq-3", kind: "pullquote", x: 4480, y: 1820, w: 540,
    q: "Art as radar acts as an early alarm system, enabling us to discover social and psychic targets in lots of time to prepare to cope with them.",
    cite: "Marshall McLuhan, via Wershler."
  });

  items.push({ id: "wh-3", kind: "whisper", x: 3260, y: 480, w: 320,
    text: "the return stroke travels skyward — what we see is the answer, not the call"
  });
  items.push({ id: "wh-4", kind: "whisper", x: 4520, y: 740, w: 320,
    text: "the male silk moth is tuned to a single frequency — pheromone"
  });

  items.push({ id: "gl-5", kind: "gloss", x: 5080, y: 1620, w: 300,
    term: "directivity",
    def: "The patterned distribution of an antenna&rsquo;s sensitivity across space. Distinct from mobility. Most engineered antennae are fixed; their preferred angles are baked into geometry."
  });
  items.push({ id: "gl-6", kind: "gloss", x: 3760, y: 360, w: 300,
    term: "elemental media",
    def: "Media not as message-relay but as material, embodied, immersive — the precondition of contemporary life. After Peters."
  });

  items.push({ id: "nt-4", kind: "note", x: 5060, y: 940, w: 240,
    text: "jim creek, oso, washington — wartime antennae sunk into the valley to reach submarines."
  });

  // Viewer — single prominent island anchored near the essay
  items.push({ id: "viewer", kind: "viewer", x: 420, y: 220, w: 640 });

  // Whisper drifts around the viewer
  items.push({ id: "wh-1", kind: "whisper", x: 200, y: 120, w: 300,
    text: "twelve of two thousand four hundred sixty-three —"
  });
  items.push({ id: "wh-2", kind: "whisper", x: 1080, y: 560, w: 340,
    text: "objects that need not exist to be thought"
  });

  // Field plates — float south-west
  items.push({ id: "field-1", kind: "field", x: -520, y: 240, w: 420,
    img: "assets/field-photo-01.jpg",
    cap: "calibration, rooftop log-periodic — Tel Aviv, 2024"
  });
  items.push({ id: "field-2", kind: "field", x: -80, y: 880, w: 420,
    img: "assets/diagram-radiating-hemisphere.png",
    cap: "radiating hemisphere, ground currents"
  });

  // Method memo — drifts below title
  items.push({ id: "method", kind: "method", x: -920, y: -60, w: 360,
    steps: [
      "survey rooftops; temporary indexing",
      "approach, measure, note material state",
      "enter in register; misfilings retained",
      "generate computed radiators in parallel",
      "hold everything in one open field"
    ]
  });

  // Glossary fragments drifting through the plane
  items.push({ id: "gl-1", kind: "gloss", x: -880, y: 620, w: 300,
    term: "antennology",
    def: "A speculative discipline whose object is the shape, placement, biography, and cultural situation of antennas."
  });
  items.push({ id: "gl-2", kind: "gloss", x:  1100, y: 940, w: 300,
    term: "silhouette",
    def: "Primary unit of description. The register is non-functional; not pattern, gain or bandwidth, but form."
  });
  items.push({ id: "gl-3", kind: "gloss", x: 2720, y: -260, w: 300,
    term: "electromagnetic memory",
    def: "The permanent component of a system's state following a finite radiation pulse. A consequence, not a metaphor."
  });
  items.push({ id: "gl-4", kind: "gloss", x: -1400, y: 1000, w: 300,
    term: "specimen",
    def: "An entry in the register, understood here as a cultural object. Its electrical function is a subsidiary fact."
  });

  // Notes (uppercase grotesque marginalia drifting)
  items.push({ id: "nt-1", kind: "note", x: 560, y: 900, w: 240,
    text: "drag anywhere to pan. wheel to zoom. the plane does not end."
  });
  items.push({ id: "nt-2", kind: "note", x: 2240, y: -340, w: 240,
    text: "the register remains open. misfilings retained. nothing is removed."
  });
  items.push({ id: "nt-3", kind: "note", x: -960, y: 260, w: 240,
    text: "photograph, then catalogue. no conservation assessment is attempted."
  });

  // Bibliography tucked into a corner
  items.push({ id: "bib", kind: "bib", x: -1500, y: -260, w: 420,
    entries: [
      "Al-Kindi. <em>De Radiis</em>.",
      "Barry, R. <em>0.5 Microcurie Radiation Installation</em>, 1969.",
      "Bondi, van der Burg, Metzner. <em>Proc. R. Soc. A</em> 269 (1962).",
      "Coole &amp; Frost. <em>New Materialisms</em>, Duke, 2010.",
      "Flusser, V. <em>Into the Universe of Technical Images</em>, 2011.",
      "Kittler, F. &ldquo;Real Time Analysis.&rdquo; <em>Cultural Politics</em> 13(1).",
      "Parikka, J. <em>A Geology of Media</em>. UMN, 2015.",
      "Peters, J.D. <em>The Marvelous Clouds</em>. Chicago, 2015.",
      "Strominger, A. <em>Lectures on the Infrared Structure of Gravity and Gauge Theory</em>, 2017.",
      "Toister, Y. <em>Photography from the Turin Shroud to the Turing Machine</em>, 2020.",
      "Zielinski, S. <em>Deep Time of the Media</em>. MIT, 2006.",
    ]
  });

  // Archive — a cluster header label, then 80 thumbs drifting to the south
  items.push({ id: "arc-head", kind: "cluster-head",
    x: -600, y: 1400, k: "archive", n: "gathered · ongoing"
  });

  // Place archive thumbs in a loose poisson-ish drift
  // Seeded pseudo-random
  let seed = 97;
  const rand = ()=>{ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // distribute 80 thumbs across a wide zone, clustering gently
  for (const a of ARCHIVE){
    const col = (a.i - 1) % 10;
    const row = Math.floor((a.i - 1) / 10);
    const jx = (rand() - 0.5) * 80;
    const jy = (rand() - 0.5) * 60;
    const baseX = -600 + col * 170 + jx;
    const baseY = 1680 + row * 220 + jy;
    items.push({ id: "arc-"+a.i, kind: "thumb",
      x: baseX, y: baseY, w: 120, a
    });
  }

  // Featured specimens — larger cards near the archive header
  for (let k = 0; k < 4; k++){
    const a = ARCHIVE[[0, 16, 35, 47][k]];
    items.push({ id: "sp-"+a.i, kind: "spec",
      x: -1400 + k * 260, y: 1480, w: 220, a
    });
  }

  // Colophon — far south-east
  items.push({ id: "col", kind: "colophon", x: 1500, y: 3900, w: 480 });

  return items;
})();

// Threads (rhizome): from → to pairs with optional label
const THREADS = [
  ["title", "ess-1"],
  ["ess-1", "ess-2"],
  ["ess-2", "ess-3"],
  ["ess-3", "pq-1"],
  ["pq-1", "ess-4"],
  ["ess-4", "ess-5"],
  ["ess-5", "ess-6"],
  ["ess-6", "viewer"],
  ["title", "viewer"],
  ["viewer", "arc-head"],
  ["viewer", "sp-17"],
  ["gl-1", "method"],
  ["method", "field-1"],
  ["field-1", "arc-head"],
  ["arc-head", "sp-1"],
  ["arc-head", "sp-17"],
  ["arc-head", "sp-36"],
  ["arc-head", "sp-48"],
  ["gl-2", "arc-head"],
  ["gl-3", "ess-5"],
  ["gl-4", "arc-head"],
  ["bib", "ess-2"],
  ["bib", "method"],
  ["nt-1", "title"],
  ["pq-1", "viewer"],
  ["field-2", "method"],
  ["wh-2", "viewer"],
  ["col", "arc-head"],
  // East arc — Cosmos to Canvas
  ["ess-6", "ess-7"],
  ["ess-7", "ess-8"],
  ["ess-7", "ess-9"],
  ["ess-8", "ess-10"],
  ["ess-9", "ess-10"],
  ["ess-9", "wh-4"],
  ["ess-10", "ess-11"],
  ["ess-11", "gl-5"],
  ["ess-11", "ess-12"],
  ["ess-12", "pq-2"],
  ["ess-12", "pq-3"],
  ["pq-2", "gl-6"],
  ["pq-3", "arc-head"],
  ["ess-9", "nt-4"],
  ["wh-3", "ess-8"],
  ["gl-6", "method"],
];

// ───────────────────────────────────────────────────────────────────────────
// Islands

function Island({ it, viewer }){
  const style = { left: it.x + "px", top: it.y + "px", width: it.w + "px" };

  if (it.kind === "title") {
    return (
      <div className="island title" style={style} data-id={it.id}>
        <h1>Speculative<br/><em>Antennology</em></h1>
        <div className="sub">
          a field of found and computed radiators; notes on the shape of antennas and the persistence of the electromagnetic trace.
        </div>
        <div className="auth">
          <span>Yanai Toister <span className="aff">Tampere</span></span>
          <span>Nimrod Astarhan <span className="aff">independent</span></span>
        </div>
      </div>
    );
  }

  if (it.kind === "prose") {
    return (
      <div className="island prose-frag" style={style} data-id={it.id}>
        <div className="body">
          {it.lede
            ? <p className="lede" dangerouslySetInnerHTML={{__html: "&ldquo;"+it.text+"&rdquo;"}}/>
            : <p dangerouslySetInnerHTML={{__html: it.text}}/>
          }
          {it.cite && <p style={{fontFamily:"var(--f-grot)", fontSize:"10px", letterSpacing:".12em", textTransform:"uppercase", color:"var(--muted)", marginTop:".6rem"}}>— {it.cite}</p>}
        </div>
      </div>
    );
  }

  if (it.kind === "pullquote") {
    return (
      <div className="island pullquote" style={style} data-id={it.id}>
        <blockquote>&ldquo;{it.q}&rdquo;</blockquote>
        <cite>{it.cite}</cite>
      </div>
    );
  }

  if (it.kind === "whisper") {
    return (
      <div className="island whisper" style={style} data-id={it.id}>{it.text}</div>
    );
  }

  if (it.kind === "note") {
    return (
      <div className="island note" style={style} data-id={it.id}>{it.text}</div>
    );
  }

  if (it.kind === "field") {
    return (
      <div className="island field" style={style} data-id={it.id}>
        <div className="fig"><img src={it.img} alt=""/></div>
        <div className="cap">{it.cap}</div>
      </div>
    );
  }

  if (it.kind === "gloss") {
    return (
      <div className="island gloss" style={style} data-id={it.id}>
        <div className="term">{it.term}</div>
        <div className="def" dangerouslySetInnerHTML={{__html: it.def}}/>
      </div>
    );
  }

  if (it.kind === "method") {
    return (
      <div className="island method" style={style} data-id={it.id}>
        <ul>
          {it.steps.map((s,i)=>(
            <li key={i}>
              <span className="n">{String(i+1).padStart(2,"0")}</span>
              <div><p>{s}</p></div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (it.kind === "bib") {
    return (
      <div className="island bib" style={style} data-id={it.id}>
        <ol>
          {it.entries.map((e, i)=>(
            <React.Fragment key={i}>
              <span className="n">{String(i+1).padStart(2,"0")}</span>
              <span className="e" dangerouslySetInnerHTML={{__html:e}}/>
            </React.Fragment>
          ))}
        </ol>
      </div>
    );
  }

  if (it.kind === "colophon") {
    return (
      <div className="island colophon" style={style} data-id={it.id}>
        <p>Toister · Astarhan · 2026</p>
        <p><em>an open register. the field remains unbounded.</em></p>
        <p>set in Neue Haas Grotesk · Times · Courier</p>
      </div>
    );
  }

  if (it.kind === "cluster-head") {
    return (
      <div className="island cluster-head" style={style} data-id={it.id}>
        <div className="n">{it.n}</div>
        <div className="k">{it.k}</div>
      </div>
    );
  }

  if (it.kind === "thumb") {
    const a = it.a;
    return (
      <div className="island thumb" style={style} data-id={it.id}>
        <div className="plate"><Plate n={a.i}/></div>
        <div className="info">
          <div className="no">{String(a.i).padStart(3,"0")}</div>
          <div className="nm">{a.name}</div>
        </div>
      </div>
    );
  }

  if (it.kind === "spec") {
    const a = it.a;
    return (
      <div className="island spec" style={style} data-id={it.id}>
        <div className="plate"><Plate n={a.i}/></div>
        <div className="info">
          <div className="no">
            <span>{String(a.i).padStart(3,"0")}</span>
            <span>{a.y ?? "—"}</span>
          </div>
          <h3>{a.name}</h3>
          <p className="desc">{a.d}</p>
        </div>
      </div>
    );
  }

  if (it.kind === "viewer") {
    return (
      <div className="island viewer" style={style} data-id={it.id}>
        <div className="stage">
          <SAViewer
            specimenIndex={viewer.idx}
            setSpecimenIndex={viewer.setIdx}
            specimens={VIEWER_SPECIMENS}
            autoRotate={viewer.autoRotate}
          />
        </div>
        <div className="controls">
          <div className="spec">spec-{String(VIEWER_SPECIMENS[viewer.idx].i).padStart(4,"0")}</div>
          <div className="name">computed radiator — drag to orbit</div>
          <div className="buttons">
            <button onClick={()=>viewer.setIdx((viewer.idx - 1 + VIEWER_SPECIMENS.length) % VIEWER_SPECIMENS.length)}>◂</button>
            <button onClick={()=>viewer.setIdx((viewer.idx + 1) % VIEWER_SPECIMENS.length)}>▸</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// Threads — drawn as an SVG layer in plane coords.

function Threads({ islands, show }){
  // Compute centres of islands using ids
  const byId = {};
  for (const it of islands) byId[it.id] = it;
  function centre(it){
    // estimate visual height by kind
    const hByKind = {
      title: 360, prose: 180, pullquote: 200, whisper: 80, note: 80,
      field: 340, gloss: 130, method: 280, bib: 340, colophon: 160,
      "cluster-head": 280, thumb: 170, spec: 300, viewer: 580
    };
    const h = hByKind[it.kind] || 160;
    const w = it.w || 240;
    return { cx: it.x + w/2, cy: it.y + h/2 };
  }
  const paths = [];
  for (let i = 0; i < THREADS.length; i++){
    const [a, b] = THREADS[i];
    const A = byId[a]; const B = byId[b];
    if (!A || !B) continue;
    const p1 = centre(A); const p2 = centre(B);
    // Curved path via midpoint perpendicular offset
    const mx = (p1.cx + p2.cx) / 2;
    const my = (p1.cy + p2.cy) / 2;
    const dx = p2.cx - p1.cx, dy = p2.cy - p1.cy;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len, ny = dx / len;
    const bow = Math.min(260, len * 0.18) * ((i % 2) ? 1 : -1);
    const cxm = mx + nx * bow;
    const cym = my + ny * bow;
    const cls = (i % 3 === 0) ? "d" : (i % 3 === 1 ? "dd" : "");
    // Offset to plane origin (20000, 20000) because .threads is shifted
    const ox = 20000, oy = 20000;
    paths.push(
      <path key={i} className={cls}
        d={`M${p1.cx+ox} ${p1.cy+oy} Q${cxm+ox} ${cym+oy} ${p2.cx+ox} ${p2.cy+oy}`}/>
    );
  }
  if (!show) return null;
  return <svg className="threads">{paths}</svg>;
}

// ───────────────────────────────────────────────────────────────────────────
// Viewport — pan + zoom

function Viewport({ children, onPose }){
  const ref = React.useRef(null);
  const stateRef = React.useRef({ x: 0, y: 0, k: 0.85 });
  const [, force] = React.useReducer(x=>x+1, 0);

  // Centre on origin on mount
  React.useEffect(()=>{
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    stateRef.current.x = r.width / 2;
    stateRef.current.y = r.height / 2;
    apply();
    force();
  }, []);

  function apply(){
    const el = ref.current;
    if (!el) return;
    const world = el.querySelector(".world");
    const s = stateRef.current;
    world.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.k})`;
    if (onPose) onPose(s);
  }

  React.useEffect(()=>{
    const el = ref.current;
    if (!el) return;
    let dragging = false, lx = 0, ly = 0;

    const onDown = (e) => {
      // Only pan if not on an interactive element
      const tgt = e.target;
      if (tgt.closest && tgt.closest("button,input,canvas")) return;
      dragging = true; lx = e.clientX; ly = e.clientY;
      el.classList.add("panning");
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      stateRef.current.x += (e.clientX - lx);
      stateRef.current.y += (e.clientY - ly);
      lx = e.clientX; ly = e.clientY;
      apply();
    };
    const onUp = (e) => {
      dragging = false;
      el.classList.remove("panning");
      try{ el.releasePointerCapture(e.pointerId) } catch(_){}
    };
    const onWheel = (e) => {
      if (e.target.closest && e.target.closest("canvas")) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const s = stateRef.current;
      const wx = (mx - s.x) / s.k;
      const wy = (my - s.y) / s.k;
      // zoom with wheel; shift+wheel = horizontal pan; ctrl+wheel also zoom
      if (e.ctrlKey || e.metaKey || !e.shiftKey) {
        const factor = Math.exp(-e.deltaY * 0.0015);
        s.k = Math.max(0.18, Math.min(2.4, s.k * factor));
        s.x = mx - wx * s.k;
        s.y = my - wy * s.k;
      } else {
        s.x -= e.deltaY;
        s.y -= e.deltaX;
      }
      apply();
    };
    const onKey = (e) => {
      const s = stateRef.current;
      const step = 120;
      if (e.key === "ArrowLeft")  { s.x += step; apply(); }
      if (e.key === "ArrowRight") { s.x -= step; apply(); }
      if (e.key === "ArrowUp")    { s.y += step; apply(); }
      if (e.key === "ArrowDown")  { s.y -= step; apply(); }
      if (e.key === "0")          { s.k = 0.85; apply(); }
      if (e.key === "+" || e.key === "=") { s.k = Math.min(2.4, s.k * 1.15); apply(); }
      if (e.key === "-")          { s.k = Math.max(0.18, s.k / 1.15); apply(); }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive:false });
    window.addEventListener("keydown", onKey);
    return ()=>{
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // expose programmatic goTo
  React.useEffect(()=>{
    window.SA_goTo = (x, y, k) => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const s = stateRef.current;
      if (k) s.k = k;
      s.x = r.width/2 - x * s.k;
      s.y = r.height/2 - y * s.k;
      apply();
    };
  }, []);

  return (
    <div className="viewport" ref={ref}>
      <div className="world">{children}</div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// App

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [idx, setIdx] = React.useState(0);
  const [pose, setPose] = React.useState({x:0, y:0, k:0.85});

  React.useEffect(()=>{
    document.body.setAttribute("data-density", t.density);
    document.body.setAttribute("data-grid", t.grid ? "1" : "0");
    document.body.setAttribute("data-numbering", t.numbering);
  }, [t.density, t.grid, t.numbering]);

  const viewer = {
    idx, setIdx,
    autoRotate: t.autoRotate
  };

  const jumps = [
    { label: "title",    x: 0,    y: 0 },
    { label: "essay",    x: 1400, y: 120 },
    { label: "specimen", x: 720,  y: 420 },
    { label: "archive",  x: 360,  y: 2200 },
    { label: "field",    x: -400, y: 500 },
    { label: "sources",  x: -1280, y: -80 },
  ];

  return (
    <>
      <Viewport onPose={setPose}>
        <div className="bg-grid"/>
        <div className="bg-axes"/>
        <Threads islands={ISLANDS} show={t.threads}/>
        {ISLANDS.map(it => <Island key={it.id} it={it} viewer={viewer}/>)}
      </Viewport>

      <header className="masthead">
        <div>Journal of Artistic Research · Research Catalogue</div>
        <div className="centre">Speculative Antennology</div>
        <div className="jar">exposition · open field · MMXXVI</div>
      </header>

      <div className="chrome">
        <div className="crop t"/><div className="crop b"/><div className="crop l"/><div className="crop r"/>

        <div className="jumpmenu">
          <div className="t">drift to →</div>
          {jumps.map(j => (
            <button key={j.label} onClick={()=>window.SA_goTo && window.SA_goTo(j.x, j.y, 0.85)}>
              {j.label}
            </button>
          ))}
        </div>

        <div className="help">
          <kbd>drag</kbd> pan · <kbd>wheel</kbd> zoom · <kbd>shift+wheel</kbd> pan · <kbd>0</kbd> reset
        </div>

        <div className="legend">
          <div className="row"><span className="sw t"/><span>island</span></div>
          <div className="row"><span className="sw"/><span>direct</span></div>
          <div className="row"><span className="sw d"/><span>associative</span></div>
        </div>

        <div className="compass" title="viewport position">
          <div className="vp"/>
          <div className="here" style={{
            left: (45 + (-pose.x / pose.k) / 90) + "px",
            top:  (45 + (-pose.y / pose.k) / 90) + "px"
          }}/>
          <div className="lbl">× {pose.k.toFixed(2)}</div>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="field"/>
        <TweakToggle label="show grid" value={t.grid}
          onChange={v=>setTweak("grid", v)}/>
        <TweakToggle label="show threads" value={t.threads}
          onChange={v=>setTweak("threads", v)}/>
        <TweakRadio label="density" value={t.density}
          options={["airy","regular","compact","archival"]}
          onChange={v=>setTweak("density", v)}/>
        <TweakRadio label="numbering" value={t.numbering}
          options={["arabic","roman","decimal"]}
          onChange={v=>setTweak("numbering", v)}/>
        <TweakSection label="specimen"/>
        <TweakToggle label="auto-rotate" value={t.autoRotate}
          onChange={v=>setTweak("autoRotate", v)}/>
      </TweaksPanel>
    </>
  );
}

window.SA_App = App;
