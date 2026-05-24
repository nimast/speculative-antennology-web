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
// Grouped modes pack clusters into a 2D grid (clustersPerRow wide) instead of
// a single horizontal strip; each cluster gets a thin framed box.
const ARCHIVE_LAYOUT = {
  startX: -600,
  scatterStartY: 1760,
  groupedStartY: 1820,
  colsInGroup: 3,
  thumbW: 120,
  thumbPitchX: 130,
  thumbPitchY: 140,
  // within a cluster: tight label area then thumbs
  labelHeight: 62,
  labelToThumbsGap: 10,
  framePadX: 14,
  framePadTop: 10,
  framePadBottom: 14,
  // Safety padding (px) between content and ellipse stroke before the √2
  // circumscribe scale-up. Big enough to absorb the wobble-filter swing
  // (penWobble below) plus the stroke half-width.
  framePenSafety: 12,
  // Cloud arrangement: clusters orbit the tab picker below it, in an arc
  // that fans across [angleMin..angleMax] (radians, 0=right, π/2=down).
  // Largest clusters are placed first so they claim the inner orbits; the
  // rest are rejection-sampled outward until they find a clear spot.
  cloudCenterX: -150,
  cloudCenterY: 2240,
  cloudMinRadius: 360,
  cloudMaxRadius: 1400,
  cloudAngleMin: Math.PI / 6,        //  30° from horizontal-right
  cloudAngleMax: Math.PI * 5 / 6,    // 150° (i.e. through the bottom)
  // Required clear gap (px) between ellipse bounding boxes. Has to clear
  // 2× the wobble swing so adjacent pen strokes don't touch.
  cloudClearance: 22,
  get colsInnerWidth(){ return (this.colsInGroup - 1) * this.thumbPitchX + this.thumbW; },
};

function layoutGroupMode(mode){
  const groups = new Map();
  for (const a of ARCHIVE){
    const key = pickGroupKey(a, mode);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  }
  const ordered = [...groups.entries()].sort((A, B) => {
    if (A[0] === "Unspecified") return 1;
    if (B[0] === "Unspecified") return -1;
    return B[1].length - A[1].length;
  });

  const L = ARCHIVE_LAYOUT;
  const labels = [];
  const thumbs = [];
  const frames = [];

  // Each pen ellipse circumscribes its own content rectangle (label area +
  // thumb grid). For a rect of W×H, the smallest ellipse that contains all
  // four corners has axes (W/2·√2, H/2·√2) — plus a safety pad so the stroke
  // wobble doesn't graze the contents. The ellipse is centered on the
  // content's centroid, not on the padded cluster origin.
  const clusters = ordered.map(([key, list]) => {
    const rows = Math.max(1, Math.ceil(list.length / L.colsInGroup));
    const thumbsHeight = (rows - 1) * L.thumbPitchY + L.thumbW;
    const innerW = L.colsInnerWidth;
    const innerH = L.labelHeight + L.labelToThumbsGap + thumbsHeight;
    const rx = Math.ceil((innerW / 2 + L.framePenSafety) * Math.SQRT2);
    const ry = Math.ceil((innerH / 2 + L.framePenSafety) * Math.SQRT2);
    const ccX = L.framePadX + innerW / 2;
    const ccY = L.framePadTop + innerH / 2;
    return { key, list, rows, innerW, innerH, rx, ry, ccX, ccY,
             ellipseW: 2 * rx, ellipseH: 2 * ry };
  });

  // Polar cloud around the tab picker. Each cluster picks a random angle
  // in [angleMin..angleMax] and a radius growing with attempt count, then
  // gets rejected if its ellipse centre is too close to an already-placed
  // ellipse. Largest clusters are placed first so they claim inner orbits;
  // smaller ones fill out the periphery.
  let seed = 1023 + mode.length * 17;
  const rand = ()=>{ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // Forbidden zones — bounding rects around UI that ellipses must avoid.
  // Tab picker is at (-600, 1620) w:900, height ~64; the "archive" wash
  // (cluster-head) is at (-600, 1400) and visually tall.
  const FORBIDDEN = [
    { x1: -640, y1: 1580, x2:  320, y2: 1720 }, // group-tabs island
    { x1: -640, y1: 1380, x2:  360, y2: 1610 }, // arc-head "archive" wash
  ];
  const clearsForbidden = (f_x, f_y, f_w, f_h) => {
    for (const z of FORBIDDEN) {
      if (f_x < z.x2 && f_x + f_w > z.x1 &&
          f_y < z.y2 && f_y + f_h > z.y1) return false;
    }
    return true;
  };

  const placed = [];
  const ATTEMPTS = 600;
  const PAD = L.cloudClearance;
  for (const c of clusters) {
    let chosen = null;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const angle = L.cloudAngleMin + rand() * (L.cloudAngleMax - L.cloudAngleMin);
      const grow = attempt / ATTEMPTS;
      const radius = L.cloudMinRadius
        + grow * (L.cloudMaxRadius - L.cloudMinRadius)
        + (rand() - 0.5) * 60;
      const cx = L.cloudCenterX + Math.cos(angle) * radius;
      const cy = L.cloudCenterY + Math.sin(angle) * radius;
      const f_x = cx - c.ellipseW / 2;
      const f_y = cy - c.ellipseH / 2;

      // Bounding-box separation: ellipses (and their wobble strokes) stay
      // clear of each other iff the bboxes are PAD apart on at least one
      // axis. This is stricter than necessary at the bbox corners, which
      // is fine — we want guaranteed clearance, not maximum density.
      let conflict = false;
      for (const p of placed) {
        if (Math.abs(cx - p.cx) < c.rx + p.c.rx + PAD &&
            Math.abs(cy - p.cy) < c.ry + p.c.ry + PAD) {
          conflict = true; break;
        }
      }
      if (!conflict && !clearsForbidden(f_x, f_y, c.ellipseW, c.ellipseH)) {
        conflict = true;
      }
      if (!conflict) { chosen = { cx, cy }; break; }
    }
    if (!chosen) {
      // Fallback: linear scan outward at a random angle until something fits.
      let r = L.cloudMaxRadius;
      for (let step = 0; step < 60; step++) {
        const angle = L.cloudAngleMin + rand() * (L.cloudAngleMax - L.cloudAngleMin);
        const cx = L.cloudCenterX + Math.cos(angle) * r;
        const cy = L.cloudCenterY + Math.sin(angle) * r;
        const f_x = cx - c.ellipseW / 2, f_y = cy - c.ellipseH / 2;
        let conflict = false;
        for (const p of placed) {
          if (Math.abs(cx - p.cx) < c.rx + p.c.rx + PAD &&
              Math.abs(cy - p.cy) < c.ry + p.c.ry + PAD) {
            conflict = true; break;
          }
        }
        if (!conflict && clearsForbidden(f_x, f_y, c.ellipseW, c.ellipseH)) {
          chosen = { cx, cy }; break;
        }
        r += 80;
      }
      if (!chosen) {
        // Absolute last resort: drop it straight below the cloud centre at
        // an unused y so the cluster is still legible.
        chosen = { cx: L.cloudCenterX, cy: L.cloudCenterY + L.cloudMaxRadius + placed.length * 40 };
      }
    }
    placed.push({ c, cx: chosen.cx, cy: chosen.cy });
  }

  for (const p of placed) {
    const c = p.c;
    const f_x = p.cx - c.ellipseW / 2;
    const f_y = p.cy - c.ellipseH / 2;
    // cluster origin (cx, cy) is where label/thumbs anchor, picked so the
    // content centroid lands at the ellipse centre.
    const cx = f_x + c.rx - c.ccX;
    const cy = f_y + c.ry - c.ccY;
    const idKey = c.key.replace(/\s+/g, "_");

    frames.push({
      id: "frm-" + mode + "-" + idKey,
      kind: "group-frame", mode,
      x: f_x, y: f_y, w: c.ellipseW, h: c.ellipseH,
    });
    labels.push({
      id: "grp-" + mode + "-" + idKey,
      kind: "group-label", mode,
      x: cx + L.framePadX, y: cy + L.framePadTop,
      w: L.colsInnerWidth,
      label: c.key, count: c.list.length,
    });
    c.list.forEach((a, k) => {
      const col = k % L.colsInGroup;
      const tr = Math.floor(k / L.colsInGroup);
      thumbs.push({
        id: "arc-"+a.i, kind: "thumb",
        x: cx + L.framePadX + col * L.thumbPitchX,
        y: cy + L.framePadTop + L.labelHeight + L.labelToThumbsGap + tr * L.thumbPitchY,
        w: L.thumbW, a,
      });
    });
  }
  return { labels, thumbs, frames };
}

// Pre-compute labels + frames for every grouping mode. Both layers stay mounted
// at all times; only the active mode renders opaque so switching is a
// symmetric crossfade instead of a hard mount/unmount pop.
const ALL_GROUP_LABELS = GROUP_MODES_BIN.flatMap(m => layoutGroupMode(m).labels);
const ALL_GROUP_FRAMES = GROUP_MODES_BIN.flatMap(m => layoutGroupMode(m).frames);

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
    for (const a of ARCHIVE){
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

// ───────────────────────────────────────────────────────────────────────────
// Islands

function Island({ it, viewer, groupingCtl }){
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

// Cluster frames are SVG ellipses passed through a turbulence/displacement
// filter so the stroke reads as a hand-drawn pen circle. App declares a small
// pool of filters with different seeds (#sa-pen-0..N); each ellipse picks one
// deterministically from its id, so overlapping rings have distinct wobble.
const PEN_FILTER_COUNT = 6;
function hashStringTo(n){
  return (s) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 16777619); }
    return (h >>> 0) % n;
  };
}
const pickPenFilter = hashStringTo(PEN_FILTER_COUNT);

function GroupFrameLayer({ frames, active }){
  return frames.map(f => {
    const visible = f.mode === active;
    const filterId = `sa-pen-${pickPenFilter(f.id)}`;
    return (
      <svg key={f.id}
        className="island group-frame"
        style={{
          left: f.x + "px", top: f.y + "px",
          width: f.w + "px", height: f.h + "px",
          opacity: visible ? 1 : 0,
        }}
        viewBox={`0 0 ${f.w} ${f.h}`}
        preserveAspectRatio="none"
        aria-hidden={!visible}>
        <ellipse
          cx={f.w / 2} cy={f.h / 2}
          rx={f.w / 2 - 3} ry={f.h / 2 - 3}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          filter={`url(#${filterId})`}
        />
      </svg>
    );
  });
}

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

  const grouping = GROUP_MODES.includes(t.grouping) ? t.grouping : "scatter";
  const islands = React.useMemo(()=> buildIslands(grouping), [grouping]);
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
      <svg className="sa-defs" width="0" height="0" aria-hidden="true"
        style={{position:'absolute', width:0, height:0, pointerEvents:'none'}}>
        <defs>
          {/* hand-drawn pen wobble; one filter per seed so overlapping
              ellipses don't share an identical edge pattern */}
          {Array.from({length: PEN_FILTER_COUNT}, (_, i) => (
            <filter key={i} id={`sa-pen-${i}`}
              x="-3%" y="-3%" width="106%" height="106%">
              <feTurbulence type="fractalNoise" baseFrequency="0.022"
                numOctaves="2" seed={11 + i * 23} result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3"/>
            </filter>
          ))}
        </defs>
      </svg>
      <Viewport onPose={setPose}>
        <div className="bg-grid"/>
        <div className="bg-axes"/>
        <GroupFrameLayer frames={ALL_GROUP_FRAMES} active={grouping}/>
        <Threads islands={islands} threads={threads} show={t.threads}/>
        {islands.map(it => <Island key={it.id} it={it} viewer={viewer} groupingCtl={groupingCtl}/>)}
        <GroupLabelLayer labels={ALL_GROUP_LABELS} active={grouping}/>
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

        <button className="tweaks-toggle" type="button"
          onClick={()=>window.postMessage({ type: '__activate_edit_mode' }, '*')}>
          tweaks ⌥
        </button>

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
