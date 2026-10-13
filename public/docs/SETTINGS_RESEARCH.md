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
