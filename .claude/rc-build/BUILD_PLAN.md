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
- [ ] #5 Build all static text islands at original scatter coords (12 placed so far, see below)
- [ ] #6 Place archive slideshow + model clips into the layout
- [ ] #7 Recreate the 39 inter-island threads with the shape tool
- [ ] #8 Convert bibliography to MHRA author-date References
- [ ] #9 JAR metadata: license, abstract (125–250 words), ≥5 keywords, linked TOC (RC TOC tool), title/author

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
