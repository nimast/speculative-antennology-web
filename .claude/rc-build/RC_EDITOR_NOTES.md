# Driving the Research Catalogue graphical editor (reverse-engineered notes)

Target: building the *Speculative Antennology* exposition in RC's **graphical editor**
(URL pattern `https://www.researchcatalogue.net/editor/<researchId>/<weaveId>`).
This file documents the mechanics so it can become a reusable skill.

## Editor stack
- Custom RC editor on **jQuery + jQuery UI** (draggable/droppable/resizable/selectable).
- Rich text via **TinyMCE 6** (inline, no iframe; `.tox-*` classes; `RcTinyMceCompat`).
- Global objects: `Editor` (static API: loadItem, editItem, selectItem, removeItems,
  alignItems, layersToFront/Back…), `ToolList`, `WeaveList`, `toolbar`.
- DOM: `#container-editor` > `#container-content` (`ui-selectable`, holds the
  `mousedown`/`click` handlers) > `#content` (the page, `grid graphical ui-droppable`,
  size shown in Map panel, default **1382×823 px**).

## Toolbar tools (left to right), by icon span class
1. `mif-paragraph-left` — **Text** (creates `tool-simpletext`)
2. `mif-embed2` — Embed/HTML  ⚠️ **banned by JAR** (no iframes) — do not use
3. `mif-image` — **Image**
4. `mif-music` — **Audio**
5. `mif-film` — **Video**
6. `mif-images` — **Slideshow** (multi-image)
7. `mif-file-pdf` — **PDF**
8. `mif-youtube-play` — YouTube/embedded video
9. `mif-widgets` — **Shape** (for connector lines / rectangles)
10. `mif-event-available` — (calendar/event-style tool)
11. `mif-stack` — layers

Right panel tabs: **Map** (object list + minimap), **Media**, **Popover**, **Ref**, **Pages**.

## Creating an object = drag a toolbar tool onto the canvas
Toolbar tools are `.tool-draggable.ui-draggable`; the canvas `#content` is `ui-droppable`.
A plain `.click()` only *arms* nothing useful — you must perform a **jQuery UI drag**
from the tool to a drop point. Synthetic native MouseEvents do NOT work; **jQuery
`.trigger($.Event(...))` with `pageX/pageY` DOES.**

```js
const $ = window.jQuery;
const tool = document.querySelector('span.icon.mif-paragraph-left').closest('.tool-draggable');
const r = tool.getBoundingClientRect();
const sx = r.x + r.width/2, sy = r.y + r.height/2;
const dropX = 300, dropY = 220;            // client coords of drop point
const mk = (t,x,y)=>$.Event(t,{which:1,button:0,buttons:1,pageX:x,pageY:y,clientX:x,clientY:y,view:window});
$(tool).trigger(mk('mousedown', sx, sy));
$(document).trigger(mk('mousemove', sx+6, sy+6));   // exceed drag threshold
$(document).trigger(mk('mousemove', (sx+dropX)/2, (sy+dropY)/2));
$(document).trigger(mk('mousemove', dropX, dropY));
$(document).trigger(mk('mouseup',  dropX, dropY));
```
Result: a new `.tool.tool-simpletext` div is appended to `#content`, server-assigned a
`data-id`, and it opens in inline edit mode. It appears in the Map list ("text #1" etc.).

### Drop coordinate → canvas coordinate mapping
Canvas origin (ruler 0,0) sits at client ≈ **(18, 117)** when scrolled to top.
A drop at client `(cx, cy)` places the tool's **top-left** at canvas
`(cx-18, cy-117)`. So to put a box at canvas `(X, Y)`: drop at client `(X+18, Y+117)`
— but only if that point is within the visible viewport (else scroll first, or
create then drag).

## Object data model
`.tool` divs carry a `dataset`: `id, locked, editable, tool` (e.g. "simpletext"),
`title, date, options, popoverOptions, rotate, lastModifiedBy, lastModifiedAt`.
Geometry is inline `style.left/top/width/height` (px). Default new size 150×150.
Children include `.rc-inline-editor-toolbar`, `.tool-content` (the editable body),
`.ui-resizable-handle ui-resizable-{n,e,s,w,se}` handles.

## Fonts (RC-hosted webfonts vs system)
TinyMCE `font_family_formats` exposes both RC-hosted webfonts (lowercase css names —
served by RC, JAR-safe) and plain system fonts (capitalized — JAR warns these are unstable).
Hosted: Anton, Arimo, Carlito, Lato, **NimbusSansL**, Roboto, PtSans, OpenSans,
**CrimsonPro**, LibreBaskerville, Merriweather, **CourierPrime**, IbmPlexMono, RobotoMono.
Sizes: 8–144pt.

**Mapping for this project (source → RC-hosted):**
- grotesk / body / labels / captions (Helvetica Neue, Helvetica, Arial) → **NimbusSansL**
- serif / prose / quotes (Times New Roman) → **CrimsonPro** (no hosted Times)
- mono / numbers / colophon (Courier New) → **CourierPrime**

## Persistence model (CONFIRMED)
RC saves over a **WebSocket**: `Editor.notify(event, data)` === `Editor.CollaborationSocket.emit(event, data)`.
But a bare emit is NOT honored on its own — the server only persists geometry when the
change comes through the genuine jQuery UI gesture lifecycle (which emits `tool.update`
for moves and saves size via the resizable `stop` → `_updateChildren`). So you must drive
the real widget lifecycle, not just `notify`.

## Resizing an object programmatically (CONFIRMED — persists across reload)
A synthetic `mousedown` on the SE handle does NOT resize: both **draggable and resizable
bind mousedown on the same element and share a module-level `mouseHandled` lock**, so
draggable wins and you start a *move*, not a resize. Fix: call the resizable widget's
**internal mouse lifecycle methods directly**:
```js
const $ = window.jQuery;
const t = document.querySelector('#content .tool[data-id="ID"]');
const inst = $(t).data('ui-resizable');
const handle = t.querySelector('.ui-resizable-se');
const hr = handle.getBoundingClientRect();
const sx = Math.round(hr.x+hr.width/2), sy = Math.round(hr.y+hr.height/2);
const curW = parseInt(t.style.width), curH = parseInt(t.style.height);
const dx = TARGET_W - curW, dy = TARGET_H - curH;
const mk = (type,x,y)=>{ const e=$.Event(type,{which:1,button:0,buttons:type==='mouseup'?0:1,pageX:x,pageY:y,clientX:x,clientY:y,view:window}); e.target=handle; return e; };
const down = mk('mousedown', sx, sy);
inst._mouseDownEvent = down; inst.axis = 'se';
inst._mouseCapture(down);
inst._mouseStart(down);
inst._mouseDrag(mk('mousemove', sx+dx, sy+dy));
inst._mouseStop(mk('mouseup', sx+dx, sy+dy));   // runs RC stop handler -> saves size
```
Same internal-lifecycle trick should work for **dragging** (move) via the `ui-draggable`
instance (`$(t).data('ui-draggable')`, axis n/a) if synthetic drag misbehaves — but the
create-time drag (mousedown on tool body) does work via plain `$.Event` triggers, so moves
may only need a normal trigger sequence followed by the draggable `stop`.

The resizable `stop` (revert branch) shows the save call shape:
`Editor.notify('tool.resize', { [id]: {left, top, width, height} })`.

## Moving an object programmatically (CONFIRMED — persists)
Same internal-lifecycle trick on the **draggable** instance. Emits `tool.move`/`tool.update`.
```js
const dinst = $(t).data('ui-draggable');
const r = t.getBoundingClientRect();
const sx = Math.round(r.x+20), sy = Math.round(r.y+10);
const dx = TARGET_LEFT - parseInt(t.style.left), dy = TARGET_TOP - parseInt(t.style.top);
const mk = (type,x,y)=>{ const e=$.Event(type,{which:1,button:0,buttons:type==='mouseup'?0:1,pageX:x,pageY:y,clientX:x,clientY:y,view:window}); e.target=t; return e; };
const down = mk('mousedown', sx, sy);
dinst._mouseDownEvent = down;
dinst._mouseStart(down);
dinst._mouseDrag(mk('mousemove', sx+dx, sy+dy));
dinst._mouseStop(mk('mouseup', sx+dx, sy+dy));
```
Works even when the box is scrolled off-screen (deltas, not absolute hit-testing).
NOTE: only the **create drop** needs a visible client coordinate (droppable hit-test).
After creating at a visible point, move/resize to the real canvas position off-screen.

## Setting text + fonts (CONFIRMED — persists)
A box auto-enters edit mode on create. To set content:
```js
window.Editor.editItem(id);                 // enter edit -> spawns tinymce.activeEditor
// wait ~700ms
const ed = window.tinymce.activeEditor;
ed.setContent(html); ed.setDirty(true);
// exit edit by clicking empty canvas -> emits tool.reload (saves content+geometry):
const cc = document.querySelector('#container-content');
const cr = cc.getBoundingClientRect();
const ex = cr.x+cr.width-20, ey = cr.y+20;
['mousedown','mouseup','click'].forEach(tp => $(cc).trigger($.Event(tp,{which:1,button:0,buttons:tp==='mouseup'?0:1,pageX:ex,pageY:ey,clientX:ex,clientY:ey,view:window})));
```
Inline font styling persists: wrap paragraphs with `style="font-family:'nimbus sans l',sans-serif; font-size:36pt; ..."`.
RC-hosted css font names (lowercase): `'nimbus sans l'` (grotesk), `'crimson pro'` (serif), `'courier prime'` (mono).
Editing disables drag/resize (`ui-draggable-disabled`) — always exit edit before move/resize.
Auto-fit height: after setText, read `.tool-content` scrollHeight and resize box to fit.

## Simple-media UPLOAD (CONFIRMED) — ⚠️ WINDOWS PATHS REQUIRED
Chrome runs on **Windows** (debug port 9223); WSL drives it via CDP. `upload_file`/
`DOM.setFileInputFiles` with a **WSL path** (`/home/nimast/...`) silently creates a
**0-byte file** → media saves as `missing-media`. FIX: copy files to
`/mnt/c/temp/rc-upload/` and pass **Windows** paths (`C:\temp\rc-upload\<file>`).
**Always verify `document.querySelector('#form_image_media').files[0].size > 0` before submit.**
Real (non-empty) uploads keep the dialog open during the binary transfer — poll for the
form to disappear (`#form_image_name` gone) before continuing.

Flow: `Dialog.addSimpleMedia()` → DialogForm `/researches/{rid}/simple-medias/new` →
set `#form_type_type='image'` → click "next" → image form: `#form_image_media` (file),
`#form_image_name`, `#form_image_copyrightHolder`, `#form_image_license` (select:
all-rights-reserved | public-domain | cc-by | cc-by-nd | cc-by-sa | cc-by-nc |
cc-by-nc-nd | cc-by-nc-sa), `[name="form[image][ariaLabel]"]`, `[name="form[image][description]"]`,
then SUBMIT. **Delete**: `Dialog.removeSimpleMedia([ids])` → click the btn-danger "delete"
(persists server-side; reversible via "Restore deleted objects"). Note `Editor.removeSimpleMedia`
is client-only and does NOT persist.

List endpoint (200 when authed): `/editor/{rid}/{wid}/simple-medias/list` → `<tr class="simple-media [missing-media]" data-id ...>` rows with name + WxH dims.

## Picture & Slideshow tools — creating + attaching media (CONFIRMED)
See `window.__RC.buildPicture` (re-inject each session) and BUILD_PLAN.md for the full
step list. Key facts: picture tool drag opens NO dialog → `Editor.editItem(id)`, **poll
until the `media` tab anchor exists** (tab-not-ready race caused a mid-batch failure) →
`media` tab → `select media` btn → picker has `<select id="form_mediaList">` multiselect
(max 1); click the matching `.ms-selectable li.ms-elem-selectable` → picker `submit` →
set `#form_style_position_{left,top,width,height}` in the `style` tab → edit `submit`
saves LIVE but does NOT close → close via `.ui-dialog-titlebar-close`. Slideshow attach
uses `Dialog.selectResource(toolId)` similarly. Run ≤3 builds per evaluate_script call.

## Deleting tools — ⚠️ `Editor.removeItems` is CLIENT-ONLY
`Editor.removeItems([ids])` removes from the DOM + emits a socket notify but does NOT
persist — the tools **reappear on reload**. The persisting delete is
**`Dialog.removeItems([ids])`** → opens a "delete tool" confirmation DialogForm →
click the **btn-danger "submit"** button (recoverable later via Options → "Restore
deleted objects"). Same client-only/persisting split as `Editor.removeSimpleMedia` vs
`Dialog.removeSimpleMedia`.

## ⚠️ Orphan tools can be invisible until reload
Half-built / duplicate tools from a prior session may be saved **server-side but not
rendered into `#content` until the page reloads**. So a live `#content .tool` sweep can
under-count, and an overlap/pack pass run against it will miss them. **Before any layout
pass: reload, then sweep.** Tell-tale orphan = a `tool-simpletext` stuck at default
**150×150** (real islands were all fit to content) — and its text usually duplicates a
properly-placed island. (2026-05-31: 13 such orphans piled at top-left, ids 4643468/
4643511/4643512/4643513/4643514/4643515/4643519/4643520/4643521/4643523/4643524/4643525/
4643526 — all duplicates, deleted via `Dialog.removeItems`.)

## Session model
HTTP session cookie can expire independently of the websocket (`Editor.isOnline()` may
still be true). Expired → REST endpoints (pickers, lists) 401 "Session expired". Re-login
refreshes the cookie.

## TODO / to verify
- [x] Size save: confirmed via resizable internal lifecycle (persists across reload).
- [x] Text content + styling via `tinymce.activeEditor.setContent(html)` then save.
- [x] Slideshow creation + picture tools + media upload/attach (Windows-path upload).
- [x] Upload 6 model MP4s: placed as video tools, solid 1px black border, 0 overlaps, license cc-by-nc-nd (persists across reload).
- [x] Extend the archive Slideshow with the remaining archive images: 42 new uploads added to slideshow tool `4644005` via the two-step REST flow below (the previously-uploaded 7 archive media were intentionally left out per nimast — slideshow now has 43 slides = Roof-yagi + 42 new).
- [x] Shape/connector line drawing for the threads: 49 shape tools (10 `arrowRight` for the 11-step narrative arc, 39 `line` cycling solid/dotted/dashed), all sent to back layer via `Editor.LayerList.layersToBack`. See "Direct REST upload / shape creation" + "Shape tool" below.

## Direct REST endpoints — bypass the drag-drop UI (CONFIRMED, faster than synthetic gestures)

These return `rc-form-status: success` and `rc-form-url: …` headers when an AJAX `X-Requested-With: XMLHttpRequest` request is used.

**Create any tool** — `POST /editor/{rid}/{wid}/tools/new?simpleMedia=null` (Content-Type `application/x-www-form-urlencoded`)
Body: `toolType=shape&left=X&top=Y&width=W&height=H` (or `toolType=simpletext|picture|video|slideshow|…`).
Returns new tool id; the canvas needs `Editor.loadItems()` (or a manual reload) to render it.

**Edit any tool** — `POST /editor/{rid}/{wid}/tools/{id}/edit` with multipart `FormData` mirroring the inline edit dialog (`form[common][title]`, `form[style][position][left/top/width/height/rotate]`, `form[style][background][backgroundColor]`, `form[media][...]`, `form[options][...]`, etc.). Add `form[_buttons][submit]=''`. Validation echoes the form HTML at status 422 if a required field is missing.
**Preserve-existing-fields pattern:** GET the same `/edit` URL first, scrape every `<input|select|textarea>[name]` into a `FormData`, apply your overrides, then POST. Used to batch-flip video `loop`/`autoplay` and text `backgroundColor` across 57 tools without losing other settings.

**Batch reorder (z-index)** — `Editor.LayerList.layersToBack(children)` / `…layersToFront(children)` where `children = Editor.LayerList.children(ids)`. Posts to `/editor/{rid}/{wid}/tools/update` with `data: {id: {index}, …}`. Persists across reload. After ordering, optionally `Editor.clearItemSelection()`.

**Batch delete** — `Dialog.removeItems([ids])` opens a confirm dialog; click `#_buttons_submit`. Direct REST `POST /editor/{rid}/{wid}/tools/delete` with `selection[]=…` returns 422 "selected choice is invalid" unless those ids are present as `<option>` in the form's hidden select; populate via the dialog flow rather than fighting it. (Same dead-end I hit on three stray test shapes — easier to right-click delete in the UI.)

## Simple-media upload — direct REST flow (alternative to the Windows-path UI flow)

Two-step, no file picker:

1. `POST /editor/{rid}/{wid}/tools/{toolId}/simple-medias/new` (multipart, no file) with
   `form[image][name]`, `form[image][copyrightHolder]`, `form[image][license]` (default `all-rights-reserved`),
   `form[image][ariaLabel]`, `form[image][description]`, `form[_buttons][finish]=''`.
   Server responds with `rc-form-status: success` and a `rc-form-url: /researches/{rid}/simple-medias/{slotId}/edit` header containing the new slot id.
2. `POST {rc-form-url}` (multipart) with only `form[image][media]=<File>` to attach the binary.

Result: the media is created in the slideshow's child list *and* in the media library, and the slot becomes a slide on `toolId`. **Cross-origin gotcha:** fetching the source file from `http://localhost:…` is blocked as mixed content from the HTTPS editor — host the files at the project's HTTPS deploy URL (e.g. `https://speculative-antennology-web.vercel.app/assets/archive/ant-NN.jpg`, CORS open) and `fetch()` from there. Vercel was 49/49 successful.

## Shape tool — connectors / lines / arrows (CONFIRMED)

`POST /tools/new?simpleMedia=null` body `toolType=shape&left=…&top=…&width=…&height=…` to create, then edit:
- `form[media][shapeType]` ∈ `rect | circle | line | verticalLine | arrowDown | arrowLeft | arrowRight | arrowUp`
- `form[media][fillColor]`, `form[media][strokeColor]` (e.g. `black`)
- `form[media][strokeWidth]` (px, integer text)
- `form[media][strokeDashArray]` ∈ `'' (solid) | '3,3' (dotted) | '7,3' (dashed)`
- `form[style][position][rotate]` (degrees, integer)

**Drawing a connector A → B**: treat the line as a horizontal SVG (`<line x1=0 y1=h/2 x2=W y2=h/2>`) inside a bounding box, then rotate the box. Set width = `dist(centreA, centreB)`, height = 4–16 (use larger for arrow tips), centre the box on the midpoint, rotate by `atan2(dy, dx) * 180/π`. To end an arrow with a small gap before the target box edge, project from the target centre back along the unit vector by `min(hw/|ux|, hh/|uy|) + gap` (~30px gap looked clean here). Same for the source side. Use shapeType `arrowRight` (the arrowhead follows the rotation).

`.tool-shape .tool-content { overflow: hidden }` clips the SVG to the bounding box — fine for thin rotated lines, but a tall rotated `arrowRight` may visually clip its tip if the bounding box is too short; bump `height` to ~16px and `strokeWidth` to ~4 for visible arrows.

## Video tool — autoplay + loop

Edit fields (checkboxes; send `'1'` to enable):
- `form[options][settings][loop]`
- `form[options][settings][autoplay]`
- `form[options][settings][stopOtherPlayers]`
- `form[options][appearance][displayVolume]`, `displayMinimal`, `hidePlayer`

## Text tool — opaque background

`form[style][background][backgroundColor] = 'white'` on `tool-simpletext` makes the island opaque so back-layer threads/lines no longer show through the prose. Apply by batch (preserve-existing-fields pattern above) — flipped all 51 text tools cleanly.

## Exposition coordinates (this project)

- Research id `4312417`, weave id `4312418`.
- Canvas size (Map panel): 8700 × 5074 px.
- Archive slideshow tool id: `4644005`.
- Thread shapes occupy z-index 1–50 (back); islands occupy 51+ (front).

## Tool-to-tool hyperlinks (CONFIRMED 2026-09-23)

The public view emits `<a id="tool-<toolId>"></a>` inside every tool, and the viewer's
scroll container (`#container-weave`) jumps to it on load or on click. RC's own
right-click "copy tool link" (added to the context menu 2025-06-16) yields
`/view/<rid>/<wid>/<x>/<y>#tool-<toolId>` — the `x/y` is just the current scroll
position, the `#tool-` fragment is what matters. Documented in the RC Guide
("Hyperlinking → Link to a Specific Tool or Coordinate") and FAQ 2.13.

The TinyMCE `rclink` dialog has no tool picker (URL field + page picker + popover only),
so insert programmatically: `Editor.editItem(id)` → poll for `tinymce.activeEditor`
whose body is inside the tool → `ed.setContent(ed.getContent() + navHtml)`,
`ed.setDirty(true)` → exit by the synthetic empty-canvas click (see "Text tool" above).
Link HTML that persisted across reload:
`<a href="https://www.researchcatalogue.net/view/4312417/4312418#tool-4643358" style="color:#000">→ II · Against the Visible</a>`
Verify server-side with `fetch('/view/4312417/4312418', {cache:'no-store'})` and grep the
segment after `id="tool-<sourceId>"`. Note: the viewer intercepts the click and scrolls
without changing `location.hash`, so browser Back does not undo the jump.
Gotcha: `navigate_page` to a URL that differs only by hash does NOT reload — use
`type: 'reload'` to see freshly saved content in the view tab.

### In-text anchors survive the sanitizer (CONFIRMED 2026-09-23)
`<a id="ref-05"></a>` (and `id`/`data-*` on spans) inside a text tool persist through
setContent → save. A link to `…/view/<rid>/<wid>#ref-05` makes the viewer scroll so the
anchor sits at the viewport's top-left — same behaviour as `#tool-` links. Used for
per-entry bibliography anchors (`ref-01..28` in tool 4643428) and endnotes (`note-1..5`
in 4644375). `location.hash` does update for these, unlike `#tool-` clicks.

### Default position (Options → "Set default position")
`Editor.setDefaultAspect(x, y)` — ⚠️ args are combined with the CURRENT scroll via
bitwise OR (`x |= scrollLeft`), so never pass coordinates. Instead:
`Editor.ContentList.CONTAINER_SCROLL.scrollLeft(x).scrollTop(y); Editor.setDefaultAspect();`
It opens a DialogForm to `/editor/<rid>/<wid>/update-default-aspect?x=&y=` which applies
on open (no submit); close it with `.ui-dialog-titlebar-close`. The dialog text echoes the
saved x/y. Currently set to (1940, 460) so section I lands top-left.

### Batch resize/move via REST preserve pattern (CONFIRMED)
GET `/tools/<id>/edit` (XHR) → scrape inputs into FormData → override
`form[style][position][height|top|…]` → POST with `form[_buttons][submit]=''` →
`rc-form-status: success`. 35 tools in one evaluate_script call, all persisted; no
viewport-clamping issue (unlike the resizable-widget gesture). Fit height =
`.simple-text-editor-content` rect height + 20 (8px padding ×2 + 2px border ×2) + ~6.
Shape lines whose endpoints hit a moved box: endpoints = centre ± (w/2)(cosθ, sinθ);
recompute width/left/top/rotate the same way and POST via the same pattern.

### Text-tool gotchas hit this session
- `evaluate_script` calls do NOT share `window.*` state reliably — hardcode lookup
  tables in each call rather than stashing them on `window`.
- Reading another tool's DOM right after exiting edit on a neighbour can race its
  re-render (`.simple-text-editor-content p` momentarily null): read all titles first.
- Section IV (4643360) had lost its `<p>` structure (title run into body); rebuilt as
  title `<p>` + body `<p>` using section II's inline styles.

### Creating text tools purely over REST (CONFIRMED 2026-09-23)
`POST /tools/new?simpleMedia=null` (`toolType=simpletext&left&top&width&height`) returns
the new id in the `rc-form-url` header (`…/tools/<id>/edit`). Then the preserve-pattern
POST with `form[media][textcontent]=<html>` + style fields (padding, dashed border,
`backgroundColor=white`) renders correctly after reload — no TinyMCE needed. Used for the
11 figure captions (`data-title` = `caption:<island-key>`, ids 4895397–4895407).

### House style for the numbered sections (set by Nimrod on section V, 2026-09-23)
Box padding 15 L/R, 12 T/B (form[style][padding][*]); solid 2px border. Paragraphs:
- title `<p …10pt uppercase…><span style="font-size: 12pt; font-family: 'nimbus sans l', sans-serif;"><strong>…</strong></span></p>`
- body `<p …crimson pro…><span style="font-size: 11pt; font-family: 'libre baskerville', serif;">…</span></p>`
- blank `<p style="font-family: 'crimson pro', serif; line-height: 1.5; margin: 0px; color: #000000;"><br></p>`
- nav (next first, then back) `<span style="text-decoration: underline; font-family: 'nimbus sans l', sans-serif;"><a style="color: #000000; text-decoration: underline;" href="…#tool-<id>">→ …</a></span>`
Layout rule: ≥15px gap between any two non-shape tools; no text tool may scroll.
Verification = dump geometry (left/top/w/h + content height) → check pairs with
`gx<15 && gy<15`. Current default position (1940,160) = title + section I.

### ⚠️ Tool geometry is CONTENT-BOX (learned the hard way, 2026-09-23)
`form[style][position][width|height]` (= `style.width/height`) exclude padding and border.
Rendered footprint = width + padL + padR + 2·border  ×  height + padT + padB + 2·border
(a 460-wide section with 15px sides and 2px border occupies 494px). Fit height for a
text tool = `.simple-text-editor-content` rect height + ~12, with NO padding added.
Always run gap/collision checks on rendered rects from the **view page** (`#weave .tool`
getBoundingClientRect + container scroll), after `document.fonts.ready` + ~2.5s — the
editor measured Crimson Pro ~20px shorter before webfonts settled.
Thread-line endpoints: lines are centre-to-centre of the footprint; the true key→tool map
(ess-1→I 4643356, ess-2→III 4643359, ess-4→X 4643370, ess-6→V 4643361, ess-18→IX 4643369,
bib→4643428, model-0a..2b→video #1..#6 in title order) is in this session's scratch
`line-plan` and was used to redraw all 35 lines; wh-3/wh-4/gl-6 no longer exist in RC, so
their 4 lines were deleted.
Stored link markup puts `style` before `href` — match `<a\b[^>]*href=…` not `<a href=…`.

### Centring a link target (CONFIRMED 2026-09-23)
Viewer `scrollToElement(el)`: text tools scroll to top-left (`left-7, top-30`); any
NON-text tool is centred (`left - width/2 + el.width/2`). So each numbered section has a
4×4 transparent `rect` shape (`fillColor`/`strokeColor` empty, `strokeWidth 0`,
`data-title` = `anchor:<sectionId>`, ids 4895792–4895803, sent to back) at its footprint
centre, and the nav links point at `#tool-<anchorId>`. Same-weave links without a hash
(`/view/<rid>/<wid>/<x>/<y>`) are also intercepted: animated scroll to x/y, no reload.

### Field-note labels + picture-in-caption (Nimrod's pattern, 2026-09-23)
Caption box gets `paddingTop = picH + 4 + 13 + 18` and width ≥ picW + 30; picture moved
to (cap.left+13, cap.top+15) and `layersToFront` above the caption. A separate label tool
(237×30, no border, no background, `data-title` = `fieldnote:<key>`) sits at
(cap.left+15, cap.top−36) with `<p><em><span style="font-family: 'libre baskerville', serif;">field note #N:</span></em></p>`.
Numbers are arbitrary ("random"). Same label above the four big-font quote boxes.
Gap solver treats caption+picture+label (and quote+label) as one unit.
`POST /tools/new` returns the new tool as HTML in the BODY (`data-id="…"`), not a header.
Fit heights from the VIEW tab's measurements, not the editor's (editor renders Crimson
Pro/Baskerville ~20px shorter): `styleH += spanBottom − toolContentBottom + 8`.

### ⚠️ In-text anchor links must be RELATIVE (`href="#ref-05"`) — 2026-09-23
The viewer binds a click handler to every `a[href*="/view/<rid>/<wid>"]`: `#tool-…` →
scrollToElement, anything else → scroll to the URL's x/y (i.e. the default position) and
`return false`. So an absolute link to `#ref-05` silently goes nowhere. A relative
`href="#ref-05"` escapes the selector and gets native fragment scrolling (survives the
sanitizer). Native scrolling uses inline:nearest, so a target to the RIGHT of the current
view lands on the right edge — link to whole text tools via absolute `#tool-<id>` instead
(top-left), and reserve `#ref-NN` for the bibliography, which sits at the far left.
Bibliography is now 26 entries (01 Barry Radiation and 12 McCall moved into captions
4895404 / 4895407 as a second 9pt credit line; all `#ref-` links renumbered).
Height refit from the view oscillates ±40px on two boxes (4643428, 4643635) between
loads — only ever grow heights, never shrink.

## STATE as of 2026-09-24 (end of session) — resume here
Exposition: editor https://www.researchcatalogue.net/editor/4312417/4312418 · view https://www.researchcatalogue.net/view/4312417/4312418
Driven entirely over REST from a logged-in tab via chrome-devtools `evaluate_script` (tool ids in this file; helpers: preserve-pattern `editTool`, gap solver, line recompute — all in the session transcript, rewrite from the notes above).

Done: section nav (next above back, underlined, centred via anchor shapes 4895792–4895803); section V house style applied to all 11; 41 field-note labels (arbitrary numbers) above every non-section text box, dashed borders removed everywhere; 11 captions with picture inside (paddingTop) + Notion credit line; endnotes 1/2/5 moved under pictures 8/10/11, endnotes renumbered 1–2; bib entries 01 Barry + 12 McCall moved into captions, bib renumbered 01–26; all ref links relative and working; 10 arrow shapes + 4 orphan lines deleted, 35 thread lines redrawn centre-to-centre; default position (1940,160) = title + section I; layout: no unit closer than 15px, no text scrolls (verified from the view page).

Open items / to check by eye:
- Endnote 2 cites Lippard, *Six Years* — not in the bibliography (unlinked).
- Section IV prose cites "Hilarie Sheets, 'A Tribute for Turning Light into Art'" but bib 09 (was 10) is Carol Kino, different title — unlinked, needs a decision.
- Section IV was rebuilt as title + ONE body paragraph (original paragraph breaks lost).
- McCall caption credit text was composed from the asset's commit message — verify wording.
- Label numbers are random; renumbering = one REST textcontent edit per label (`data-title` fieldnote:*).
- Video below section VII was moved 62px left; video model-2b moved up ~1000px to (4099,~1937) by the solver — check it reads well.
- Two boxes (bib 4643428, whisper 4643635) measure ±40px differently between loads; heights were left at the larger value.
