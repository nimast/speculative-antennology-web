/* Speculative Antennology — rhizomatic field app.
   A pannable 2D plane. Islands are placed at absolute (x, y); nothing is
   numbered, very little is titled, metadata is mostly stripped. Movement is
   free in both axes; threads connect islands by association. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "grid": true,
  "numbering": "arabic",
  "threads": true,
  "autoRotate": true,
  "grouping": "scatter"
}/*EDITMODE-END*/;

const ARCHIVE = window.SA_ARCHIVE || [];

// Archive entries already placed as field islands on the canvas — excluded from the grid.
const FIELD_ARCHIVE_IS = new Set(
  (window.SA_ISLANDS || [])
    .filter(it => it.kind === "field" && it.img)
    .map(it => { const m = it.img.match(/ant-(\d+)\.jpg/); return m ? parseInt(m[1], 10) + 1 : null; })
    .filter(Boolean)
);
const ARCHIVE_GRID = ARCHIVE.filter(a => !FIELD_ARCHIVE_IS.has(a.i));

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
      style={{ display:'block', width:'100%', height:'100%', objectFit:'cover' }}
    />
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Layout — absolute coords in the infinite plane. No section order.
// Organized loosely into zones so threads read, but with no TOC surface.
// (0,0) is the title; negative/positive in both axes.

const GROUP_MODES = ["scatter", "application", "decade", "frequency", "type"];
const GROUP_MODES_BIN = ["application", "decade", "frequency", "type"]; // non-scatter

// Friendly label per mode — used by the tab bar, the group label meta line,
// and the hidden picker so all three stay in lockstep.
const MODE_LABEL = {
  scatter: "scatter",
  application: "application",
  decade: "decade",
  frequency: "band",
  type: "form",
};

// Grouping keys read directly from Notion fields. Notion is canonical:
// `notion.type` and `notion.bandGroup` are maintained in the Antenna
// Repository DB and flow in via data/notion-mapping.json → data/archive.js.
// "decade" is derived locally from a.y (year-of-acquisition), kept granular.
function pickGroupKey(a, mode){
  const n = a.notion || {};
  if (mode === "application") return (n.app && n.app[0])       || "Unspecified";
  if (mode === "decade")      return a.y ? (Math.floor(a.y/10)*10 + "s") : "Unspecified";
  if (mode === "frequency")   return (n.bandGroup && n.bandGroup[0]) || "Unspecified";
  if (mode === "type")        return (n.type && n.type[0])     || "Unspecified";
  return "all";
}

// Geometry shared between scatter and grouped layouts and the label layer.
const ARCHIVE_LAYOUT = {
  startX: -600,
  scatterStartY: 1760,
  groupedStartY: 1860,
  groupedLabelOffsetY: -120,
  colsInGroup: 3,
  thumbPitchX: 130,
  thumbPitchY: 140,
  get colWidth(){ return this.colsInGroup * this.thumbPitchX + 40; },
};

function layoutGroupMode(mode){
  const groups = new Map();
  for (const a of ARCHIVE_GRID){
    const key = pickGroupKey(a, mode);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  }
  const ordered = [...groups.entries()].sort((A, B) => {
    if (A[0] === "Unspecified") return 1;
    if (B[0] === "Unspecified") return -1;
    // Decades read chronologically; all other modes stay sorted by size.
    if (mode === "decade") return parseInt(A[0], 10) - parseInt(B[0], 10);
    return B[1].length - A[1].length;
  });

  const L = ARCHIVE_LAYOUT;
  const labels = [];
  const thumbs = [];
  ordered.forEach(([key, list], gi) => {
    const gx = L.startX + gi * L.colWidth;
    labels.push({
      id: "grp-" + mode + "-" + key.replace(/\s+/g, "_"),
      kind: "group-label",
      mode, x: gx, y: L.groupedStartY + L.groupedLabelOffsetY,
      w: L.colWidth - 40, label: key, count: list.length,
    });
    list.forEach((a, k) => {
      const col = k % L.colsInGroup;
      const row = Math.floor(k / L.colsInGroup);
      thumbs.push({ id: "arc-"+a.i, kind: "thumb",
        x: gx + col * L.thumbPitchX,
        y: L.groupedStartY + row * L.thumbPitchY,
        w: 120, a
      });
    });
  });
  return { labels, thumbs };
}

// Pre-compute every label for every grouping mode. The label layer renders
// all of them at all times, controlling visibility via opacity so the fade
// in/out is symmetric instead of a hard mount/unmount pop.
const ALL_GROUP_LABELS = GROUP_MODES_BIN.flatMap(m => layoutGroupMode(m).labels);

function buildIslands(grouping){
  const items = [];

  // Notion-driven stable-ID islands. Sourced from data/islands.generated.js
  // which is regenerated by tools/sync-from-notion.mjs (and on a cron in CI).
  if (Array.isArray(window.SA_ISLANDS)) {
    for (const it of window.SA_ISLANDS) items.push(it);
  }

  // Dynamic islands — not Notion-tracked.
  items.push({ id: "viewer", kind: "viewer", x: 420, y: 220, w: 640 });
  items.push({ id: "arc-head", kind: "cluster-head",
    x: -600, y: 1400, k: "archive", n: "gathered · ongoing"
  });
  // In-world tab selector — sits beneath the giant "archive" wash so it reads
  // as a section index rather than floating chrome.
  items.push({ id: "group-tabs", kind: "group-tabs",
    x: -600, y: 1620, w: 900
  });

  if (grouping === "scatter") {
    // Archive thumbs — seeded pseudo-random distribution (original layout)
    let seed = 97;
    const rand = ()=>{ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (const a of ARCHIVE_GRID){
      const col = (a.i - 1) % 10;
      const row = Math.floor((a.i - 1) / 10);
      const jx = (rand() - 0.5) * 80;
      const jy = (rand() - 0.5) * 60;
      const baseX = ARCHIVE_LAYOUT.startX + col * 170 + jx;
      const baseY = ARCHIVE_LAYOUT.scatterStartY + row * 220 + jy;
      items.push({ id: "arc-"+a.i, kind: "thumb",
        x: baseX, y: baseY, w: 120, a
      });
    }
  } else {
    const { thumbs } = layoutGroupMode(grouping);
    items.push(...thumbs);
  }

  return items;
}

// ───────────────────────────────────────────────────────────────────────────
// Overlap relaxation — islands carry only (x, y, w); their height is content-
// driven (and shifts with the `density` tweak), so vertical overlap can't be
// known from the data. After render we measure each card's real box and nudge
// overlapping ones apart, keeping every card as close to its authored Notion
// position as possible. The archive grid, labels and background wash are laid
// out deliberately, so they're excluded from packing.
const PACK_EXCLUDE = new Set(["thumb", "group-label", "group-tabs", "cluster-head"]);
const PACK_FIXED   = new Set(["title"]); // anchors: act as obstacles, never move
const PACK_GUTTER  = 44;                  // breathing room kept between cards

function separateBoxes(boxes, gutter){
  const g = gutter / 2;
  for (let iter = 0; iter < 400; iter++){
    let moved = false;
    for (let i = 0; i < boxes.length; i++){
      for (let j = i + 1; j < boxes.length; j++){
        const a = boxes[i], b = boxes[j];
        if (a.fixed && b.fixed) continue;
        const aL = a.x - g, aR = a.x + a.w + g, aT = a.y - g, aB = a.y + a.h + g;
        const bL = b.x - g, bR = b.x + b.w + g, bT = b.y - g, bB = b.y + b.h + g;
        const px = Math.min(aR, bR) - Math.max(aL, bL); // x penetration
        const py = Math.min(aB, bB) - Math.max(aT, bT); // y penetration
        if (px <= 0 || py <= 0) continue;               // not overlapping
        const wa = a.fixed ? 0 : (b.fixed ? 1 : 0.5);   // share a takes
        const wb = a.fixed ? 1 : (b.fixed ? 0 : 0.5);   // share b takes
        if (px < py){
          const dir = (a.x + a.w / 2) <= (b.x + b.w / 2) ? 1 : -1;
          a.x -= dir * px * wa; b.x += dir * px * wb;
        } else {
          const dir = (a.y + a.h / 2) <= (b.y + b.h / 2) ? 1 : -1;
          a.y -= dir * py * wa; b.y += dir * py * wb;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
}

// The archive (specimen grid + its tab bar) is laid out as one deliberate
// block. We don't repack it, but it must not be covered by — or pushed under —
// editorial cards, so we feed it in as one immovable obstacle: the union box of
// every thumb plus the group-tabs bar. Editorial cards then flow around it.
function archiveObstacle(islands, measured){
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const it of islands){
    if (it.kind !== "thumb" && it.kind !== "group-tabs") continue;
    const m = measured[it.id];
    const w = m ? m.w : (it.w || 120), h = m ? m.h : 120;
    x1 = Math.min(x1, it.x); y1 = Math.min(y1, it.y);
    x2 = Math.max(x2, it.x + w); y2 = Math.max(y2, it.y + h);
  }
  if (x1 === Infinity) return null;
  return { id: "__archive__", x: x1, y: y1, w: x2 - x1, h: y2 - y1, fixed: true };
}

// Measure rendered boxes, resolve overlaps, and return id → {x, y} overrides.
// Deterministic from the authored positions, so it converges in one re-render.
function usePackedIslands(islands, deps){
  const [overrides, setOverrides] = React.useState({});
  React.useLayoutEffect(()=>{
    const world = document.querySelector(".world");
    if (!world) return;
    const measured = {};
    world.querySelectorAll(".island[data-id]").forEach(el => {
      measured[el.getAttribute("data-id")] = { w: el.offsetWidth, h: el.offsetHeight };
    });
    const boxes = islands
      .filter(it => !PACK_EXCLUDE.has(it.kind))
      .map(it => {
        const m = measured[it.id];
        return {
          id: it.id, x: it.x, y: it.y,
          w: m ? m.w : (it.w || 240),
          h: m ? m.h : 160,
          fixed: PACK_FIXED.has(it.kind),
        };
      });
    const archive = archiveObstacle(islands, measured);
    if (archive) boxes.push(archive);
    separateBoxes(boxes, PACK_GUTTER);
    const next = {};
    for (const b of boxes){
      if (b.fixed) continue;
      const o = islands.find(i => i.id === b.id);
      const nx = Math.round(b.x), ny = Math.round(b.y);
      if (nx !== o.x || ny !== o.y) next[b.id] = { x: nx, y: ny };
    }
    setOverrides(prev => {
      const ka = Object.keys(prev), kb = Object.keys(next);
      const same = ka.length === kb.length &&
        kb.every(k => prev[k] && prev[k].x === next[k].x && prev[k].y === next[k].y);
      return same ? prev : next;
    });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return React.useMemo(
    () => islands.map(it => overrides[it.id] ? { ...it, ...overrides[it.id] } : it),
    [islands, overrides]
  );
}

// Threads = Notion-driven (between stable islands) + dynamic (involving
// viewer / arc-head / sp-* — non-Notion islands).
const THREADS = [
  ...(Array.isArray(window.SA_THREADS_FROM_NOTION) ? window.SA_THREADS_FROM_NOTION : []),
  // Dynamic — at least one endpoint is not Notion-tracked.
  ["ess-6", "viewer"],
  ["title", "viewer"],
  ["viewer", "arc-head"],
  ["field-1", "arc-head"],
  ["gl-2", "arc-head"],
  ["gl-4", "arc-head"],
  ["pq-1", "viewer"],
  ["wh-2", "viewer"],
  ["colophon", "arc-head"],
  ["pq-3", "arc-head"],
];

// Ordered reader path: "One Possible Route Through the Field"
const READER_PATH = [
  "ess-1",   // The Work Begins Where Perception Fails
  "ess-13",  // Against the Visible
  "ess-2",   // Conceptual Art Was Never Dematerialised
  "ess-14",  // Light as Carrier, Not Image
  "ess-6",   // The Antenna Is Not a Metaphor
  "ess-15",  // Ground Is Part of the Circuit
  "ess-16",  // The Gallery Was Never Empty
  "ess-17",  // Simulation as Retinal Contract
  "ess-18",  // A Signal Leaves Earth
  "ess-4",   // Energy Too Remembers
  "ess-19",  // Oeuvre as Array
];

// ───────────────────────────────────────────────────────────────────────────
// Islands

function Island({ it, viewer, groupingCtl, pathCurrent, pathIndex }){
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
      <div className="island prose-frag" style={style} data-id={it.id} data-path-current={pathCurrent || undefined}>
        {pathIndex > 0 && <span className="path-num">{pathIndex}</span>}
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

  if (it.kind === "group-label") {
    return (
      <div className="island group-label" style={style} data-id={it.id}>
        <div className="meta">grouped by · {it.mode}</div>
        <div className="lbl">{it.label}</div>
        <div className="cnt">{it.count} specimen{it.count !== 1 ? "s" : ""}</div>
      </div>
    );
  }

  if (it.kind === "group-tabs") {
    return (
      <div className="island group-tabs" style={style} data-id={it.id}>
        <div className="t">arrange archive by</div>
        <div className="tabs" role="tablist">
          {GROUP_MODES.map(m => (
            <button key={m} role="tab"
              aria-selected={groupingCtl.value === m}
              className={groupingCtl.value === m ? "on" : ""}
              onClick={()=> groupingCtl.set(m)}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
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
// Group label layer — every mode's labels stay mounted at all times. Only
// the active mode renders opaque; the others stay at opacity 0. Switching
// modes is then a pure crossfade rather than a DOM mount/unmount.

function GroupLabelLayer({ labels, active }){
  return labels.map(lbl => {
    const visible = lbl.mode === active;
    return (
      <div key={lbl.id}
        className="island group-label"
        style={{
          left: lbl.x + "px", top: lbl.y + "px", width: lbl.w + "px",
          opacity: visible ? 1 : 0,
        }}
        aria-hidden={!visible}>
        <div className="meta">grouped by · {MODE_LABEL[lbl.mode] || lbl.mode}</div>
        <div className="lbl">{lbl.label}</div>
        <div className="cnt">{lbl.count} specimen{lbl.count !== 1 ? "s" : ""}</div>
      </div>
    );
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Threads — drawn as an SVG layer in plane coords.

function Threads({ islands, threads, show }){
  // Compute centres of islands using ids
  const byId = {};
  for (const it of islands) byId[it.id] = it;
  function centre(it){
    // estimate visual height by kind
    const hByKind = {
      title: 360, prose: 180, pullquote: 200, whisper: 80, note: 80,
      field: 340, gloss: 130, method: 280, bib: 340, colophon: 160,
      "cluster-head": 280, thumb: 170, spec: 300, viewer: 580,
      "group-label": 100, "group-tabs": 64
    };
    const h = hByKind[it.kind] || 160;
    const w = it.w || 240;
    return { cx: it.x + w/2, cy: it.y + h/2 };
  }
  const paths = [];
  for (let i = 0; i < threads.length; i++){
    const [a, b] = threads[i];
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
  const [groupPicker, setGroupPicker] = React.useState(false);
  const [pathMode, setPathMode] = React.useState(false);
  const [pathStep, setPathStep] = React.useState(0);

  const grouping = GROUP_MODES.includes(t.grouping) ? t.grouping : "scatter";
  const baseIslands = React.useMemo(()=> buildIslands(grouping), [grouping]);
  // Nudge overlapping cards apart using their real measured heights; re-runs
  // when the layout (grouping) or card sizing (density) changes.
  const islands = usePackedIslands(baseIslands, [baseIslands, t.density]);
  const groupingCtl = React.useMemo(()=> ({
    value: grouping,
    set: (m) => setTweak("grouping", m),
  }), [grouping, setTweak]);

  // Hidden grouping picker — press `g` to toggle, Esc to close.
  React.useEffect(()=>{
    const onKey = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "g" || e.key === "G") {
        setGroupPicker(p => !p);
        e.preventDefault();
      } else if (e.key === "Escape") {
        setGroupPicker(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, []);
  // Drop dynamic-archive threads whose endpoint thumbs no longer share the
  // featured layout; the curated THREADS list addresses sp-N + arc-head only,
  // both of which stay put, so the list itself is grouping-independent.
  const threads = THREADS;

  function goToIsland(id) {
    const island = islands.find(it => it.id === id);
    if (!island || !window.SA_goTo) return;
    const world = document.querySelector('.world');
    if (world) { world.classList.add('path-anim'); setTimeout(()=>world.classList.remove('path-anim'), 650); }
    window.SA_goTo(island.x + (island.w || 460) / 2, island.y + 100, 1.0);
  }

  function enterPath() { setPathMode(true); setPathStep(0); goToIsland(READER_PATH[0]); }
  function exitPath()  { setPathMode(false); }
  function navPath(dir) {
    const next = pathStep + dir;
    if (next < 0 || next >= READER_PATH.length) return;
    setPathStep(next);
    goToIsland(READER_PATH[next]);
  }

  React.useEffect(()=>{
    document.body.setAttribute("data-density", t.density);
    document.body.setAttribute("data-grid", t.grid ? "1" : "0");
    document.body.setAttribute("data-numbering", t.numbering);
    document.body.setAttribute("data-grouping", grouping);
  }, [t.density, t.grid, t.numbering, grouping]);

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
        <Threads islands={islands} threads={threads} show={t.threads}/>
        {islands.map(it => {
          const pathIdx = pathMode ? READER_PATH.indexOf(it.id) : -1;
          return <Island key={it.id} it={it} viewer={viewer} groupingCtl={groupingCtl}
            pathCurrent={pathIdx === pathStep} pathIndex={pathIdx >= 0 ? pathIdx + 1 : 0}/>;
        })}
        <GroupLabelLayer labels={ALL_GROUP_LABELS} active={grouping}/>
      </Viewport>


      <div className="chrome">
        <div className="crop t"/><div className="crop b"/><div className="crop l"/><div className="crop r"/>

        <div className="wip">work in progress</div>

        <div className="jumpmenu">
          <div className="t">drift to →</div>
          {jumps.map(j => (
            <button key={j.label} onClick={()=>window.SA_goTo && window.SA_goTo(j.x, j.y, 0.85)}>
              {j.label}
            </button>
          ))}
        </div>

        <div className="routepath">
          {!pathMode ? (
            <button onClick={enterPath}>one possible route →</button>
          ) : (
            <>
              <button className="exit" onClick={exitPath}>× exit route</button>
              <div className="step">
                <button onClick={()=>navPath(-1)} disabled={pathStep===0}>◂</button>
                <span>{pathStep+1} / {READER_PATH.length}</span>
                <button onClick={()=>navPath(1)} disabled={pathStep===READER_PATH.length-1}>▸</button>
              </div>
            </>
          )}
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

      {groupPicker && (
        <div className="group-picker" role="dialog" aria-label="grouping picker">
          <div className="t">group by</div>
          {GROUP_MODES.map(m => (
            <button key={m} className={grouping === m ? "on" : ""}
              onClick={()=>{ setTweak("grouping", m); setGroupPicker(false); }}>
              <span className="caret">{grouping === m ? "▸" : " "}</span>
              <span>{m === "scatter"   ? "scatter (default)"
                   : m === "frequency" ? "band (frequency)"
                   : m === "type"      ? "form (archetype)"
                   : MODE_LABEL[m] || m}</span>
            </button>
          ))}
          <div className="hint">esc to close · g to toggle</div>
        </div>
      )}
    </>
  );
}

window.SA_App = App;
