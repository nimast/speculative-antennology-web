# Speculative Antennology — project memory

> **Transition in progress:** the exposition is being rebuilt inside the Research Catalogue (RC)
> editor for JAR submission (see `.claude/rc-build/BUILD_PLAN.md`). The website + Notion →
> `islands.generated.js` pipeline below remains the content-of-record but is **no longer the primary
> publishing surface**. Edit fragment content in Notion as before; the generated JS / website render
> is now secondary.

## Run / build
- Static site, no build step. `index.html` loads JSX via Babel standalone — do not run `npm install`.
- Open `index.html` directly in a browser, or serve with `python3 -m http.server`.

## Validate before pushing
- `node tools/check.mjs` — validates thread endpoints, archive ↔ notion-mapping coverage, Notion DB sync (the third only if `NOTION_TOKEN` is exported).
- CI runs the same script on every PR via `.github/workflows/check.yml`.

## Editing islands

**Notion is the source of truth** for stable-ID islands. To add or edit one:
1. Open the **Exposition Text Fragments** DB (link below) and edit the row.
2. Set `Status = final` when ready to publish.
3. The daily `notion-sync` workflow regenerates `data/islands.generated.js` and opens a PR.

To run the sync locally: `NOTION_TOKEN=… node tools/sync-from-notion.mjs`.

Body conventions per Kind are in `NOTION.md` — read that before editing fragment bodies.

- `data/islands.generated.js` is **auto-generated** — never hand-edit. It exposes `window.SA_ISLANDS` and `window.SA_THREADS_FROM_NOTION`.
- `scripts/app.jsx` reads those at load time, then appends dynamic islands (`viewer`, `arc-head`, `arc-N`, `sp-N`) and dynamic threads (those involving non-Notion endpoints). Edit `app.jsx` when changing dynamic island layout or rendering, never to add/edit fragment content.
- The colophon island uses `id: "colophon"` (matches Notion). Threads to it must use `"colophon"`, not the legacy `"col"`.

## Archive ↔ Notion mapping
- `data/notion-mapping.json` maps all 49 archive images (0-based indices) to Notion pages in the Antenna Repository DB. Source of truth for the `notion: { ... }` objects in `data/archive.js`.
- Archive images live at `assets/archive/ant-00.jpg` through `ant-48.jpg` (zero-padded).
- `archive.js` uses 1-based `i` values (1–49); `notion-mapping.json` uses 0-based indices (0–48).
- Some Notion pages contain multiple archive images (multi-image pages, e.g. Misato → ant-18 + ant-19).
- Notion is the canonical source for all antenna images. If an archive entry appears "unmatched", the Notion page exists but wasn't found — search harder rather than creating new pages.

## Notion taxonomy conventions
- Application categories reflect domains of use (what antennas are used FOR), not technical kinds (what they ARE). Aligned with media-theoretical framing.
- Preferred mappings: NFC Payments → "Finance", Energy Harvesting → "Energy Production", Defense/ECM → "Military", RDF → "Navigation", Olfactory/Scent → "Pheromone Communication", TV/Radio/Media → "TV & Radio".
- Radar is a technology, not an application — map contextually (Military, Air Traffic Control, etc.).
- "Swarm Intelligence" and "communication" are too vague to be applications. "Further research needed" is a status, not an application.

## Notion IDs
- Exposition Text Fragments DB: `c721d57e7d21435097690b0bb8c0b25c` (data source `f5ea6f45-5f08-4099-88de-451d80df9aff`)
- Antenna Repository DB: `969aad89-4364-43d8-954d-24fe571d2871` (data source `e45edfa0-9985-4db3-8ecf-c277216e9a64`)

## GitHub
- Repo owner: `nimast`. The local `gh` keyring may have multiple accounts active — if `gh pr create` fails with "must be a collaborator", run `gh auth switch -u nimast` first.
