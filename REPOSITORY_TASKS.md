# Repository browser — follow-up tasks

Four follow-ups on the archive→repository browser (PR #29, branch `feat/archive-browser`).
Written so each can be picked up cold and run in parallel by separate agents.

**Shared context**
- Static site, no build. React 18 + Babel standalone in-browser. three.js for GLB models.
- Run: open `index.html` or `python3 -m http.server`. Validate: `node tools/check.mjs`.
- The field is a pannable 2D plane. The "archive" lives as a single node (`archive-node`)
  that opens a full-screen layer (`ArchiveLayer`) with grouping modes + single-specimen mode.
- Data: `window.SA_ARCHIVE` (49 entries, `data/archive.js`). Notion is source of truth;
  `data/notion-mapping.json` maps images → Antenna Repository DB pages.

**Parallelization / conflict map**
- Tasks 1, 2, 3 all touch `scripts/app.jsx` and `styles/exposition.css` → real merge-conflict
  risk if run fully in parallel. Recommend: do 1+2 together (small, same region), then 3.
- Task 4 touches `data/archive.js` + `data/notion-mapping.json` only → fully independent,
  safe to run in parallel with everything else.

---

## Task 1 — Rename "archive" → "repository" (UI text)

**Goal:** user-visible strings say "repository", not "archive". CSS class names and internal
ids (`archive-node`, `ax-*`, `sa-archive-open`, `SA_ARCHIVE_OPEN`) stay as-is — text only.

**Files / lines (`scripts/app.jsx`):**
- 101 — cluster-head `k: "archive"` (the big background wash label)
- 403 — `<div className="k">archive</div>` (node header)
- 404 — node subtitle `"{N} specimens · gathered, ongoing"` (review wording)
- 413 — button `enter the archive →`
- 486 — `aria-label="exit the archive"`
- 489 — `<div className="ax-heading">archive<span>…</span></div>`
- 803 — jumps `{ label: "archive", … }`

**Acceptance:** no user-facing "archive" text remains; `node tools/check.mjs` passes; layer
still opens/closes; aria-labels updated.

---

## Task 2 — Whole repository node opens the viewer

**Goal:** any click anywhere on `archive-node` opens the layer, not just the `.enter` button.

**File:** `scripts/app.jsx`, `archive-node` Island case (~399-415).
- Move `onClick={onEnterArchive}` from the `.enter` button up to the node container.
- Keep the `.enter` button as a visual affordance (it can keep its own onClick or rely on
  bubbling). Add `role="button"` + keyboard (Enter/Space) handler + `cursor: pointer` on the
  container for accessibility.
- Guard against the click firing while panning if the field uses drag-to-pan (check whether a
  drag just ended before treating it as a click).

**File:** `styles/exposition.css`, `.island.archive-node` — add `cursor: pointer`, hover state
on the whole node.

**Acceptance:** clicking the mosaic, header, or empty node area opens the layer; keyboard
activation works; panning by dragging the node does not accidentally open it.

---

## Task 3 — Performance: panning / scrolling is slow (esp. inside the archive)

**Goal:** smooth pan on the field and smooth scroll inside the layer.

**Root-cause leads (verify with DevTools Performance before fixing):**
1. **6 auto-rotating WebGL canvases** (GLB models) each run a continuous render loop even when
   off-screen / behind the archive layer. 54M of models. → pause rAF loops when off-viewport or
   when `SA_ARCHIVE_OPEN`; consider `IntersectionObserver` to render only visible canvases.
2. **49 large JPGs** (42M total, up to 4.26MB each, `assets/archive/`) with grayscale CSS filter
   + hover transforms in the layer → decode cost + paint. → generate/downscale thumbnails for the
   mosaic + grid; reserve full-res for single-specimen view; `content-visibility: auto` on rows.
3. **ArchiveLayer is always mounted** (just opacity-toggled) → its 49 `<img>` decode on load.
   → lazy-mount the grid contents, or `content-visibility`/`loading=lazy` (already lazy, confirm).
4. **40000×40000 background grid / threads / axes** moved on every pan → large composite layers.
   → confirm `will-change: transform` is on the moved element only, not children; check the
   transform is GPU-composited (translate3d/scale, no layout thrash).

**Acceptance:** measured improvement (frame time / dropped frames) on pan and on archive scroll;
models don't render while the archive is open; document before/after in the PR.

---

## Task 4 — Data integrity: location/title/image mismatch (CRITICAL)

**Goal:** the displayed name, location, and year for each specimen must match the actual antenna
in the image. Right now the top-level `name`/`loc`/`y` look fabricated.

**The problem (concrete example):** `data/archive.js` i:2 displays
`name: "Dipole, horizontal, domestic"`, `loc: "Ramat Gan, IL"`, `y: 1964` — but its
`notion.def`/`sub`/`urls` describe the **Holmdel Horn Antenna** (Big Bang CMB discovery, New
Jersey). The displayed catalogue dressing is disconnected from the real antenna the Notion data
(and the image) is about. Locations especially appear invented.

**Approach:**
- Treat `notion.def` / `notion.sub` / `notion.urls` as the truth signal for what each image
  actually depicts (the URLs point to the real antenna).
- For each of the 48 mapped entries: read `notion.urls` / `notion.def`, and use parallel-search
  (`web_search` / `web_fetch`) to confirm the real antenna's name, location, and year.
- Cross-check `data/notion-mapping.json` (0-based 0-47) ↔ `data/archive.js` (1-based i) to ensure
  the image index points at the right Notion page in the first place. The mapping is believed to
  exist but may itself be wrong — verify image content vs. mapped page.
- Correct `name`, `loc`, `y` to reflect the real antenna. If a value is genuinely unknown, leave
  it honestly blank/uncertain rather than fabricating.

**Files:** `data/archive.js` (primary), `data/notion-mapping.json` (verify/correct mapping).

**Acceptance:** spot-check ~10 specimens against their `notion.urls` source — name/loc/year match
the real antenna; no invented locations; `node tools/check.mjs` passes; document method +
per-entry corrections in the PR. This is the highest-priority correctness task.
