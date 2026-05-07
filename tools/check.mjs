#!/usr/bin/env node
// Structural checks for the Speculative Antennology exposition.
//
//   node tools/check.mjs
//
// Exits 0 on pass, 1 on fail. Zero dependencies.
//
// Checks:
//   1. Every THREADS endpoint refers to an island defined in scripts/app.jsx.
//   2. Every notion-mapping row points to a real archive specimen.
//   3. (optional, NOTION_TOKEN) Every text-fragment Node ID in app.jsx exists
//      as a row in the Exposition Text Fragments DB, and vice versa.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = 0;
const fail = (m) => { console.error(`✗ ${m}`); failed++; };
const ok   = (m) => console.log(`✓ ${m}`);
const info = (m) => console.log(`ⓘ ${m}`);

// ───── parse scripts/app.jsx ──────────────────────────────────────────────

const appSrc = fs.readFileSync(path.join(root, 'scripts/app.jsx'), 'utf8');

const idSet = new Set();
for (const m of appSrc.matchAll(/items\.push\(\{\s*id:\s*"([^"]+)"/g)) {
  idSet.add(m[1]);
}

// data/archive.js drives the dynamic ids: arc-<i> for each specimen, and
// sp-<i> for the four featured indices.
const archiveSrc = fs.readFileSync(path.join(root, 'data/archive.js'), 'utf8');
const archiveIs  = [...archiveSrc.matchAll(/\{\s*i:\s*(\d+)\s*,/g)].map(m => Number(m[1]));
for (const i of archiveIs) idSet.add(`arc-${i}`);

const featMatch = appSrc.match(/ARCHIVE\[\[([^\]]+)\]\[k\]\]/);
if (featMatch) {
  const idxs = featMatch[1].split(',').map(s => parseInt(s.trim(), 10));
  for (const fi of idxs) {
    const a = archiveIs[fi];
    if (a != null) idSet.add(`sp-${a}`);
  }
}

// THREADS array
const threadsBlock = appSrc.match(/const THREADS = \[([\s\S]*?)\n\];/);
const threads = [];
if (!threadsBlock) {
  fail('could not locate THREADS array in scripts/app.jsx');
} else {
  for (const m of threadsBlock[1].matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)) {
    threads.push([m[1], m[2]]);
  }
}

// ───── 1. thread endpoints exist ──────────────────────────────────────────

let threadFails = 0;
for (const [a, b] of threads) {
  if (!idSet.has(a)) { fail(`thread endpoint missing: "${a}" (in [${a} → ${b}])`); threadFails++; }
  if (!idSet.has(b)) { fail(`thread endpoint missing: "${b}" (in [${a} → ${b}])`); threadFails++; }
}
if (threadFails === 0) ok(`threads: all ${threads.length} edges reference defined islands`);

// ───── 2. archive ↔ notion-mapping ────────────────────────────────────────

const mapping    = JSON.parse(fs.readFileSync(path.join(root, 'data/notion-mapping.json'), 'utf8'));
const archiveSet = new Set(archiveIs);
const mappedSet  = new Set(mapping.map(m => m.archiveI));

let mapFails = 0;
for (const m of mapping) {
  if (!archiveSet.has(m.archiveI)) {
    fail(`notion-mapping row references missing archive specimen: archiveI=${m.archiveI}`);
    mapFails++;
  }
}
if (mapFails === 0) {
  ok(`notion-mapping: all ${mapping.length} rows point to real archive specimens`);
}

const unmapped = archiveIs.filter(i => !mappedSet.has(i));
if (unmapped.length > 0) {
  const preview = unmapped.length > 20 ? unmapped.slice(0, 20).join(', ') + '…' : unmapped.join(', ');
  info(`archive specimens without notion-mapping (${unmapped.length}/${archiveIs.length}): ${preview}`);
}

// ───── 3. (optional) Notion DB ↔ app.jsx Node IDs ─────────────────────────

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID        = 'c721d57e7d21435097690b0bb8c0b25c';

if (!NOTION_TOKEN) {
  info('NOTION_TOKEN not set — skipping Notion DB sync check');
} else {
  // App.jsx ids mirrored to Notion: everything except dynamic archive ids,
  // the viewer, the archive cluster header, and the colophon "col" island
  // (the colophon row in Notion uses Node ID "colophon").
  const isDynamic = (id) => /^(arc-|sp-)/.test(id);
  const skip      = new Set(['viewer', 'arc-head', 'col']);
  const appTracked = new Set([...idSet].filter(id => !isDynamic(id) && !skip.has(id)));

  try {
    const fetchAll = async () => {
      const out = [];
      let cursor;
      do {
        const body = cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 };
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
    const notionSet = new Set(notionIds);

    const expectedNotion = new Set(appTracked);
    expectedNotion.delete('col');
    expectedNotion.add('colophon'); // app.jsx id "col" is mirrored as "colophon" in Notion

    const missingFromNotion = [...expectedNotion].filter(id => !notionSet.has(id));
    const extraInNotion     = notionIds.filter(id => !expectedNotion.has(id));

    if (missingFromNotion.length === 0 && extraInNotion.length === 0) {
      ok(`notion sync: ${notionIds.length} entries match app.jsx`);
    } else {
      if (missingFromNotion.length > 0) fail(`in app.jsx but not Notion: ${missingFromNotion.join(', ')}`);
      if (extraInNotion.length > 0)     fail(`in Notion but not app.jsx: ${extraInNotion.join(', ')}`);
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
