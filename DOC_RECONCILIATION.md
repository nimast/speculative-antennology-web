# Doc ↔ Notion Reconciliation
_Source: Google Doc "Fields of Reception" · Compared against `data/islands.generated.js` (63 islands, 39 threads)_
_Last reconciled: 2026-05-31._

---

## Status at a glance

**All 30 doc nodes are represented in the live exposition** (Notion → `islands.generated.js` → site).
The earlier "22 missing nodes" backlog is closed — `ess-13`…`ess-34` were added and synced.

Two items remain open, both **deferred to the authors**:
1. **Nodes 10 & 27** were deliberately condensed rather than carried in full. The doc is now
   the version to lean toward, which surfaces these. → see **`NODE_10_27_COMPARISON.md`** (for Yanai).
2. **Footnotes / inline TODOs** in the doc — status table in §4 below. Several need author
   content or assets; per decision these are **documented only**, not auto-resolved.

The "One Possible Route Through the Field" reader path is implemented and current — the
`READER_PATH` array in `scripts/app.jsx:341` matches the doc's 11 steps exactly.

---

## 1. Node → island mapping (all 30 nodes)

| # | Doc node | Live island(s) | Fidelity to doc | Note |
|---|----------|---------------|-----------------|------|
| 1 | The Work Begins Where Perception Fails | `ess-1` | verbatim | opening lede, near title |
| 2 | Against the Visible | `ess-13` | verbatim | |
| 3 | Artistic Research as Apparatus | `ess-20` | verbatim | doc footnote [1] marker dropped (see §4) |
| 4 | Conceptual Art Was Never Dematerialised | `ess-21` | **merged** with node 5 | carries node 4 + node 5 |
| 5 | Faith, Caption, Instrument | `ess-21` | merged into node 4 | REVISION_FLAGS M1 |
| 6 | Light as Carrier, Not Image | `ess-14` | verbatim **+ Turrell cite** | REVISION_FLAGS H2 |
| 7 | The Desert Is Not Empty | `ess-22` | verbatim | |
| 8 | The Lightning Field as Receiver | `ess-8` | verbatim **+ grounding sentences** | REVISION_FLAGS P1 |
| 9 | The Radio Telescope / Distributed Eye | `ess-7` | **expanded** (richer than doc) | REVISION_FLAGS P2 — baseline/39 km/Earth-rotation added |
| 10 | The Antenna Is Not a Metaphor | `ess-6` + `ess-9` | **condensed — CONFLICT** | full doc text absent → comparison doc |
| 11 | Direction Is Not Directivity | `ess-11` | condensed | |
| 12 | Ground Is Part of the Circuit | `ess-15` | verbatim | |
| 13 | Signal-to-Noise | `ess-23` | verbatim | |
| 14 | Transceiving | `ess-12` | condensed | REVISION_FLAGS A4 — held as stronger than doc |
| 15 | The Gallery Was Never Empty | `ess-16` | verbatim | inline TODO: studio photo (see §4) |
| 16 | Carrier Wave / Receiver | `ess-24` | verbatim | inline TODO: "earth signal" rephrase (see §4) |
| 17 | The Moment of Conjugation | `ess-25` | verbatim | |
| 18 | Electromagnetic Self-Portrait | `ess-26` | verbatim | |
| 19 | Simulation as Retinal Contract | `ess-17` | verbatim | REVISION_FLAGS A1 — kept as-is |
| 20 | The Virtual Installation and the Absent Site | `ess-27` | verbatim | inline TODO: low-res video (see §4) |
| 21 | Stock Model as Found Object | `ess-28` | verbatim | |
| 22 | Sine Wave, Colour Wave, Sound Wave | `ess-29` | verbatim | |
| 23 | From Apparatus to Atmosphere | `ess-30` | verbatim | |
| 24 | A Signal Leaves Earth | `ess-18` | verbatim | inline TODO: earth-signal sim asset (see §4) |
| 25 | Seismometer as Author | `ess-31` | verbatim | |
| 26 | Planetary Address | `ess-32` | verbatim **− last 2 sentences** | REVISION_FLAGS A2 |
| 27 | Energy Too Remembers | `ess-4` + `ess-5` | **condensed — CONFLICT** | full doc text absent → comparison doc |
| 28 | Inscription Without Surface | `ess-33` | verbatim | |
| 29 | Field-Like Conservation | `ess-34` | verbatim | |
| 30 | Oeuvre as Array | `ess-19` | verbatim **− "under the title Fields of Reception"** | |

**Supporting islands** (not doc nodes): `title`, `method`, `bib`, `colophon`, `gl-1…6`,
`pq-1…3`, `nt-1…4`, `wh-1…4`, `field-1/2`, `fi-01…07`.

---

## 2. Open conflicts (doc version not used)

Per "lean toward the doc," these two are where the live exposition diverges by **omitting**
doc content (not just rephrasing it). Both were deliberate condense decisions
(`REVISION_FLAGS.md` M2 / A3) and are now **deferred to the authors** rather than auto-applied:

- **Node 10 — The Antenna Is Not a Metaphor** → condensed into `ess-6` + `ess-9`.
- **Node 27 — Energy Too Remembers** → condensed into `ess-4` + `ess-5`.

Full side-by-side text and a decision box for each are in **`NODE_10_27_COMPARISON.md`**
(prepared for Yanai). Until resolved, the condensed versions remain live.

### Enrichments (NOT conflicts — no action)
Several islands carry **more** than the doc, not less. These are intentional improvements and
"lean toward the doc" is read as additive, so they are kept:
- `ess-7` (node 9): VLA baseline / 39 km / Earth-rotation detail.
- `ess-8` (node 8): grounding ("the circuit is already closed") sentences.
- `ess-14` (node 6): Turrell citation (Sheets, *NYT*, 2013).

---

## 3. Reader path — current and correct

`scripts/app.jsx:341` `READER_PATH`, 11 steps, matches the doc's "One Possible Route":

```
ess-1 → ess-13 → ess-2 → ess-14 → ess-6 → ess-15 → ess-16 → ess-17 → ess-18 → ess-4 → ess-19
```

(Step 3 "Conceptual Art" routes through `ess-2`, the short Barry island, as the entry to that
cluster.) The decorative Notion `Connects` threads do **not** all mirror the path — that is by
design; the path UI is independent of threads. No action needed.

---

## 4. Footnote / inline-TODO status (documented only)

Per decision, footnotes are **documented, not auto-resolved**. Several need author content or
assets that can't be produced here.

### Endnotes (8 in the doc)

| # | Doc note | Attached to | Status | What's needed |
|---|----------|-------------|--------|---------------|
| 1 | "LF info? Or link in RC to image?" | node 3 (`ess-20`) | **open** | Author choice: cite Lightning Field detail or link an archive image; `[1]` marker was dropped from `ess-20` |
| 2 | "Barry info" (buried source) | node 4 (`ess-21`) | **resolved** | `ess-2` carries full Barry detail (0.5 Microcurie Radiation Installation, Central Park, 5 Jan 1969, Barium-133); `bib` has the Barry entry |
| 3 | "Barry info" (carrier wave in a gallery) | node 4 (`ess-21`) | **open** | This refers to a *different* work (a gallery carrier-wave piece), not the buried source — needs the specific work + citation from authors |
| 4 | "Turrel quote" | node 6 (`ess-14`) | **resolved (partial)** | Citation added (Sheets, *NYT*, 20 Mar 2013). It's a secondary source, not a direct Turrell quote — authors may still want a direct quote |
| 5 | "Note on visit at TATE modern exhibition in 2025? OR image?" | node 6 (`ess-14`) | **open — needs author** | A note about the McCall/Turrell Tate visit, or an image asset |
| 6 | "Note to our own Leonardo article" | node 7 (`ess-22`) | **open — needs author** | Citation to the authors' own Leonardo article (reference details) |
| 7 | "Additional info on LF, if not mentioned in body" | node 8 (`ess-8`) | **mostly resolved** | `ess-8` already carries substantial Lightning Field body; optional extra detail only |
| 8 | "Note on VLA?" | node 9 (`ess-7`) | **resolved** | `ess-7` expanded with full VLA detail (27 dishes, 25 m, 39 km baseline, Plains of San Agustín) |

### Inline parentheticals (6 in the doc)

| Location | Note | Status | What's needed |
|----------|------|--------|---------------|
| Title | "(just a working title… something less clunky/catchier/shorter)" | **open** | Title decision; rendered in `app.jsx`, not Notion |
| Node 10 | "(Antennae repository under or around this text nod?)" | **open** | Layout: place archive/repository cluster near the antenna node — relevant once Node 10 full text is resolved |
| Node 15 | "(messy studio shot of our first 'rack'? preferably in b/w)" | **open — needs asset** | A b/w studio photo of the first rack |
| Node 16 | "(Rephrase slightly to refer to earth signal?)" | **open** | Small text edit to `ess-24` to reference the earth signal |
| Node 20 | "(low res video)" | **open — needs asset** | A low-res video for the virtual-installation node |
| Node 24 | "(earth signal simulation)" | **open — needs asset** | The earth-signal simulation visual |

### Related open items in `REVISION_FLAGS.md`
- **H3** — verify "Minimizing Interference" / "Harvesting Clarity" section headings survived
  the ANTENNAE ms final edit before relying on them. Still `[ ]` open.

---

## 5. What's left (staged — no changes applied yet)

Nothing has been written to Notion or the generated file in this pass. Outstanding, in
priority order:

1. **Authors decide Nodes 10 & 27** (`NODE_10_27_COMPARISON.md`). If "add full text," create
   the rows in Notion (Centre cluster for 10, Far-right for 27) and optionally swap them into
   `READER_PATH`.
2. **Open footnotes** needing author content: endnotes 1, 3, 5, 6; inline title/earth-signal
   rephrase; assets for nodes 15, 20, 24.
3. After any Notion edits, run `tools/sync-from-notion.mjs` (needs `NOTION_TOKEN`) or let the
   daily workflow regenerate `data/islands.generated.js`.
