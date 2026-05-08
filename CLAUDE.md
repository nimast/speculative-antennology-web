# Speculative Antennology — project memory

## Run / build
- Static site, no build step. `index.html` loads JSX via Babel standalone — do not run `npm install`.
- Open `index.html` directly in a browser, or serve with `python3 -m http.server`.

## Validate before pushing
- `node tools/check.mjs` — validates thread endpoints, archive ↔ notion-mapping coverage, Notion DB sync (the third only if `NOTION_TOKEN` is exported).
- CI runs the same script on every PR via `.github/workflows/check.yml`.

## Editing islands in `scripts/app.jsx`
- Stable-ID islands (prefixes `ess-`, `pq-`, `wh-`, `gl-`, `nt-`, `field-`, plus `title`, `method`, `bib`, `colophon`) are mirrored 1:1 in the Notion **Exposition Text Fragments** DB (data source `f5ea6f45-5f08-4099-88de-451d80df9aff`). Add/remove a fragment in both places, or `check.mjs` will fail.
- Dynamic IDs (`arc-N`, `sp-N`, plus `viewer`, `arc-head`) are generated from `data/archive.js` and are NOT mirrored.
- Known mismatch: app.jsx uses `id: "col"` for the colophon island, mirrored as Node ID `colophon` in Notion. `check.mjs` accepts this; don't "fix" it.

## Archive ↔ Notion mapping
- `data/notion-mapping.json` maps all 48 archive images (0-based indices) to Notion pages in the Antenna Repository DB. Source of truth for the `notion: { ... }` objects in `data/archive.js`.
- Archive images live at `assets/archive/ant-00.jpg` through `ant-47.jpg` (zero-padded).
- `archive.js` uses 1-based `i` values (1–48); `notion-mapping.json` uses 0-based indices (0–47).
- Some Notion pages contain multiple archive images (multi-image pages, e.g. Misato → ant-18 + ant-19).

## Notion IDs
- Exposition Text Fragments DB: `c721d57e7d21435097690b0bb8c0b25c` (data source `f5ea6f45-5f08-4099-88de-451d80df9aff`)
- Antenna Repository DB: `969aad89-4364-43d8-954d-24fe571d2871` (data source `e45edfa0-9985-4db3-8ecf-c277216e9a64`)

## GitHub
- Repo owner: `nimast`. The local `gh` keyring may have multiple accounts active — if `gh pr create` fails with "must be a collaborator", run `gh auth switch -u nimast` first.
