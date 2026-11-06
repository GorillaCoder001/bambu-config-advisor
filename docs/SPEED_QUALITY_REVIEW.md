# Speed with surface quality review — 6 November 2026

The reference screenshot shows a 75.74 mm five-colour PETG holder, 776 displayed layers, a large tower, 244.67 g and 22 h 46 min. The purple body is assigned to the auxiliary nozzle; four smaller colours are on Main. Studio says the current grouping is not optimal and shows 5 g extra filament / zero extra nozzle purges. That message alone does not prove a particular time saving. No project or G-code was supplied, so none of these changes has been sliced against that exact model and no replacement time is claimed.

## Changes

- Balanced uses half the nozzle diameter as layer height: 0.20 mm for a 0.4 mm nozzle, instead of 0.16 mm. Fast uses 0.24 mm. Maximum quality remains an explicit fine-layer choice.
- Figurine no longer implicitly selects the fine-detail slowdown in every mode. Balanced figurines use 0.16 mm without the extra 20% outer/top slowdown; the fine-detail checkbox and Maximum quality retain their finer settings.
- Ordinary functional/container parts use 3 walls, 15% infill, 0.8 mm top and 0.6 mm bottom. Mechanical/outdoor/heat-exposed parts, explicit strength and Maximum strength retain 4 walls/30% with thicker skins. Flat/coaster rules still reinforce broad skins. A flat top on a tall 3D object no longer automatically invokes the flat-part reinforcement rule.
- Ordinary functional Balanced/Fast jobs use Adaptive Cubic to reduce eligible interior work; heavy-load jobs keep Gyroid. Compare sliced time and top-skin support. No pattern is claimed fastest for every mesh.
- Infill combination is suggested only for eligible moderate-load Balanced/Fast jobs. It may do nothing at 0.20 mm with the selected nozzle's maximum combined height. The advisor does not subtract invented time for it.
- Support remains geometry-driven, including uncertain mesh normals. Decorative/ordinary functional support trials use slim trees; Balanced/Fast use a 40° threshold from horizontal, 2 interface layers and 3 mm base spacing. Reachability is not inferred: build-plate-only stays off by default. Inspect tongue/spike islands and underside finish. Same-material top gap is one layer with a 0.20 mm floor, rather than automatically doubling PETG layer height; this may improve underside support but needs a removal coupon.
- Prime tower state and flushing calibration stay authoritative. Purge into supports is suggested only for an imported enabled tower, required supports and one known configured material family. Flush into infill is not automatically enabled because dark colours can show through light shells. No automatic purge-multiplier reduction.
- Surface speeds, initial layer, overhang slowdown, calibrated flow ratio/MVS and material cooling remain protected. Requested mm/s stay within the known flow using a 10% margin. Increasing speed above a material's flow limit cannot solve a colour-change dominated job.
- X2D Auxiliary recommendations are explicitly capped to 200 mm/s and 1000 mm/s², including travel, even without imported machine limits. Lower imported limits still win. Main does not inherit that cap. Existing retained calibration rows are not overwritten.
- The visible Speed + quality panel provides one action to select Balanced and clear fine-detail preference, retaining material/nozzle/strength/finish inputs. It explains tower/grouping checks and warns that model height is not a completion-time limit.

## Evidence and scope

Numeric process settings above are engineering trial values, not Bambu-certified optimums. Supported parameter names, enums and behavior were checked against the repository's pinned Studio schema and current Bambu Studio PrintConfig definitions:
https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/PrintConfig.cpp

Auxiliary hardware limits and the asymmetric nozzle roles are documented by Bambu:
https://blog.bambulab.com/two-extruders-one-purpose-what-is-x2d-direct-drive-extrusion-and-auxiliary-extrusion/

The main optimization order is layer count → internal material → necessary supports → compare physical nozzle/AMS grouping → examine actual sliced time breakdown → only then tune requested speeds within calibrated material flow. Putting the bulk colour on Main is a comparison to run, not an unconditional regrouping instruction: it may add AMS reloads. Saved Studio time is never rewritten as if the new settings had already been sliced. The browser still uses the previously agreed lightweight geometry estimator; it cannot validate the full multicolour duration.
