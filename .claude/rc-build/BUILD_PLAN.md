# RC exposition build plan — Speculative Antennology

Rebuilding the site as a **graphical exposition** in the Research Catalogue editor
(`https://www.researchcatalogue.net/editor/4312417/4312418`) for JAR submission.
Operating mechanics are in [RC_EDITOR_NOTES.md](./RC_EDITOR_NOTES.md). Read that first.

## Intent (authoritative)
- Recreate the **original 2D scatter** layout (a wide pannable field), NOT a vertical reading column.
- Include **basically everything**: all 68 static islands + 39 connecting threads.
- **Static content only** — do NOT recreate interactive controls/UI (pan/zoom, "ONE POSSIBLE ROUTE" button, legend, zoom indicator).
- Recreate the "DRIFT TO →" navigation using **RC's built-in TOC tool** (satisfies JAR's only navigation requirement: a linked table of contents).
- **Precision is NOT required.** Authored (x,y) below are starting points. Resolve overlaps by
  manually applying the spiral algorithm (`packBoxes` in `scripts/app.jsx`): step out in rings of
  24px × 8 angular samples/ring to the nearest free spot; fixed anchors are obstacles.
- HTML/embed tool is **banned by JAR** (no iframes) — do not use for submission.
- 3D GLB models → rotating MP4s (done, in `assets/models/turntable/`). Archive of 48 images → RC Slideshow.
- Fonts: `'nimbus sans l'` (grotesk/body), `'crimson pro'` (serif/prose), `'courier prime'` (mono).
- MHRA matters only for the bibliography/reference list/citation formatting.

## Coordinate convention
Island (x,y) = **canvas top-left**. RC placement offset used so far: **OX=+1700, OY=+1000**
(`place(id, ox, oy) => move(id, ox+1700, oy+1000)`). Source bbox x:-1500→6450, y:-800→3900,
so the RC canvas needs to be ~8800×5400.

## Task list
- [x] #1 Map full content inventory from source site
- [x] #2 Learn RC editor mechanics (resize canvas, add text/image/slideshow, draw connectors)
- [x] #3 Generate turntable MP4s from the 6 GLB models → `assets/models/turntable/model-*.mp4`
- [ ] #4 Upload all media to RC (12 field photos, 48 archive images, 6 model MP4s); license CC BY-NC-ND  ← **media agent**
  - [x] 6 model MP4s: uploaded + placed as video tools, solid 1px black border, 0 overlaps, license cc-by-nc-nd (media ids 4644243/4644245/4644255/4644260/4644266/4644269; tool data-ids 4644278/4644286/4644287/4644288/4644290/4644295)
- [ ] #5 Build all static text islands at original scatter coords (12 placed so far, see below)
- [ ] #6 Place archive slideshow + model clips into the layout
- [ ] #7 Recreate the 39 inter-island threads with the shape tool
- [x] #8 Convert bibliography to MHRA author-date References — done in Notion (`bib` row renamed "References"); RC-ready text + abstract/keywords in [JAR_METADATA.md](./JAR_METADATA.md)
- [ ] #9 JAR metadata: license, abstract (125–250 words), ≥5 keywords, linked TOC (RC TOC tool), title/author — abstract + keywords drafted in [JAR_METADATA.md](./JAR_METADATA.md)

## Note — exposition is moving into RC (parser path now secondary)
Content authoring is transitioning **from the website into the Research Catalogue editor itself**.
As a result, the Notion → `tools/sync-from-notion.mjs` → `data/islands.generated.js` pipeline (and
the website render in `scripts/app.jsx`) is **no longer the primary surface** — it stays as the
content-of-record but is not where the published exposition is built. Practical implications:
- Edits to fragment *content* (incl. the References list) still go in Notion as source of truth, but
  the generated JS / website rendering is secondary; don't block on re-running the sync.
- New formatting (e.g. the "References" section heading, MHRA author-date entries) is authored for
  the **RC text boxes**; the website `bib` island renders only a bare numbered list with no heading.

## Boxes already created in RC (vertical column — STILL NEED repositioning to scatter)
| island | RC data-id | orig x | orig y |
|--------|-----------|--------|--------|
| title  | 4643287 | -380 | -260 (w760) |
| ess-1  | 4643356 | 560  | -340 |
| ess-13 | 4643358 | -200 | -600 |
| ess-2  | 4643359 | -200 | 200  |
| ess-14 | 4643360 | -900 | -500 |
| ess-6  | 4643361 | 2160 | 620  |
| ess-15 | 4643362 | 400  | 1200 |
| ess-16 | 4643367 | 3200 | -400 |
| ess-17 | 4643368 | 3800 | -400 |
| ess-18 | 4643369 | 4400 | -500 |
| ess-4  | 4643370 | 5800 | 400  |
| ess-19 | 4643371 | 5800 | 1800 |

## All 68 islands (id / kind / orig x / orig y)
prose (35): ess-1(560,-340) ess-2(-200,200) ess-3(400,600) ess-4(5800,400) ess-5(5800,1000)
ess-6(2160,620) ess-7(4600,100) ess-8(900,1200) ess-9(1800,1800) ess-11(2400,2400)
ess-12(3800,800) ess-13(-200,-600) ess-14(-900,-500) ess-15(400,1200) ess-16(3200,-400)
ess-17(3800,-400) ess-18(4400,-500) ess-19(5800,1800) ess-20(1200,-560) ess-21(-200,800)
ess-22(2400,-400) ess-23(3800,200) ess-24(3200,1400) ess-25(3800,1400) ess-26(4400,1400)
ess-27(3200,2200) ess-28(3800,2200) ess-29(4400,2200) ess-30(3200,600) ess-31(5200,-400)
ess-32(5800,-600) ess-33(5800,2600) ess-34(6400,1400) ess-35(2000,1080) ess-36(6450,300)
field (12): fi-01(5100,100) fi-02(5100,600) fi-03(1400,1200) fi-04(2660,620) fi-05(4300,800)
fi-06(4900,-800) fi-07(6300,-600) fi-08(320,240) fi-barry-am(3760,1400) fi-barry-fm(2680,1400)
field-1(-520,240) field-2(-80,880)
gloss (6): gl-1(-880,620) gl-2(1100,940) gl-3(2720,-260) gl-4(-1400,1000) gl-5(5080,1620) gl-6(3760,360)
note (4): nt-1(560,900) nt-2(2240,-340) nt-3(-960,260) nt-4(5060,940)
whisper (4): wh-1(200,120) wh-2(1080,560) wh-3(3260,480) wh-4(4520,740)
pullquote (3): pq-1(1200,220) pq-2(3060,1740) pq-3(4480,1820)
title(-380,-260) method(-920,-60) bib(-1500,-260) colophon(1500,3900)

## 39 threads (from -> to), draw with shape tool
bib->ess-2, bib->method, ess-1->ess-13, ess-11->ess-12, ess-11->gl-5, ess-12->pq-2,
ess-12->pq-3, ess-13->ess-2, ess-14->ess-6, ess-15->ess-16, ess-16->ess-17, ess-17->ess-18,
ess-18->ess-4, ess-2->ess-3, ess-3->pq-1, ess-4->ess-5, ess-5->ess-6, ess-6->ess-7,
ess-7->ess-8, ess-7->ess-9, ess-9->nt-4, ess-9->wh-4, fi-01->ess-7, fi-02->ess-7, fi-03->ess-8,
fi-04->ess-6, fi-05->ess-12, fi-06->ess-18, fi-07->ess-32, field-2->method, gl-1->method,
gl-3->ess-5, gl-6->method, nt-1->title, pq-1->ess-4, pq-2->gl-6, title->ess-1, wh-3->ess-8

## RC operating helper (re-inject via evaluate_script on the editor page each session — LOST on reload)
```js
window.__RC = (() => {
  const $ = window.jQuery;
  const OX = 1700, OY = 1000;
  const mk = (type,x,y,target)=>{ const e=$.Event(type,{which:1,button:0,buttons:type==='mouseup'?0:1,pageX:x,pageY:y,clientX:x,clientY:y,view:window}); if(target)e.target=target; return e; };
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  const el = id => document.querySelector(`#content .tool[data-id="${id}"]`);
  async function exitEdit(){ const cc=document.querySelector('#container-content'); const r=cc.getBoundingClientRect(); const x=r.x+r.width-20,y=r.y+20; ['mousedown','mouseup','click'].forEach(tp=>$(cc).trigger(mk(tp,x,y))); await wait(400); }
  async function createText(dropX=320, dropY=430){ const tool=document.querySelector('span.icon.mif-paragraph-left').closest('.tool-draggable'); const before=new Set([...document.querySelectorAll('#content .tool')].map(t=>t.dataset.id)); const r=tool.getBoundingClientRect(); const sx=r.x+r.width/2, sy=r.y+r.height/2; $(tool).trigger(mk('mousedown',sx,sy)); $(document).trigger(mk('mousemove',sx+6,sy+6)); $(document).trigger(mk('mousemove',(sx+dropX)/2,(sy+dropY)/2)); $(document).trigger(mk('mousemove',dropX,dropY)); $(document).trigger(mk('mouseup',dropX,dropY)); await wait(700); const id=[...document.querySelectorAll('#content .tool')].map(t=>t.dataset.id).find(i=>!before.has(i)); await exitEdit(); return id; }
  async function setText(id, html){ window.Editor.editItem(id); await wait(700); const ed=window.tinymce.activeEditor; ed.setContent(html); ed.setDirty(true); await exitEdit(); }
  async function resize(id,w,h){ const t=el(id); const inst=$(t).data('ui-resizable'); const handle=t.querySelector('.ui-resizable-se'); const hr=handle.getBoundingClientRect(); const sx=Math.round(hr.x+hr.width/2), sy=Math.round(hr.y+hr.height/2); const dx=w-parseInt(t.style.width), dy=h-parseInt(t.style.height); const down=mk('mousedown',sx,sy,handle); inst._mouseDownEvent=down; inst.axis='se'; inst._mouseCapture(down); inst._mouseStart(down); inst._mouseDrag(mk('mousemove',sx+dx,sy+dy,handle)); inst._mouseStop(mk('mouseup',sx+dx,sy+dy,handle)); await wait(200); }
  async function move(id,left,top){ const t=el(id); const dinst=$(t).data('ui-draggable'); const r=t.getBoundingClientRect(); const sx=Math.round(r.x+20), sy=Math.round(r.y+10); const dx=left-parseInt(t.style.left), dy=top-parseInt(t.style.top); const down=mk('mousedown',sx,sy,t); dinst._mouseDownEvent=down; dinst._mouseStart(down); dinst._mouseDrag(mk('mousemove',sx+dx,sy+dy,t)); dinst._mouseStop(mk('mouseup',sx+dx,sy+dy,t)); await wait(200); }
  async function fit(id,w){ await resize(id,w,60); const t=el(id); const sh=t.querySelector('.tool-content').scrollHeight; await resize(id,w,sh+24); }
  async function place(id,ox,oy){ return move(id, ox+OX, oy+OY); }
  return { OX, OY, exitEdit, createText, setText, resize, move, fit, place };
})();
```

## Session learnings (2026-05-31) — text-island build, READ before continuing

All 56 text islands are now built & placed (the other 12 of 68 are `kind:"field"` image islands awaiting media upload). Offset in use is **OX=1540 / OY=840** (NOT the 1700/1000 in the helper block above — the helper was re-injected with the corrected values live). `place(id,ox,oy) => move(id, ox+1540, oy+840)`.

Critical gotchas (cost real time — don't relearn them):

1. **One synthetic operation per settled "moment".** Each of createText / setText / resize / move drives jQuery UI via synthetic mouse events. Two synthetic ops back-to-back in the SAME `evaluate_script` call: the 2nd silently no-ops (box stays at default size/pos). Either (a) one op per `evaluate_script` call, or (b) within one call, insert a **requestAnimationFrame double-wait settle** between ops: `const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); const settle=async(n=8)=>{for(let k=0;k<n;k++)await raf();};`. `setTimeout`-only waits are NOT enough — must yield to RAF/paint. With RAF-settle, full create→setText→fit→place runs reliably in ONE call, well under the ~30s evaluate timeout.

2. **The "draggable prior to initialization / enable" error during setText** is a RACE, not a broken tool. Calling setText immediately after createText in the same call throws because RC destroys the edited box's draggable during edit and exitEdit's re-enable loop hits it mid-transition. Fix = the RAF-settle between createText and setText (gotcha #1). It is NOT a corrupted canvas — all tools verify healthy afterward.

3. **fit() height is measured WRONG by the helper above.** `.tool-content`.scrollHeight is CLIPPED and under-reports. Use the inner editor element instead: `t.querySelector('.simple-text-editor-content').scrollHeight + 24`. This reads true content height regardless of current tool height (overflow content), so a single `resize(id, w, innerScroll+24)` is enough — no need to expand-then-measure. Calibration: gl-2 at w=300, innerScroll=61 → correct toolH=85 (=61+24).

4. **Failed islands leave orphan boxes.** On any error, `Editor.removeItems([rid])` the half-built box so it doesn't get reused/overwritten by the next item. Orphan = a `#content .tool` whose data-id is not a value in `window.__MAP`.

5. **Verification sweep** (run after any batch): for each `__MAP` entry check (a) tool exists, (b) `parseInt(style.height) >= inner.scrollHeight`, (c) not at default drop (~left 290-360 / top 300-430 = unplaced), (d) width > 150 (=never fit). Two of the original 33 (ess-20 + 7 short ones) were unplaced/unfit from the prior session and were repaired this way.

## Field images placed on canvas (2026-05-31) — DONE
10 `kind:"field"` photos created as RC **picture** tools, each with its simple-media attached and positioned at origX+1540 / origY+840. (field-1 / field-2 are empty placeholders in source → no media, not built.)
Sizes halved on 2026-05-31 (user: "drag resize most of them to be half as big") — all 210 wide, native aspect preserved (RC picture tools use `object-fit:fill`, so keeping native aspect avoids distortion). Original exposition rendered field images as uniform 3:2 cover-cropped thumbnails (420×280 authored, world scale 0.85); RC can't cover-crop, so we keep native aspect instead.
| island | picture tool data-id | simple-media id | RC left,top | w×h |
|--------|---------------------|-----------------|-------------|-----|
| fi-01 (VLA)            | 4644067 | 4644048 | 6640,940  | 210×157 |
| fi-02 (ALMA)           | 4644069 | 4644049 | 6640,1440 | 210×140 |
| fi-03 (Blitzortung)    | 4644070 | 4644051 | 2940,2040 | 210×210 |
| fi-04 (Marconi)        | 4644071 | 4644052 | 4200,1460 | 210×175 |
| fi-05 (Goonhilly)      | 4644072 | 4644053 | 5840,1640 | 210×150 |
| fi-06 (ATS Flower)     | 4644073 | 4644054 | 6440,40   | 210×269 |
| fi-07 (Hubble)         | 4644075 | 4644056 | 7840,240  | 210×139 |
| fi-08 (Barry Radiation)| 4644076 | 4644057 | 1860,1080 | 210×157 |
| fi-barry-am            | 4644077 | 4644058 | 5300,2240 | 210×151 |
| fi-barry-fm            | 4644078 | 4644059 | 4220,2240 | 210×148 |

Archive **Slideshow** tool `4644005` placed at RC 940,2600 (560×420), seeded with Roof-yagi (sm 4644031); to be extended with remaining 47 archive images.

## Border styling system (2026-05-31) — DONE
Visual grouping by border (all 2px, color #000):
- **Solid border**: the 11 main-narrative roman-numeral sections (I–XI) + the 10 field images. Narrative text padding 8px; images padding 0.
- **Dashed border**: the other 40 text nodes (pullquotes, whispers, glosses, notes, bib, captions), padding 8px.
- The 11 narrative tool ids: 4643356(I) 4643358(II) 4643359(III) 4643360(IV) 4643361(V) 4643362(VI) 4643367(VII) 4643368(VIII) 4643369(IX) 4643370(X) 4643371(XI).
- **Font differentiation (DONE)**: the 6 poetic nodes — whispers wh-2/3/4 (`4643635`,`4643640`,`4643641`) + pullquotes pq-1/2/3 (`4643630`,`4643631`,`4643633`) — set to **CrimsonPro serif italic** (echoes the original whisper voice = Times serif italic 17.5px). Everything else stays NimbusSansL grotesk. wh-1 ("twelve of two thousand four hundred…") was not in RC (deleted earlier).

### Changing a text node's FONT — ⚠️ RC strips inline content font wrappers
Wrapping content in `<div style="font-family:…">` via `setContent` is **stripped by RC's sanitizer** on save (this is why the original build's per-kind fonts got flattened to grotesk). The working path is the editor's **own font commands**, which emit sanitizer-safe `<span style="font-family:…">` / `<em>`:
```js
window.Editor.editItem(id);            // inline TinyMCE edit (NOT Dialog.editItem)
// poll until window.tinymce.activeEditor.initialized
const ed=window.tinymce.activeEditor; ed.focus();
ed.selection.select(ed.getBody(), true);          // select all
ed.execCommand('FontName', false, "'crimson pro', serif");
ed.execCommand('italic');                          // wraps in <em>
ed.setDirty(true);
// exit edit by clicking empty canvas (top-right of #container-content) -> saves
```
RC-hosted css font names (lowercase): `'crimson pro'` (serif), `'nimbus sans l'` (grotesk), `'courier prime'` (mono). The tool edit dialog (`Dialog.editItem`) has NO custom-CSS-rules box — only a `cssClasses` class-name input (`#form_style_cssClasses_cssClasses`) + scrollbar setting; per-tool font must go through the inline editor as above.

### Style-tab edit flow (CONFIRMED — persists, dialog closes on submit)
`Dialog.editItem(id)` (NOT `Editor.editItem`, which enters inline TinyMCE edit for text tools) opens the settings DialogForm with tabs common/media/style/options/history. Click the `a[href="#style-tab"]`, then set fields (fire `input`+`change`): `#form_style_border_borderStyle` (select: none/solid/dashed/dotted/outset/double/groove/ridge/inset), `#form_style_border_borderWidth` ("2"), `#form_style_border_borderColor` ("#000000"), `#form_style_padding_padding{Left,Top,Right,Bottom}`. Click `button.btn-success` ("submit") — it saves AND closes the dialog (unlike the picture media flow). Reusable helper: `window.__styleTool(id, borderStyle, padding)`. Occasional dialog-race miss → re-run that id.

### Picture-tool creation flow (CONFIRMED, see `window.__RC.buildPicture`)
1. Drag `span.icon.mif-image` → new `tool-picture` (no auto-dialog). 2. `Editor.editItem(id)` opens edit dialog — **poll until the `media` tab anchor exists** (tab-not-ready race caused a mid-batch failure; don't click before it appears). 3. Click `media` tab → click `select media` btn → picker dialog with `<select id="form_mediaList">` multiselect (max 1). 4. Click the `.ms-selectable li.ms-elem-selectable` whose text matches → underlying select.selectedOptions updates. 5. Picker `submit` btn. 6. Back in edit dialog, set `#form_style_position_{left,top,width,height}` inputs (fire input+change). 7. Edit-dialog `submit` saves geometry+media LIVE but does NOT close — **close via `.ui-dialog-titlebar-close`** (geometry already persisted, so X is safe). Run ≤3 per evaluate_script call; the hardened builder polls every dialog transition.

### Endnotes apparatus box (2026-05-31 — DONE)
Added a peripheral **Endnotes** text node (`4644375`) at lower-left periphery `left:40, top:2300`, dashed 2px black border + 8px padding (reference apparatus, like the bibliography at `4643428` left:40 top:580). 6 paragraphs: heading + 5 endnotes (Barry *0.5 Microcurie Radiation Installation*; Barry carrier-wave works; De Maria *The Lightning Field*; Turrell *Afrum (White)*; McCall *Line Describing a Cone*). Work titles italicised via `<em>`; curly quotes + en-dashes preserved verbatim. Box ~600–620 wide × ~1740 tall.

### ⚠️ Geometry round-trip shrink (box-sizing) — known gotcha
A text node's stored geometry **shrinks by ~20px in BOTH dims per save→reload cycle** (= 2×border 2px + 2×padding 8px = 20px). RC stores one box model but re-applies as the other, losing the border+padding each round trip. Implications when sizing a *bordered* box:
- Don't chase pixel-perfect height across reloads — it will drift smaller. **Oversize generously** (e.g. target +60–80px taller than content) so it still fits after the shrink.
- `Editor.notify('tool.resize', {...})` and direct inline-style writes **do NOT persist** — only the genuine resizable `_mouseStop` lifecycle saves geometry server-side.
- The resizable SE-handle lifecycle gets **clamped when the handle is off-screen** (box taller than viewport → height/width deltas come back partial). No fix found; just oversize and accept ~580–620 final width.
- `.tool-content` has `min-height:100%`, so its `scrollHeight` tracks the box height, not the real content height. To measure *real* content height, clone the inner into an off-DOM div with `height:auto;min-height:0` at the target inner width.

## Media grouping (future ref, per user)
Keep TWO distinct media groups — they are laid out differently:
- **Archive group**: the 48 archive images that stayed *in the archive* → one RC **Slideshow** tool.
- **Scattered group**: the 12 field photos that were scattered around the exposition as individual `kind:"field"` islands → placed at their own scatter coords, one image tool each.
Plus the 6 model turntable MP4s. Do not lump these three together.
