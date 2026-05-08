# Speculative Antennology — project memory

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

## Notion IDs
- Exposition Text Fragments DB: `c721d57e7d21435097690b0bb8c0b25c` (data source `f5ea6f45-5f08-4099-88de-451d80df9aff`)
- Antenna Repository DB: `969aad89-4364-43d8-954d-24fe571d2871`

## GitHub
- Repo owner: `nimast`. The local `gh` keyring may have multiple accounts active — if `gh pr create` fails with "must be a collaborator", run `gh auth switch -u nimast` first.
