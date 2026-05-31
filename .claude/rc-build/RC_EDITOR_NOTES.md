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

## TODO / to verify
- [x] Size save: confirmed via resizable internal lifecycle (persists across reload).
- [ ] Text content + styling: via `tinymce.activeEditor.setContent(html)` then save.
- [ ] Exit edit mode to re-enable drag/resize (object is `ui-draggable-disabled` while editing).
- [ ] Extend page height for the tall vertical layout (page default 823 tall).
- [ ] Slideshow creation + adding the 48 images.
- [ ] Shape/connector line drawing for threads.
