# Implementation report

## Architecture

React 19 + TypeScript + Vite; Three.js / OrbitControls; fflate and fast-xml-parser inside a Web Worker. Static bundle only, with a project-relative Vite base. No database, API keys, mandatory AI, server endpoints or remote model uploads. `analysis/` owns parsing/geometry; `profiles/` owns sources and hardware/material data; `recommendations/` owns deterministic policy; `components/` owns presentation. A separate private Sites deployment uses the same `dist/` build.

## Analysis and rule design

Direct measurements: dimensions/bounds, counts, area, edge topology, connected components, winding consistency, signed closed single-component volume. Surface heuristics use triangle normals, face slope from horizontal, coplanar contact and bounding proportions. Fine-detail inference is based on a sampled edge-length proxy and carries low confidence. No local wall-thickness or semantic classifier is claimed.

Priority policies are typed data. Named ordered rules adjust quality detail, functional walls, broad-top shells, PETG quality, silk visible speed, TPU speed, overhang support, tall-part adhesion and warp-prone adhesion. Every result has a reason, confidence, basis and status; thermal records add per-field sources, full source arrays and review date. Output updates deterministically when context changes. Flow limits cap nominal speed when the selected profile has an unambiguous scalar; variant-specific values are retained for review.

## Supported fields by Bambu Studio tab

| Tab | Implemented fields / groups |
|---|---|
| Quality | Layer height, Initial layer height; Default/Initial layer/Outer wall/Inner wall/Top surface/Sparse infill/Internal solid infill/Support line widths; Seam position, Scarf seam type; Resolution; Elephant foot compensation; Wall generator; Order of walls; Print infill first; Ironing Type |
| Strength | Wall loops; Top surface pattern/density, Top shell layers/thickness; Bottom surface pattern/density, Bottom shell layers/thickness; Sparse infill density/pattern |
| Speed | Initial layer/infill; Outer wall, Inner wall, Small perimeters, Sparse infill, Internal solid infill, Vertical shell speed, Top surface, Gap infill; Slow down for overhang, 10/25/50/75% overhang speeds, Bridge, Support, Support interface; Travel; Normal printing/Travel/Initial layer travel/Initial layer/Outer wall/Inner wall/Top surface/Sparse infill acceleration |
| Support | Enable support; Type; On build plate only; Threshold angle; Top interface layers; Base pattern spacing; Top interface spacing; Top Z distance (conditional when support is recommended) |
| Others | Brim type/width/object gap; Skirt loops; Prime tower Enable guidance for auxiliary/dual use |
| Filament & Temperature | Initial/other nozzle temperatures, reference range; plate-specific initial/other bed temperature; Flow ratio, Max volumetric speed, Density; source-aware drying and AMS distinction; enclosure/chamber guidance |
| Cooling | No cooling for first layers; derived initial part-cooling fan; Min/Max fan speed threshold fan values; Fan speed for overhang; Min print speed; Keep fan always on; Slow printing down for better layer cooling |

Elephant-foot compensation is placed in **Quality**, matching the actual source category. Advanced scarf/Arachne transitions and uncalibrated bridge-flow/retraction overrides are deliberately not invented. Grid and Rectilinear can be added later; initial recommendation rules choose Cubic or Gyroid. Complete recommendations retain manufacturer/calibrated presets for fields that cannot be responsibly specified.

## Material research

Source matrix: [MATERIAL_SOURCE_MATRIX.md](MATERIAL_SOURCE_MATRIX.md). It was completed and internally checked before database implementation. Official sources: Bambu Studio pinned configurations and product/specification pages; eSUN TDS/product page; Polymaker print guide. Slicer sources: Prusa material behavior and OrcaSlicer calibration/volumetric flow. Community: MakerWorld linked for profile inspection, with no numeric values taken from it. Overture/SUNLU manufacturer choices do not imply validated exact profiles.

Exact products: eight Bambu entries, eSUN PETG-Matte, PolyLite PETG. All eight requested families are represented. Bambu profile facts preserve per-field provenance and arrays. Plate-aware temperature uses textured/hot/engineering/cool keys; unsupported `0` values are not recommended as temperatures. Cooling and drying stay tied to the actual product. Missing duration, flow or volume limits remain unknown. Source conflicts are resolved by exact-product authority, not averaging.

Confidence means confidence in the explanation/fact, not a statistical probability of success. The database is not physically production validated.

## Files

- `src/analysis/{parsers,mesh-analysis,worker,demo}.ts`
- `src/profiles/{printers,materials}.ts`, `studio-profiles.json`, `setting-labels.json`
- `src/recommendations/{policies,engine}.ts`
- `src/components/{ModelViewer,ContextForm,Settings,Guide,Research}.tsx`
- `src/{App,main}.tsx`, `styles.css`, `types/index.ts`
- `tests/{fixtures,parsing.test,analysis.test,recommendations.test}.ts`, `ui.test.tsx`
- `scripts/refresh-studio-profiles.mjs`
- `index.html`, `vite.config.ts`, `tsconfig.json`, npm manifest/lockfile
- `.github/workflows/pages.yml`, README, source matrix and this report

## Validation

69 automated tests cover ASCII/binary STL, 3MF geometry/units/transforms/local production paths, malformed/oversized input, ZIP decompression bounds/path/size checks, XML entities, cyclic components, mesh topology, synthetic coaster/tower/thin/overhang/multi-component forms, recommendation priorities/nozzle/support/strength/fit/build limits, exact-profile provenance and unknown values, upload, tab/keyboard navigation, context updates, copying/export/print and comparison/help navigation.

Production dependency audit after updating fast-xml-parser to 5.11.2 and fflate to 0.8.3: no reported vulnerabilities at the time checked. The full production static build succeeded.

`npm run check` performs strict TypeScript checks and `npm run build` compiles the static app. UI tests run with jsdom and mocked WebGL viewer/worker transport; parser/analysis behavior is separately tested with actual geometry. No browser-control skill was available, so live WebGL rendering and responsive layout have **not** been visually verified. CSS has explicit 1100/800/580 px breakpoints and print rules; these are not a substitute for real-device QA.

## Deployment

GitHub source belongs to `GorillaCoder001/bambu-config-advisor`. Expected Pages project URL: `https://gorillacoder001.github.io/bambu-config-advisor/` after the Pages workflow succeeds. Enable **Settings → Pages → GitHub Actions** if not already enabled; the available connector does not expose Pages administration. No server routing is used. The exact saved/private Sites URL is reported after successful publication.

## Limitations and next work

No slicing/G-code, native process-preset import, certified self-intersection detection, actual bridge spans, local thickness, internal cavity dimensions or per-plate 3MF analysis. No automatic repair/rotation/scaling. Priorities and family knowledge cannot guarantee mechanical strength or filament calibration. Models are limited to 24 MiB/120,000 triangles to bound in-browser work.

Next: physical calibration coupons for exact spool/printer/nozzle/plate combinations; verified X2D extruder variant mapping; BVH thickness/occlusion; per-object and per-plate analysis; orientation ranking; browser/mobile QA; version-pinned native preset import/export tests if that export is later implemented.
