# Adding fragments via Notion

The exposition's text islands live in the Notion **Exposition Text Fragments** DB:

https://www.notion.so/c721d57e7d21435097690b0bb8c0b25c

An on-demand GitHub Actions workflow (`.github/workflows/notion-sync.yml`, triggered via `workflow_dispatch`) runs `tools/sync-from-notion.mjs`, regenerates `data/islands.generated.js`, and opens a PR if anything changed.

## Quick add

1. Open the DB → click **+ New**.
2. Fill these properties:
   - **Name** — short label (used internally; not rendered)
   - **Node ID** — stable slug, e.g. `ess-13`. Pick a free one for the Kind.
   - **Kind** — pick from dropdown (essay / pullquote / whisper / note / glossary / method / bibliography / field-caption / title / colophon)
   - **X**, **Y**, **W** — position and width on the plane (numbers)
   - **Status** — leave as `draft` while editing; flip to `final` when ready to publish
3. Write the body (see per-kind conventions below).
4. Optional: set **Connects** to other final-status rows you want a thread to.

The next workflow run picks up rows where `Status = final`.

## Per-kind body conventions

The parser in `tools/sync-from-notion.mjs` reads each row's body. Format conventions:

### essay → renders as `prose`
- Plain paragraphs of text. HTML inline tags allowed (`<em>`, `<strong>`, `<code>`).
- **Lede** (large pulled-out quote, like the Al-Kindi opener): wrap the whole thing in a Notion **quote block**.
- **Cite** (attribution under the body): make the last paragraph a single **italic** line. The leading "—" is optional; the parser strips it.

### pullquote → `pullquote`
- Use a Notion **quote block** for the actual quote.
- Optional cite: add an **italic** paragraph after the quote.

### whisper / note → `whisper` / `note`
- One paragraph of plain text. No formatting needed.

### glossary → `gloss`
- First paragraph: term in **bold** at the start, definition follows in plain or italic.
- Or: first paragraph is the term in **bold**, second paragraph is the definition.

### method → `method` (numbered list of steps)
- A bulleted or numbered list. Each list item becomes one step.

### bibliography → `bib` (numbered list of entries)
- Same as method — bulleted/numbered list, each item is one entry. HTML allowed (e.g. `<em>Title</em>`).

### field-caption → `field`
- An **image block** (paste/upload) gives the image URL.
- Followed by one paragraph of caption text.

### title / colophon
- Body is **ignored** — these are rendered hardcoded in `scripts/app.jsx`. Notion only owns their position (X, Y, W).

## Threads (Connects)

- The **Connects** property is a multi-relation to other rows in the same DB.
- Each Connects entry produces one thread on the rendered plane.
- Notion auto-fills **Connected From** as the inverse — you don't need to set both sides.
- Threads to **non-Notion islands** (the 3D viewer, the archive cluster header, featured specimens) live in `scripts/app.jsx` and are not edited via Notion.

## Position guidance

Coordinates are unbounded; (0, 0) is roughly the title island. Existing fragments occupy:

| Zone | Approx X range | What's there |
|------|----------------|--------------|
| Northwest | -1500..-400, -260..0 | bibliography, method, gl-1, gl-4, nt-3 |
| North-central | -380..2700, -340..620 | title, essay arc 1 (Al-Kindi → ess-6), pullquote pq-1 |
| East arc | 2800..5100, 360..1900 | Cosmos-to-Canvas essay arc (ess-7..12, pq-2/3, gl-5/6, wh-3/4, nt-4) |
| Southwest | -1500..200, 600..1000 | gl-1, gl-4, nt-3, field-1 |
| South archive | -600..1100, 1400+ | archive cluster, featured specimens, thumbs |
| Far south-east | 1500, 3900 | colophon |

Pick coordinates that don't overlap with existing islands. Width (`W`) typically: prose 460, pullquote 540–560, glossary 300, whisper/note 240–340, field 420.

## Templates (manual, optional)

Notion's API can't create database templates, but you can set them up manually for a faster "+ New" UX:

1. In the DB header, click the dropdown next to **+ New**.
2. **+ New template** → name it (e.g. "Essay") → pick **Kind = essay**, **Status = draft**.
3. Add placeholder body matching the convention above. For example, an Essay template body:
   ```
   [your essay text here]

   *— optional cite line in italics*
   ```
4. Repeat per kind.

After templates exist, adding a fragment becomes: pick template → fill placeholders → set X/Y/W → flip Status to `final`.

## What the workflow does

`tools/sync-from-notion.mjs` runs in CI with `secrets.NOTION_TOKEN`:

1. Queries the DB for rows where `Status = final` (paginated).
2. Fetches each page's blocks.
3. Parses per the conventions above.
4. Writes a deterministic `data/islands.generated.js`.
5. If the file changed, the workflow opens a PR titled `chore(notion): sync islands from Notion`.

## Local sync

```sh
export NOTION_TOKEN='secret_…'
node tools/sync-from-notion.mjs
```

Then commit `data/islands.generated.js` if it changed.
