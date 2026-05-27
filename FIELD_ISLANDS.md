# Field Islands — image essay layer
_Specimens from the archive wired into the exposition canvas as `kind: field-caption` islands._

Status: `[ ]` outstanding · `[x]` done · `[-]` skipped

---

## Done

| ID | Archive | Prose island | Subject |
|----|---------|-------------|---------|
| fi-01 | ant-01 (i:1) | ess-7 (VLA) | Radar phased array |
| fi-02 | ant-05 (i:5) | ess-11 (Directivity) | GURT dipole array |
| fi-03 | ant-07 (i:7) | ess-7 (VLA) | ALMA array |
| fi-04 | ant-09 (i:9) | ess-11 (Directivity) | Duga OTH curtain |
| fi-05 | ant-39 (i:39) | ess-7 (VLA) | ALMA Cassegrain |
| fi-06 | ant-40 (i:40) | ess-11 (Directivity) | Elefantenkäfig CDAA |
| fi-07 | ant-48 (i:49) | ess-11 (Directivity) | Duga 'The Ribs' (detail) |

---

## Outstanding

### FI-A · Elefantenkäfig CDAA — wider view (ant-40, i:40)
**Status:** `[ ]`
**Place near:** ess-11 (Directivity) or ess-12 (Transceiving)
**Rationale:** The 300m-diameter Wullenweber circular array in Gablingen, Bavaria. Its geometry *is* its directional resolution. Strongest archive image for "geometry bakes in preferred angles."
**Notion page:** `35943677-0500-819e-9df7-ef52494f95df`

### FI-B · Holmdel Horn (ant-02, i:2)
**Status:** `[ ]`
**Place near:** ess-7 (VLA / Distributed Eye) or ess-13 (Against the Visible)
**Rationale:** Bell Labs horn that received the CMB — Penzias & Wilson received something they couldn't identify as signal. Directly relevant to the reception-without-recognition argument. Alternatives: ant-01, ant-24, ant-36.
**Notion page:** `35943677-0500-81c1-ac0d-c6315baf6766`

### FI-C · Duga aerial / full curtain (ant-06 or ant-09)
**Status:** `[ ]`
**Place near:** ess-11 (Directivity)
**Rationale:** Wide-angle view of the full Duga OTH curtain structure, to complement the 'Ribs' detail (fi-07). Shows the scale of directional infrastructure.
**Notion pages:** `ea659021` (ant-06) · `35943677` (ant-09)

---

## How to add a new field island

1. Pick an archive image (`assets/archive/ant-XX.jpg`).
2. Create a row in **Exposition Text Fragments** DB with:
   - `kind: field-caption`
   - Body: image block using `https://raw.githubusercontent.com/nimast/speculative-antennology-web/main/assets/archive/ant-XX.jpg` + paragraph caption
   - `Status: final`
   - `Connects`: the target prose island (`ess-N`)
3. Run `NOTION_TOKEN=… node tools/sync-from-notion.mjs` locally, or wait for the daily notion-sync PR.
4. Update this file.
