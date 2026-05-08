#!/usr/bin/env node
// Structural checks for the Speculative Antennology exposition.
//
//   node tools/check.mjs
//
// Exits 0 on pass, 1 on fail. Zero dependencies.
//
// Checks:
//   1. Every thread endpoint (in islands.generated.js + app.jsx dynamic
//      threads) refers to an island that actually exists.
//   2. Every notion-mapping row points to a real archive specimen.
//   3. (optional, NOTION_TOKEN) The set of Node IDs in islands.generated.js
//      matches the set of final-status pages in the Notion DB. Catches
//      stale generated files.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = 0;
const fail = (m) => { console.error(`✗ ${m}`); failed++; };
const ok   = (m) => console.log(`✓ ${m}`);
const info = (m) => console.log(`ⓘ ${m}`);

// ───── load data/islands.generated.js ─────────────────────────────────────

let generatedIslands = [];
let generatedThreads = [];
const generatedPath = path.join(root, 'data/islands.generated.js');
if (fs.existsSync(generatedPath)) {
  const generatedSrc = fs.readFileSync(generatedPath, 'utf8');
  const win = {};
  try {
    new Function('window', generatedSrc)(win);
    generatedIslands = win.SA_ISLANDS || [];
    generatedThreads = win.SA_THREADS_FROM_NOTION || [];
  } catch (e) {
    fail(`failed to evaluate islands.generated.js: ${e.message}`);
  }
} else {
  info('data/islands.generated.js not present — run tools/sync-from-notion.mjs');
}

// ───── parse scripts/app.jsx for dynamic islands + threads ────────────────

const appSrc = fs.readFileSync(path.join(root, 'scripts/app.jsx'), 'utf8');

// Dynamic items.push({ id: "..." }) — only literal-id pushes (the loops
// produce arc-N / sp-N which we cover separately).
const dynamicIds = new Set();
for (const m of appSrc.matchAll(/items\.push\(\{\s*id:\s*"([^"]+)"/g)) {
  dynamicIds.add(m[1]);
}

// Archive thumbs and featured specimens
const archiveSrc = fs.readFileSync(path.join(root, 'data/archive.js'), 'utf8');
const archiveIs  = [...archiveSrc.matchAll(/\{\s*i:\s*(\d+)\s*,/g)].map(m => Number(m[1]));
for (const i of archiveIs) dynamicIds.add(`arc-${i}`);

const featMatch = appSrc.match(/ARCHIVE\[\[([^\]]+)\]\[k\]\]/);
if (featMatch) {
  const idxs = featMatch[1].split(',').map(s => parseInt(s.trim(), 10));
  for (const fi of idxs) {
    const a = archiveIs[fi];
    if (a != null) dynamicIds.add(`sp-${a}`);
  }
}

// Dynamic THREADS pairs literal in app.jsx (the spread of
// SA_THREADS_FROM_NOTION is not captured by this regex, only the literal
// hardcoded pairs that follow it — which is exactly what we want).
const threadsBlock = appSrc.match(/const THREADS = \[([\s\S]*?)\n\];/);
const dynamicThreads = [];
if (!threadsBlock) {
  fail('could not locate THREADS array in scripts/app.jsx');
} else {
  for (const m of threadsBlock[1].matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)) {
    dynamicThreads.push([m[1], m[2]]);
  }
}

// ───── 1. all thread endpoints exist ──────────────────────────────────────

const allIds = new Set([
  ...generatedIslands.map(i => i.id),
  ...dynamicIds,
]);
const allThreads = [...generatedThreads, ...dynamicThreads];

let threadFails = 0;
for (const [a, b] of allThreads) {
  if (!allIds.has(a)) { fail(`thread endpoint missing: "${a}" (in [${a} → ${b}])`); threadFails++; }
  if (!allIds.has(b)) { fail(`thread endpoint missing: "${b}" (in [${a} → ${b}])`); threadFails++; }
}
if (threadFails === 0) {
  ok(`threads: all ${allThreads.length} edges reference defined islands (${generatedThreads.length} from Notion, ${dynamicThreads.length} dynamic)`);
}

// ───── 2. archive ↔ notion-mapping ────────────────────────────────────────
// Tolerates both shapes: flat array of {archiveI,...} or {pages:[{archiveImages:[...]}]}.

const mappingRaw = JSON.parse(fs.readFileSync(path.join(root, 'data/notion-mapping.json'), 'utf8'));
const mapPages   = Array.isArray(mappingRaw) ? mappingRaw : (mappingRaw.pages || []);

const refsForPage = (p, idx) => {
  if (typeof p.archiveI === 'number') return [{ i: p.archiveI, origin: `archiveI=${p.archiveI}` }];
  if (Array.isArray(p.archiveImages)) {
    return p.archiveImages.map(pos => {
      const i = archiveIs[pos];
      return { i, origin: `pages[${idx}].archiveImages[${pos}]${i == null ? ' (out of range)' : ''}` };
    });
  }
  return [];
};

const archiveSet = new Set(archiveIs);
const mappedSet  = new Set();
let mapFails = 0;
mapPages.forEach((p, idx) => {
  for (const { i, origin } of refsForPage(p, idx)) {
    if (i == null || !archiveSet.has(i)) {
      fail(`notion-mapping references missing archive specimen: ${origin}`);
      mapFails++;
    } else {
      mappedSet.add(i);
    }
  }
});
if (mapFails === 0) {
  ok(`notion-mapping: all ${mapPages.length} entries point to real archive specimens`);
}

const unmapped = archiveIs.filter(i => !mappedSet.has(i));
if (unmapped.length > 0) {
  const preview = unmapped.length > 20 ? unmapped.slice(0, 20).join(', ') + '…' : unmapped.join(', ');
  info(`archive specimens without notion-mapping (${unmapped.length}/${archiveIs.length}): ${preview}`);
}

// ───── 3. (optional) Notion DB ↔ islands.generated.js Node IDs ────────────

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID        = 'c721d57e7d21435097690b0bb8c0b25c';

if (!NOTION_TOKEN) {
  info('NOTION_TOKEN not set — skipping Notion DB sync check');
} else if (generatedIslands.length === 0) {
  info('skipping Notion DB sync check — islands.generated.js is empty or missing');
} else {
  try {
    const fetchAll = async () => {
      const out = [];
      let cursor;
      do {
        const body = {
          filter:    { property: 'Status', select: { equals: 'final' } },
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        };
        const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
          method:  'POST',
          headers: {
            'Authorization':  `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type':   'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        out.push(...data.results);
        cursor = data.has_more ? data.next_cursor : null;
      } while (cursor);
      return out;
    };

    const pages = await fetchAll();
    const notionIds = pages
      .map(p => p.properties?.['Node ID']?.rich_text?.[0]?.plain_text)
      .filter(Boolean);
    const notionSet      = new Set(notionIds);
    const generatedIdSet = new Set(generatedIslands.map(i => i.id));

    const inNotionNotGen = notionIds.filter(id => !generatedIdSet.has(id));
    const inGenNotNotion = [...generatedIdSet].filter(id => !notionSet.has(id));

    if (inNotionNotGen.length === 0 && inGenNotNotion.length === 0) {
      ok(`notion sync: ${notionIds.length} entries match islands.generated.js`);
    } else {
      if (inNotionNotGen.length > 0) fail(`in Notion (final) but not islands.generated.js — run sync: ${inNotionNotGen.join(', ')}`);
      if (inGenNotNotion.length > 0) fail(`in islands.generated.js but not Notion (final): ${inGenNotNotion.join(', ')}`);
    }
  } catch (e) {
    fail(`Notion API: ${e.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
