# Multicolour time and recommendation review — 2 November 2026

## Observed mismatch

The supplied screenshots show Studio at 20 h 15 min / 211.87 g and the advisor at 6 h 3 min / 55 g. Studio has five configured PETG filaments, four on the main nozzle and one on the auxiliary. The screenshot's “save 570 nozzle purges” comparison is **not** the job's actual change count and is not imported as one. Studio shows 0.12 mm layers while the advisor recommends 0.10 mm. No original project or sliced file was supplied, so this model has not been reproduced or physically validated.

## Causes and corrections

- Above 200,000 triangles, or with unresolved components, solid volume is unverified. The surface-only approximation contains no verified interior material. It remains a labelled geometry subtotal and no longer appears as a complete job total.
- The earlier calculation omitted multicolour changes, flushing and towers. Imported `filament_colour`, `filament_type` and `filament_settings_id` slot arrays now identify potentially multicolour jobs **before** nozzle-array resolution. Slots may be unused; the user confirms the filaments actually printed.
- Colour count does not reveal layer-by-layer changes. A manual job estimate requires actual total changes, average inclusive seconds per change, purge grams and tower grams. Inclusive change time covers loading, unloading, purge and wipes; purge extrusion time is not counted twice. Tower extrusion time is added separately at an approximate rate. Neither a universal multiplier nor a fabricated per-layer change count is used.
- A saved sliced 3MF can supply Studio's original per-plate duration and weight. `Metadata/slice_info.config` contains `<config><plate>` metadata: `index`, `prediction` (seconds), `weight` (grams). These are read locally, with archive/XML size and entity checks. Multiple plates remain separate. Missing, invalid, zero or nonfinite summaries are rejected. Only the small summary entry is decompressed; toolpaths are not executed.
- Saved results are explicitly references for their original settings. They do not change with recommendations. Model replacement clears them. A dedicated importer also accepts sliced `.gcode.3mf` files without model geometry. Text/JSON reports include the saved plate references.
- The prime-tower recommendation preserves provided ON/OFF for multicolour and dual-nozzle jobs. The advisor does not choose AMS grouping or prescribe reduced purge volumes. A visible dual-nozzle input activates the appropriate build-volume check.
- Imported versus recommended layer-height differences and configured mixed material families are flagged. One selected material/profile cannot represent every filament's temperature, cooling and flow. Existing per-nozzle calibration rules, flow caps, support checks, dimensional-fit cautions and surface-finish tests remain covered by the regression suite.
- The bottle-cover shortcut is shown only for a selected bottle-cover use; unrelated phone-holder jobs no longer receive that shortcut.

## Source and verification limits

Official source inspected 2 November 2026:

- [Bambu 3MF reader/writer](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp): slice-info path, XML structure, metadata names and per-plate handling.
- [Bambu plate statistics](https://github.com/bambulab/BambuStudio/blob/master/src/slic3r/GUI/PartPlate.cpp): prediction from normal-mode print-statistics time and weight from total_weight.

The saved-summary tests use synthetic metadata matching the screenshot totals. They establish parsing, units and presentation; they do not establish that the advisor can regenerate the user's toolpaths. The manual overhead model remains a heuristic. No real browser slicer or server slicing service is implemented. Real job totals should come from the saved Studio slice, especially for uncertain volume, mixed material, mixed diameter or complex nozzle grouping. The same model's actual project and sliced 3MF are required for a direct end-to-end comparison.

## Final configuration constraint check

Reviewed the documented Bambu machine-limit keys, nozzle/layer relationship, material flow limits, support semantics, preserved flow calibration, surface finishing, multi-filament prime-tower state and saved-slice references. Numeric advisor targets remain explicitly authored trial values; there is no universal certified configuration for every material and model.

Additional corrections: bridge speed is capped using known filament flow and a conservative line-width-squared bridge-strand area approximation. Imported `machine_max_speed_x/y` and `machine_max_acceleration_x/y/extruding/travel` constrain requested speeds and accelerations. The lower positive bound across supplied machine modes is used conservatively; zero is treated as no supplied limit and malformed arrays are ignored. Machine limits are captured before nozzle-array resolution. Reasons identify applied caps.

Validation: 181 tests passed, including 144 printer/nozzle/material/priority combinations checked for positive layer heights below the general nozzle-height ceiling, sufficient top-shell layers and known flow bounds. Production TypeScript/Vite build passed. No real-browser visual QA or physical print validation was performed. The screenshot totals are covered by synthetic saved-slice metadata, not by reconstructing the user's model.

Primary guidance checked: [Bambu machine limit definitions](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/PrintConfig.cpp), [Bambu machine presets](https://github.com/bambulab/BambuStudio/blob/master/resources/profiles/BBL/machine/fdm_bbl_3dp_001_common.json), [Prusa layers/perimeters](https://help.prusa3d.com/article/layers-and-perimeters_1748), [Prusa volumetric speed](https://help.prusa3d.com/article/max-volumetric-speed_127176). General Prusa relationships are not represented as Bambu-specific numeric calibration.
