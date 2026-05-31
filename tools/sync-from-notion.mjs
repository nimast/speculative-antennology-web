#!/usr/bin/env node
// Pull Notion-tracked islands from the Exposition Text Fragments DB
// and regenerate data/islands.generated.js.
//
//   NOTION_TOKEN=secret_xxx node tools/sync-from-notion.mjs
//
// Exits 0 on success. Exits 1 on any parsing or API error.
// Zero dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = 'c721d57e7d21435097690b0bb8c0b25c';

if (!TOKEN) {
  console.error('NOTION_TOKEN env var is required');
  process.exit(1);
}

// Notion → JSX kind mapping. Notion uses display names; JSX uses internal codes.
const KIND_TO_JSX = {
  'title':         'title',
  'essay':         'prose',
  'pullquote':     'pullquote',
  'whisper':       'whisper',
  'note':          'note',
  'glossary':      'gloss',
  'method':        'method',
  'bibliography':  'bib',
  'field-caption': 'field',
  'colophon':      'colophon',
};

// ───── Notion API helpers ─────────────────────────────────────────────────

async function notion(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      'Authorization':  `Bearer ${TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type':   'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Notion API ${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function queryAllFinal() {
  const out = [];
  let cursor;
  do {
    const body = {
      filter:    { property: 'Status', select: { equals: 'final' } },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    };
    const data = await notion('POST', `/databases/${DB_ID}/query`, body);
    out.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return out;
}

async function pageBlocks(pageId) {
  const out = [];
  let cursor;
  do {
    const qs = cursor ? `?start_cursor=${cursor}` : '';
    const data = await notion('GET', `/blocks/${pageId}/children${qs}`);
    out.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return out;
}

// ───── rich-text helpers ──────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function richToHtml(rt) {
  return (rt || []).map(t => {
    let s = escHtml(t.plain_text);
    if (t.annotations.bold)   s = `<strong>${s}</strong>`;
    if (t.annotations.italic) s = `<em>${s}</em>`;
    if (t.annotations.code)   s = `<code>${s}</code>`;
    return s;
  }).join('');
}

function richToPlain(rt) {
  return (rt || []).map(t => t.plain_text).join('');
}

const blockText = {
  paragraph:           b => richToHtml(b.paragraph.rich_text),
  paragraph_plain:     b => richToPlain(b.paragraph.rich_text),
  bulleted_list_item:  b => richToHtml(b.bulleted_list_item.rich_text),
  numbered_list_item:  b => richToHtml(b.numbered_list_item.rich_text),
  quote:               b => richToHtml(b.quote.rich_text),
  quote_plain:         b => richToPlain(b.quote.rich_text),
};

// ───── per-kind body parsers ──────────────────────────────────────────────

function isAllItalic(rt) {
  return rt.length > 0 && rt.every(t => t.annotations.italic && t.plain_text.trim());
}

function parseProse(blocks) {
  const out = {};
  let bs = blocks.filter(b => b.type === 'paragraph' || b.type === 'quote');

  // Trailing italic paragraph → cite
  const last = bs[bs.length - 1];
  if (last && last.type === 'paragraph' && isAllItalic(last.paragraph.rich_text)) {
    out.cite = richToPlain(last.paragraph.rich_text).replace(/^—\s*/, '').trim();
    bs = bs.slice(0, -1);
  }

  // All remaining are quote blocks → lede
  if (bs.length > 0 && bs.every(b => b.type === 'quote')) {
    out.lede = true;
    out.text = bs.map(b => blockText.quote_plain(b)).join(' ');
  } else {
    out.text = bs
      .map(b => b.type === 'paragraph' ? blockText.paragraph(b) : blockText.quote(b))
      .filter(s => s.trim())
      .join(' ');
  }
  return out;
}

function parsePullquote(blocks) {
  const out = {};
  const quote = blocks.find(b => b.type === 'quote');
  if (quote) {
    out.q = blockText.quote_plain(quote);
  } else {
    const p = blocks.find(b => b.type === 'paragraph');
    if (p) out.q = blockText.paragraph_plain(p);
  }
  const citeP = blocks.find(b =>
    b.type === 'paragraph' && isAllItalic(b.paragraph.rich_text));
  if (citeP) out.cite = richToPlain(citeP.paragraph.rich_text).replace(/^—\s*/, '').trim();
  return out;
}

function parseSingleText(blocks) {
  const text = blocks
    .filter(b => b.type === 'paragraph')
    .map(b => blockText.paragraph_plain(b))
    .join(' ')
    .trim();
  return { text };
}

function parseGloss(blocks) {
  const paragraphs = blocks.filter(b => b.type === 'paragraph');
  if (paragraphs.length === 0) return { term: '', def: '' };

  const first = paragraphs[0].paragraph.rich_text;
  let term = '', i = 0;
  while (i < first.length && first[i].annotations.bold) {
    term += first[i].plain_text;
    i++;
  }
  // Remainder of the first paragraph (if any) joins the def
  let firstRest = '';
  for (; i < first.length; i++) {
    const t = first[i];
    let s = escHtml(t.plain_text);
    if (t.annotations.italic) s = `<em>${s}</em>`;
    firstRest += s;
  }
  const restParas = paragraphs.slice(1).map(p => blockText.paragraph(p));
  const def = [firstRest, ...restParas].map(s => s.trim()).filter(Boolean).join(' ');

  return { term: term.trim(), def };
}

function parseList(blocks) {
  return blocks
    .filter(b => b.type === 'bulleted_list_item' || b.type === 'numbered_list_item')
    .map(b => b.type === 'bulleted_list_item' ? blockText.bulleted_list_item(b) : blockText.numbered_list_item(b));
}

// Notion stores field images as absolute raw.githubusercontent URLs (so Notion
// can render them). On the site, serve them from the deployment itself: rewrite
// this repo's own raw-GitHub asset URLs to relative paths so they don't depend
// on GitHub's CDN or a specific branch (preview deploys would 404 otherwise).
function toLocalAsset(url) {
  if (!url) return '';
  const m = url.match(/^https?:\/\/raw\.githubusercontent\.com\/nimast\/speculative-antennology-web\/[^/]+\/(assets\/.+)$/);
  return m ? m[1] : url;
}

function parseField(blocks) {
  const img = blocks.find(b => b.type === 'image');
  const cap = blocks.find(b => b.type === 'paragraph');
  return {
    img: toLocalAsset(img?.image?.external?.url || img?.image?.file?.url || ''),
    cap: cap ? blockText.paragraph_plain(cap) : '',
  };
}

// ───── shape an island for the generated file ─────────────────────────────

function islandFromPage(page, blocks) {
  const props   = page.properties;
  const nodeId  = props['Node ID']?.rich_text?.[0]?.plain_text;
  const nKind   = props.Kind?.select?.name;
  const x       = props.X?.number;
  const y       = props.Y?.number;
  const w       = props.W?.number;

  if (!nodeId) throw new Error(`page ${page.id} missing Node ID`);
  if (!(nKind in KIND_TO_JSX)) throw new Error(`page ${nodeId}: unknown Kind "${nKind}"`);
  if (x == null || y == null || w == null)
    throw new Error(`page ${nodeId}: missing X/Y/W (got ${x}, ${y}, ${w})`);

  const jsxKind = KIND_TO_JSX[nKind];
  const island  = { id: nodeId, kind: jsxKind, x, y, w };

  // Title and colophon are rendered hardcoded in JSX. No body parsing.
  if (jsxKind === 'title' || jsxKind === 'colophon') return island;

  let extra;
  switch (jsxKind) {
    case 'prose':     extra = parseProse(blocks);     break;
    case 'pullquote': extra = parsePullquote(blocks); break;
    case 'whisper':
    case 'note':      extra = parseSingleText(blocks); break;
    case 'gloss':     extra = parseGloss(blocks);     break;
    case 'method':    extra = { steps:   parseList(blocks) }; break;
    case 'bib':       extra = { entries: parseList(blocks) }; break;
    case 'field':     extra = parseField(blocks);    break;
  }
  return { ...island, ...extra };
}

// ───── threads: extract Connects, map page IDs → Node IDs ─────────────────

function buildThreads(pages) {
  const idToNode = {};
  for (const p of pages) {
    const n = p.properties['Node ID']?.rich_text?.[0]?.plain_text;
    if (n) idToNode[p.id] = n;
  }
  const threads = [];
  for (const p of pages) {
    const fromNode = idToNode[p.id];
    if (!fromNode) continue;
    const targets = p.properties.Connects?.relation || [];
    for (const r of targets) {
      const toNode = idToNode[r.id];
      if (toNode) threads.push([fromNode, toNode]);
    }
  }
  return threads;
}

// ───── serialiser ────────────────────────────────────────────────────────

function jsValue(v) {
  if (v == null) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') {
    // Use double quotes; escape minimally
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map(jsValue).join(', ')}]`;
  if (typeof v === 'object') {
    const entries = Object.entries(v).map(([k, val]) => `${k}: ${jsValue(val)}`);
    return `{ ${entries.join(', ')} }`;
  }
  return JSON.stringify(v);
}

function serialiseIslands(islands) {
  const lines = islands.map(it => `  ${jsValue(it)},`);
  return `[\n${lines.join('\n')}\n]`;
}

function serialiseThreads(threads) {
  const lines = threads.map(([a, b]) => `  ${JSON.stringify([a, b])},`);
  return `[\n${lines.join('\n')}\n]`;
}

// ───── main ──────────────────────────────────────────────────────────────

(async () => {
  console.log('Fetching final-status pages from Notion…');
  const pages = await queryAllFinal();
  console.log(`  ${pages.length} pages`);

  console.log('Fetching page bodies…');
  const islands = [];
  const errors  = [];
  for (const page of pages) {
    const nodeId = page.properties['Node ID']?.rich_text?.[0]?.plain_text || page.id;
    try {
      const blocks = await pageBlocks(page.id);
      islands.push(islandFromPage(page, blocks));
    } catch (e) {
      errors.push(`✗ ${nodeId}: ${e.message}`);
    }
  }
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }

  // Sort islands by Order (within kind, but globally is fine for stable output)
  islands.sort((a, b) => {
    const ka = a.kind, kb = b.kind;
    if (ka !== kb) return ka < kb ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  const threads = buildThreads(pages);
  threads.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1);

  const banner = [
    '// Auto-generated by tools/sync-from-notion.mjs — DO NOT EDIT.',
    '// Source: Notion "Exposition Text Fragments" DB',
    '//   https://www.notion.so/c721d57e7d21435097690b0bb8c0b25c',
    `// ${islands.length} islands, ${threads.length} threads`,
  ].join('\n');

  const body = `${banner}\n\nwindow.SA_ISLANDS = ${serialiseIslands(islands)};\n\nwindow.SA_THREADS_FROM_NOTION = ${serialiseThreads(threads)};\n`;

  const outPath = path.join(root, 'data/islands.generated.js');
  fs.writeFileSync(outPath, body);
  console.log(`Wrote ${outPath} (${islands.length} islands, ${threads.length} threads)`);
})().catch(e => {
  console.error(e.stack || e.message);
  process.exit(1);
});
