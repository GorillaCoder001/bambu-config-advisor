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

Elephant-foot compensation is placed in **Quality**, matching the actual source category. Advanced scarf/Arachne controls and bridge-flow settings retain the supplied current values or process preset; numeric overrides are not inferred from geometry. Grid and Rectilinear can be added later; initial recommendation rules choose Cubic or Gyroid. Complete recommendations retain manufacturer/calibrated presets for fields that cannot be responsibly specified.

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

Full dependency audit (runtime and development) after updating fast-xml-parser to 5.11.2, fflate to 0.8.3, Vite to 6.4.4 and Vitest to 4.1.11: no reported vulnerabilities at the time checked. All 69 tests, strict TypeScript validation and the production static build pass on the final dependencies.

`npm run check` performs strict TypeScript checks and `npm run build` compiles the static app. UI tests run with jsdom and mocked WebGL viewer/worker transport; parser/analysis behavior is separately tested with actual geometry. No browser-control skill was available, so live WebGL rendering and responsive layout have **not** been visually verified. CSS has explicit 1100/800/580 px breakpoints and print rules; these are not a substitute for real-device QA.

## Deployment

GitHub source belongs to `GorillaCoder001/bambu-config-advisor`. Expected Pages project URL: `https://gorillacoder001.github.io/bambu-config-advisor/` after the Pages workflow succeeds. Enable **Settings → Pages → GitHub Actions** if not already enabled; the available connector does not expose Pages administration. No server routing is used. GitHub independently passed all 69 tests and the production build; the initial Pages workflow stopped at configure-pages because Pages was not enabled (404). Select Settings → Pages → Source → GitHub Actions and rerun the workflow. Private review site: https://created3d-print-advisor.cheekyyak1024.chatgpt.site . The final updated dependency set is also locally verified.

## Limitations and next work

No slicing/G-code, native process-preset import, certified self-intersection detection, actual bridge spans, local thickness, internal cavity dimensions or per-plate 3MF analysis. No automatic repair/rotation/scaling. Priorities and family knowledge cannot guarantee mechanical strength or filament calibration. Models support 256 MiB input and 2,000,000 triangles. Expanded model XML is bounded at 512 MiB; detailed topology is withheld above 200,000 triangles. Large previews use at most 200,000 sampled faces.

Next: physical calibration coupons for exact spool/printer/nozzle/plate combinations; verified X2D extruder variant mapping; BVH thickness/occlusion; per-object and per-plate analysis; orientation ranking; browser/mobile QA; version-pinned native preset import/export tests if that export is later implemented.


## October 12 capacity and settings comparison update

Raised the STL/3MF file limit from 24 to 256 MiB and the triangle cap from 120,000 to 2,000,000. Resource vertices now allow 6,000,000 and ZIP entries 4,096. Central-directory size/path/encryption/ratio checks remain; declared archive expansion is bounded at 2 GiB, selected geometry XML at 512 MiB and each settings metadata file at 8 MiB. Mesh tables are parsed into typed arrays, model entries are inflated individually and expanded instances are counted before output allocation. Detailed topology remains bounded; skipped counts render as “Not checked” rather than zero. Preview sampling does not change analysis geometry.

Added Current → Recommended → Reason columns to every settings tab, manual values, JSON upload/paste, explicit global settings import from Bambu project 3MF, variant preservation, override review badges and comparison status. Values are taken from uploaded settings, never substituted from the recommendation. Importing another model clears stale settings. Current/recommended values also appear in copy, JSON and print reports. JSON report schema is 2 and retains `compatiblePreset: false`.

Metadata paths were checked against Bambu Studio's pinned `src/libslic3r/Format/bbs_3mf.cpp` (47a13eeb1d9af65ef2371e361c856e21d4f6ca72). Synthetic fixtures cover project JSON and XML override metadata; no user model file was attached to this change request, only screenshots, so the exact failing project cannot be replayed here. Browser/WebGL visual QA remains unavailable in this managed environment.

Update validation: all 93 tests and strict TypeScript/production build pass. Regression coverage includes 3MF geometry above the previous 120,000 resource limit, a two-million-triangle binary STL over the previous file limit, explicit skipped topology, compact preview sampling, current-value imports, manual edits, merged JSON, variant/override review and current/recommended report output.


## October 12 exact placement update

Checked all five Process tabs against pinned official Studio `src/slic3r/GUI/Tab.cpp`, `src/libslic3r/PrintConfig.cpp` and `src/slic3r/GUI/ConfigManipulation.cpp`. Supplied screenshots anchor Quality ordering/visible controls and the complete ordinary Strength field sequence. The new catalog records official labels, ordering, groups, enum storage/display aliases, units and conditional reveal instructions. Settings carry navigation paths into the on-screen comparison and text/print/JSON reports.

Corrected Quality section order (Ironing before Wall generator and Advanced), Strength Top/bottom shells wording, Speed Initial layer speed/Other layers speed/Travel speed sections, Support Advanced placement for gaps/interface values and Others skirt-before-brim ordering. Expanded standard controls across all five tabs; unsupported numeric tuning keeps current/process-preset values rather than receiving invented recommendations. Process scarf controls require the filament-scarf override checkbox. Arachne, ironing, infill-pattern, height slowdown, tree support, prime tower, spiral/fuzzy and interlocking controls have reveal notes. Jerk fields are hidden for Bambu printer presets. Developer-only controls and script/note entry are excluded.

Thermal values now show actual Filament dialog paths (Basic information, Print temperature and Volumetric speed limitation), with nested plate/nozzle fields. Cooling uses Part cooling fan and nested threshold fields. Replaced the derived initial-part-fan pseudo-setting with Studio's actual `first_x_layer_part_fan_speed`; unverified profile values remain withheld. Resolution retains 0.012 mm precision. Stored/display enum normalization prevents an unchanged inner/outer wall order from being marked as a change.

All 110 tests pass, including supplied screenshot field coverage/order, exact paths on every process row, conditionally revealed scarf/Arachne controls, preserved bridge calibration, filament paths, Bambu Jerk visibility and enum/precision regressions. Strict TypeScript and the production build pass. Browser/WebGL visual QA remains unavailable in this environment; screenshot comparison verifies labels/structure, not a live rendered screenshot.


## October 12 inherited dropdown-label correction

Fixed the inherited top-fill pattern dropdown labels for bottom surface, internal solid infill and sub-top surface patterns. Official PrintConfig.cpp assigns these controls the top-surface pattern values and labels: stored `zig-zag` must display as **Rectilinear**. This differs from the distinct `zigzag` sparse-infill value, which displays as **Zig Zag** in the pinned Studio version. Also recovered literal, non-translated dropdown labels for infill anchors, interface layer counts and fuzzy noise types. Imported raw values remain intact; current/recommended comparisons and text/JSON reports use Studio labels. All 117 tests, strict TypeScript and the production build pass. New regressions cover all four shell/solid pattern fields, distinguishing the two stored values, other literal labels and the exact UI row from the supplied screenshot.


## October 12 native filament dialog update

The Filament tab now follows the supplied X2D PETG Basic screenshot and pinned TabFilament::build / PrintConfig.cpp definitions: Basic information, Print temperature, Volumetric speed limitation and Filament scarf seam settings. Completed ordinary controls including Type/Vendor/Default color, diameter, metal stickiness, shrinkage, velocity adaptation, actual price, softening temperature, paired filament priming/ramming/travel/precooling controls, separate recommended nozzle Min/Max, all five plate pairs, chamber/nozzle temperatures, adaptive flow, paired ramming volumetric speed and filament scarf type/height/gap/length. Cooling now mirrors Part cooling fan, Auxiliary part cooling fan and Exhaust fan, including nested ramp and threshold layer-time controls.

Renamed the former combined Filament & Temperature tab to Filament. Drying/AMS/enclosure guidance moved into preparation notes outside Studio setting groups and remains in copied/printed/JSON reports. Cool Plate SuperTack is a selectable context plate. Units preserve percent-versus-millimeter scarf values, volume, time, density and money/kg. Separate extruder/hotend fields and ambiguous variant arrays stay separate; no screenshot values are substituted as universal material recommendations. Existing exact-product thermal rules remain, unsupported plate zero values are flagged, and chamber zero means heating off. Machine-specific priming/ramming, price and unverified additional controls retain current/filament preset values. Developer controls and firmware-specific pressure advance for Bambu presets remain hidden/explained.

All 127 tests pass, including complete screenshot field coverage/order, subfield paths, enum labels, current values and units, independent variants, Cooling groups, preserved product temperatures and exported drying notes. Strict TypeScript and the production build pass. Live browser visual QA remains unavailable.


## October 13 collapsed model sidebar and print-time planning

Added the collapse/expand control at the model workspace header beside the format badge. Collapsed desktop layout uses a narrow sticky rail with expand/upload/cancel controls and wider recommendations; mobile uses a compact horizontal rail. Preview/data/input state is retained, keyboard focus follows the toggle and controls expose aria-expanded/aria-controls. Hidden preview resize callbacks return before assigning a zero-area camera/render viewport.

Added a low-confidence planning time range to the recommendation, a time card, Quality/Balanced/Fast comparison ranges, estimate assumptions/drivers and a user-entered Studio sliced-time reference. References clear on model replacement. Text/copy/print/JSON retain time information and limits; JSON schema is 3. No slice toolpaths or exact print-time prediction are claimed. The optional Studio reference is user-supplied; saved 3MF slice metadata is not automatically interpreted.

Authored planning calculation: approximate wall/cap/infill allocation from measured closed volume; otherwise a wide surface-area skin proxy rather than a filled bounding box. Deposition uses nominal speeds/line widths/layer height and verified flow caps where available. Includes broad preparation/travel/layer-change/support uncertainty, optional provided cooling floor and ironing allowance. Real supports, multiple materials, purging, exact acceleration, self-intersections and layer-by-layer geometry are not simulated. No physical/slicer calibration of the planning ranges has been performed.

Corrected fine-detail rule to require explicit detail/figurine intent rather than short tessellation edges. Decorative bottle-cover intent no longer triggers 4-wall/30%-infill functional settings. Added an efficient bottle-cover policy (typically 0.2 mm at 0.4 nozzle, 2 walls, 10% infill) and a Balanced shortcut preserving nozzle, material and explicit preferences. Strength/detail/geometry safeguards remain; supports are not blindly disabled. Decorative cover attachments receive tree-style support guidance when support candidates are present. The supplied screenshot selects Maximum quality at 0.10 mm; the actual Bottle.3mf and sliced time breakdown were not attached, so the reported 16-hour job cannot be diagnosed or a shorter exact time guaranteed.

All 140 tests, strict TypeScript and the production build pass. Regression cases cover sidebar restoration/data preservation, mode time ranges, flow caps, provisional volume fallback, hollow-volume handling, explicit preference preservation, density-only slowdown removal, Studio reference handling and report output. Browser/WebGL visual QA remains unavailable.
