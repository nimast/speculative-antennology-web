// Builds the RC creation payload for the 44 static text islands
// from Notion data (data/islands.generated.js) + style consts.
import { readFileSync, writeFileSync } from 'node:fs';

const g = {};
new Function('window', readFileSync('./data/islands.generated.js','utf8'))(g);
const ISL = g.SA_ISLANDS;

// RC-hosted font css names
const GROT = "'nimbus sans l',sans-serif";   // Neue Haas Grotesk / Helvetica
const SERIF = "'crimson pro',serif";          // Times New Roman
const MONO = "'courier prime',monospace";     // Courier New

const esc = s => String(s==null?'':s);
const DONE = new Set(["title","ess-1","ess-13","ess-2","ess-14","ess-6","ess-15","ess-16","ess-17","ess-18","ess-4","ess-19"]);

function htmlFor(it){
  const k = it.kind;
  if (k === 'prose'){
    return `<div style="font-family:${GROT};font-size:14px;line-height:1.5;color:#000"><p>${esc(it.text)}</p></div>`;
  }
  if (k === 'whisper'){
    return `<div style="font-family:${SERIF};font-size:17px;font-style:italic;line-height:1.4;color:#000">${esc(it.text)}</div>`;
  }
  if (k === 'note'){
    return `<div style="font-family:${GROT};font-size:10.5px;text-transform:uppercase;letter-spacing:1px;line-height:1.5;color:#000">${esc(it.text)}</div>`;
  }
  if (k === 'gloss'){
    return `<div style="font-family:${GROT};font-size:14px;font-weight:500;line-height:1.5;color:#000">${esc(it.term)}</div>`
      + `<div style="font-family:${SERIF};font-size:12.5px;line-height:1.45;color:#000;margin-top:.35rem">${esc(it.def)}</div>`;
  }
  if (k === 'pullquote'){
    return `<blockquote style="font-family:${SERIF};font-size:29px;font-style:italic;line-height:1.15;color:#000;margin:0">${esc(it.q)}</blockquote>`
      + (it.cite ? `<cite style="display:block;font-family:${GROT};font-size:10px;font-style:normal;text-transform:uppercase;letter-spacing:1.8px;color:#555;margin-top:.6rem">${esc(it.cite)}</cite>` : '');
  }
  if (k === 'method'){
    const rows = (it.steps||[]).map((s,i)=>
      `<p style="margin:0 0 .5rem 0"><span style="font-family:${MONO};font-size:10px;text-transform:uppercase;letter-spacing:1.4px;color:#555;margin-right:.6rem">${String(i+1).padStart(2,'0')}</span>`
      + `<span style="font-family:${SERIF};font-size:13px;color:#000">${esc(s)}</span></p>`).join('');
    return `<div>${rows}</div>`;
  }
  if (k === 'bib'){
    const rows = (it.entries||[]).map((e,i)=>
      `<p style="margin:0 0 .35rem 0;font-family:${SERIF};font-size:12px;line-height:1.4;color:#000"><span style="font-family:${MONO};font-size:10px;color:#555;margin-right:.5rem">${String(i+1).padStart(2,'0')}</span>${e}</p>`).join('');
    return `<div>${rows}</div>`;
  }
  if (k === 'colophon'){
    const c = `font-family:${GROT};font-size:11px;text-transform:uppercase;letter-spacing:1px;line-height:1.7;color:#000;margin:0`;
    return `<p style="${c}">Toister · Astarhan · 2026</p>`
      + `<p style="${c}"><em>an open register. the field remains unbounded.</em></p>`
      + `<p style="${c}">set in Neue Haas Grotesk · Times · Courier</p>`;
  }
  return null;
}

const payload = ISL
  .filter(i => !DONE.has(i.id) && i.kind !== 'field')
  .map(i => ({ id:i.id, kind:i.kind, x:i.x, y:i.y, w:i.w||460, html: htmlFor(i) }))
  .filter(p => p.html);

writeFileSync('./.claude/rc-build/island-payload.json', JSON.stringify(payload, null, 1));
console.log('payload islands:', payload.length);
const byk={}; payload.forEach(p=>byk[p.kind]=(byk[p.kind]||0)+1);
console.log(byk);
