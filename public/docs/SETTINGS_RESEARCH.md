# Settings evidence review

Reviewed 13 October 2026. This update covers the ordinary controls in Quality, Strength, Speed, Support, Others, Filament and Cooling. Every included control has an authored plain-language explanation and a link to its definition in the same Bambu Studio snapshot used for the existing placement catalog.

## Evidence and limits

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| [Bambu Studio control definitions](https://github.com/bambulab/BambuStudio/blob/47a13eeb1d9af65ef2371e361c856e21d4f6ca72/src/libslic3r/PrintConfig.cpp) and [dialog layout](https://github.com/bambulab/BambuStudio/blob/47a13eeb1d9af65ef2371e361c856e21d4f6ca72/src/slic3r/GUI/Tab.cpp) | Setting behavior, units, labels and placement in the pinned version | The best numeric value for an unprinted user model |
| [Pinned Bambu filament profiles](https://github.com/bambulab/BambuStudio/tree/47a13eeb1d9af65ef2371e361c856e21d4f6ca72/resources/profiles/BBL/filament) and existing product source matrix | Recorded baseline or exact-product values, with array variants retained | A measured calibration for the user's spool, nozzle or extruder |
| [Prusa layers and perimeters](https://help.prusa3d.com/article/layers-and-perimeters_1748) | General relationships between layers, side-wall material and surface coverage | Bambu machine-specific tuning |
| [Prusa maximum volumetric speed](https://help.prusa3d.com/article/max-volumetric-speed_127176) | Why melt throughput and other limits constrain requested speed | A transferable flow limit for a different hotend |
| [Prusa ironing](https://help.prusa3d.com/article/ironing_177488) | Suitable surface types and the extra-pass time cost | A tuned ironing flow for the user's filament |

The Bambu wiki pages could not be fetched during this review. Bambu-specific behavior was checked in the official source code instead. General Prusa guidance does not replace Bambu or exact-filament presets. The existing thermal database remains reviewed on 12 October; this update does not claim a new temperature measurement or silently select an X2D extruder variant.

## Corrections made

| Area | Updated behavior |
| --- | --- |
| Existing calibration | Keep provided filament flow ratio and maximum flow. Keep first-layer expansion compensation rather than forcing it to zero. Hole, contour, shrink and bridge-flow corrections remain preset/calibration controls. |
| Speed | Use one valid positive current maximum-flow value when supplied without object overrides. Never choose among different array variants. Apply known flow caps to first-layer and ordinary support speeds. Overhang starting speeds cannot exceed the suggested outer-wall speed. |
| Speed calculation | The advisor uses maximum flow ÷ (line width × layer height) with a 10% margin. This is an authored rectangular approximation, not the slicer's complete extrusion or motion model. Bridges keep a separate trial speed. |
| Bottle cover | An explicit bottle-cover efficiency choice is no longer overwritten by the flat-top rule. The tool still does not measure cavity clearance or redesign the cover. |
| Stability | Visible-surface acceleration stays at or below the reduced general acceleration when the stability rule applies. Travel retains a separate setting. |
| Confidence | Distinguish advisor starting points, published baselines and existing settings. Confidence concerns the stated evidence, not guaranteed print success. |

## Practical verification

Compare Studio's sliced time, Speed and Flow views before changing several fields together. Check support contacts and removal access, actual wall paths, top coverage and first-layer adhesion. For a bottle cover, measure the internal cavity and bottle and print a small fit section. Thin cover walls may contain little sparse infill, so lowering infill can save much less time than expected.

The advisor produces planning ranges rather than toolpaths. Actual print time, unsupported islands, local wall widths, bridge spans, surface defects and mechanical performance still need slicing or physical testing.

## X2D nozzle selection update (13 October 2026)

Speed now has Main: Standard (left) and Auxiliary: Standard (right) selectors. Both use the diameter and filament selected in Print context. Recommendations may match when the same material and profile limits apply; values are not made different just to distinguish the tabs. Mixed material or mixed diameter jobs require reviewing each nozzle with its own print context.

The pinned official [direct/Bowden template](https://github.com/bambulab/BambuStudio/blob/47a13eeb1d9af65ef2371e361c856e21d4f6ca72/resources/profiles/BBL/filament/fdm_filament_template_direct_bowden.json) lists Direct Drive Standard, Direct Drive High Flow, Bowden Standard, Bowden High Flow. The [E3D template](https://github.com/bambulab/BambuStudio/blob/47a13eeb1d9af65ef2371e361c856e21d4f6ca72/resources/profiles/BBL/filament/fdm_filament_template_direct_bowden_e3d.json) inserts E3D High Flow after each drive's High Flow entry. X2D Standard baseline selection uses indices 0 and 2 for the four-entry layout, and 0 and 3 for the six-entry layout. This supersedes the earlier withholding of differing Standard/hotend arrays.

Imported current values are resolved by exact `print_extruder_variant` or `filament_extruder_variant` labels rather than assumed array order. Missing labels leave differing current values blank. Nozzle-specific manual edits remain independent. Global object overrides still require review in Studio. Text and JSON reports include both nozzle speed recommendations.

## Single time estimate and filament mass (14 October 2026)

The time panel and mode comparison show one duration rounded to the nearest minute, not a range. Reports include the same estimate and model/support grams. A user-provided Studio sliced duration takes precedence in the headline and is labelled as such.

Time is calculated from estimated deposited walls, shell and infill volume; role-specific speeds and line cross-sections; the selected material's volumetric-flow limit; an approximate short-move acceleration adjustment; minimum layer cooling; estimated support extrusion; 15% travel plus 0.6 seconds per layer; and a 10-minute preparation allowance. These are authored modeling assumptions, not generated toolpaths. It is a single point estimate, not an exact slicer result.

Grams = deposited mm³ / 1000 × density g/cm³. Published profile density is preferred. When unavailable, labelled family assumptions are used: PLA variants 1.24, PETG variants 1.27, ABS 1.04, ASA 1.07 and TPU 1.21 g/cm³; unknown material falls back to 1.24. Model mass and estimated support mass are shown separately. Support volume uses 8% plus overhang percentage, capped at 40% of model extrusion. This does not simulate support generation. Purging, prime tower, brim and loading waste are excluded.

When mesh volume is unverified, the surface-area proxy remains explicitly approximate for both grams and time. The application has no browser slicer engine or server slicing service. Generating toolpaths with a compatible slicer is required for a slicer-derived estimate; even that cannot guarantee the actual physical completion time.

## Surface-finish recommendation review (15 October 2026)

The former ironing rule required the finish preference, reliable normals, top area above 30% of the total surface and no detail preference. This missed explicit coaster intent and disabled a provided Topmost surface choice. These conditions are replaced by a named surface-finish decision:

- Coaster intent triggers an ironing trial for supported rigid materials. Unverified normals require explicit Preview review; reliable geometry with no substantial horizontal top does not trigger ironing.
- Measured flat-top evidence uses upward horizontal area (normal Z above 0.98), at least 15% of the XY bounding footprint and at least 4 mm². This is an authored screening heuristic, not a sliced top-surface measurement. It replaces the misleading total-surface percentage cutoff.
- Existing Top surfaces / Topmost surface choices and valid ironing speed, flow and spacing are preserved. Fine-detail preference prompts an artwork warning rather than a blanket veto.
- Default Top surfaces covers lower flat backgrounds below raised text. Topmost surface only treats the highest layer and may leave the coaster background untouched. Inspect actual paths in Preview.
- PETG requires a clean nozzle and a test patch because plastic can accumulate on the nozzle. Fast mode explicitly warns that ironing adds time. TPU and unknown materials do not receive automatic ironing.
- Trial values, when no valid value is provided: 20 mm/s, 10% flow, spacing 0.375 × nozzle diameter (0.15 mm at 0.4 mm). These are authored starting points, not manufacturer calibration. Existing numeric values are preferred.
- Explicit coaster intent also drives top-shell backing when normals are unverified. Coaster top-fill speed is capped at 40 mm/s for PETG or 50 mm/s for other rigid materials, without changing hidden infill/travel speeds. Lower existing priority speeds and flow caps still apply.
- Time and grams now include the extra ironing pass and extrusion. Aggregate area cannot distinguish Topmost paths from lower terraces; those estimates still require slicer confirmation.

Reviewed the surface-finish chain across geometry evidence, user intent, material behavior, current calibration, top-shell backing, top speed, ironing and time/mass reporting. This is not certification of every setting or a physical print result. [Primary technical guidance: Prusa ironing](https://help.prusa3d.com/article/ironing_177488). Bambu field names and placement remain pinned to the existing official configuration snapshot.
