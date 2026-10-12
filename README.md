# Created3D · Bambu Config Advisor

Browser-local STL/3MF model inspection and deterministic, explainable recommendations grouped like Bambu Studio. **This is a model-analysis + recommendation assistant, not a slicer.** No extrusion paths, support toolpaths, G-code, slicing time or filament-weight estimates are generated.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

The build is `dist/`. `vite.config.ts` uses `base: './'`; asset, worker and documentation URLs work under a project subpath such as `/bambu-config-advisor/`. The app has no server routes: Workspace, Research and Print guide use in-page state, so reloading the root URL works on GitHub Pages. No environment variables or secrets are needed. Dependencies are bundled; the app does not use external CDNs, fonts, analytics or AI APIs.

## Deploy to GitHub Pages

Repository: https://github.com/GorillaCoder001/bambu-config-advisor

1. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push to `main`, or run **Actions → Test and deploy GitHub Pages → Run workflow**.
3. Wait for both `build` and `deploy` jobs to succeed.
4. Open the URL returned by `deploy-pages`. The expected project URL is https://gorillacoder001.github.io/bambu-config-advisor/ . This URL is not evidence of deployment until the workflow succeeds.

The workflow tests, type-checks through the build script, builds, configures Pages, uploads `dist/` and deploys it. If `configure-pages` reports that Pages is not enabled, complete step 1 and rerun the failed workflow. The connector used to write the source does not expose Pages administration. A separate private Sites deployment can host the identical static build for review.

## What works

- Binary and ASCII STL; binary headers beginning with `solid` are handled correctly.
- Core 3MF meshes, units, build items, nested component transforms, mirrored transforms and local production-extension component paths.
- Three.js preview: orbit, zoom, pan, fit/reset, front, top, isometric, wireframe, bounding box and overhang-candidate overlay. View operations do not edit the file.
- Measurements: XYZ bounds, triangle/unique welded-vertex count, area, closed single-component volume, bounding footprint, height, aspect ratio, coplanar base-contact candidate, top/bottom-facing surface area, overhang distribution and near-axis flat-surface candidates.
- Mesh topology: boundary/non-manifold edges, components, winding conflicts, reversed component winding via signed volume, zero-area faces, duplicate triangles and complexity threshold.
- Geometry heuristics: flat/wide, tall/narrow, possible shell/sparse form and fine tessellation. Every inference is labeled; sampled edge sizes are **not** minimum printable features or wall thickness.
- Explainable rules for Quality, Strength, Speed, Support and Others; separate Filament & Temperature and Cooling tabs. Reasons, confidence, model/material/preference basis and source expansion.
- Printer/nozzle/material/plate/profile inputs; functional-fit, fine-detail, finish, strength and support-avoidance preferences.
- Quality/Balanced/Fast comparison; copy text, download JSON report and print-friendly full summary.
- Three synthetic samples: coaster, tower and overhang. They are clearly labeled as demo models.

## Printers and materials

Printers: Bambu Lab X2D, X1 Carbon, P1S, P1P, A1, A1 mini, and Other with custom XYZ build dimensions. X2D main-nozzle check uses 256 × 256 × 260 mm; auxiliary/dual check uses 235.5 × 256 × 256 mm. Reserved areas, brim, support footprint and nozzle assignments still need slice-preview verification. No automatic scaling is applied.

Nozzles: 0.2 / 0.4 / 0.6 / 0.8 mm. Availability and filament suitability depend on the actual printer/extruder; selecting a nozzle does not assert compatibility.

Families: PLA, PLA Matte, PLA Silk, PETG, PETG Matte, TPU, ABS, ASA and Other. Optional manufacturers: Bambu Lab, Polymaker, eSUN, Overture, SUNLU, Generic, Other. Unverified brand/profile names are explicitly a generic fallback, not a certified exact profile.

Verified exact product entries: Bambu PLA Basic, PLA Matte, original PLA Silk, PETG Basic, PETG HF, TPU 95A HF, ABS, ASA; eSUN PETG-Matte; Polymaker PolyLite PETG. Bambu values are applied only when the selected printer/nozzle appears in the pinned profile's compatible-printer list. Unknown Matte families do not inherit unrelated PLA/PETG values. Missing data remains “manufacturer preset / calibration required”.

## Material research and provenance

[Complete source matrix](docs/MATERIAL_SOURCE_MATRIX.md), internally checked **before** material database implementation. Data reviewed 2026-10-12; Bambu configurations pinned to commit `47a13eeb1d9af65ef2371e361c856e21d4f6ca72`. Recursive inheritance/include resolution preserves the specific source for each field. `studio-profiles.json` contains selected factual profile fields, not slicer code or complete G-code presets.

Manufacturer exact-product guidance takes priority over general material-family assumptions. eSUN Matte fan 50–100% and PolyLite PETG fan 0–20% belong to distinct products. Multiple differing extruder-variant array values remain unresolved; no first-index guess is used. Plate temperature `0` is rendered as unsupported. Drying oven, AMS and printer-bed conditions are distinct. Original Silk drying, eSUN Matte duration/MVS/flow, and generic-branded drying limits remain unknown where evidence is absent.

The database is a sourced starting point, **not physically production validated**. Manufacturer spool limits and calibrated profiles take precedence. Community numeric overrides are not implemented; MakerWorld is linked for comparing actual slice profiles only.

## Privacy, security and performance

Your model is analyzed locally in your browser and is not uploaded to a server. Files remain in memory and are released on replacement/closing. Exports may include geometry/context but omit the model's triangle coordinates and original filename. There is no persistence or telemetry. Opening a source link navigates to that public website but does not send the model.

All parsing/topology analysis runs in a Web Worker with progress and termination-based cancellation. Limits: 24 MiB input, 120,000 triangles, 500,000 resource vertices, 128 ZIP entries, 64 MiB declared expanded archive. ZIP directory/local sizes and paths are checked before model-entry decompression; ZIP64, encryption, external resources, traversal and high-ratio large entries are rejected. XML DOCTYPE/entities are rejected, entity processing is disabled, indices/transforms are validated, and cyclic or excessively nested component graphs are rejected. Model metadata is never rendered as HTML. A restrictive CSP excludes external runtime scripts and object embeds.

## Limitations

- STL has no units; millimeters are assumed. Verify dimensions.
- Analysis assumes print-up is original Z and the part rests at its lowest model point. Flat-surface candidates do not automatically rotate the model.
- Topology checks do not certify no self-intersections, overlapping shells, internal cavities or holes. Volume is withheld for multiple shells or inconsistent/open topology.
- Contact area is summed projected coplanar triangle area; footprint is a rectangle. It is not a polygon union and can overcount overlapping faces.
- Overhang candidates use face slope from horizontal and area weighting. Occlusion, anchors, actual bridge spans and support reachability need slicing. Winding issues downgrade orientation-dependent results.
- Local wall thickness, semantic text/figurine recognition and internal hole/shaft fits are not reliably measured. The user supplies intended use and fine-text context.
- Nominal process speeds are authored heuristics, capped by unambiguous known flow limits; machine constraints and calibrated flow still apply.
- Colours, painted supports, modifier meshes, existing 3MF slicer settings, plate assignments and advanced 3MF extensions are not imported. Multiple build items are analyzed together, with review guidance.
- OBJ, STEP and SVG are not supported. No silent mesh repair, scaling, reorientation or dimensional compensation.
- JSON/text are reports, **not Bambu Studio importable process presets**. Bambu's inheritance, IDs, machine compatibility and extruder variants make unsupervised preset export version-sensitive; verified round-trip compatibility is not claimed.
- Browser/WebGL QA was unavailable in the build environment. Automated UI tests mock the renderer/Worker wiring; a real-device smoke test remains necessary.

## Add printers, profiles or rules

- Printers/build volumes: `src/profiles/printers.ts`; cite an official specification, handle enclosure/active-chamber distinctions.
- Products: `filamentChoices` and exact-product overrides in `src/profiles/materials.ts`; add source title/URL/access date/version and update the source matrix **first**.
- Bambu baseline refresh: `scripts/refresh-studio-profiles.mjs <full-commit-SHA>`. Review the generated candidate in scratch; never automatically replace reviewed data. Resolve inheritance and includes, match printer/nozzle compatibility, preserve arrays and per-field provenance. The script requires development-time internet; runtime does not.
- Named ordered rules: `src/recommendations/policies.ts`. UI is separate from rules and analysis. Add behavioral tests that demonstrate an actual difference.
- Source label mapping: official `PrintConfig.cpp` at the pinned SHA; review names against the intended Bambu Studio version before expanding field coverage.

## Verification and next enhancements

Tests cover parsing, security rejection, synthetic geometry, deterministic rule ordering, brand/profile separation, build volumes, copying/export, tab navigation and input changes. See [implementation report](docs/IMPLEMENTATION_REPORT.md).

Next: real-printer coupon validation; official extruder-variant index mapping; BVH-based local thickness and occlusion sampling; per-object/per-plate 3MF selection; conservative orientation ranking; browser/WebGL and narrow-screen QA; a verified native-preset round-trip test for one explicitly supported Bambu Studio version.
