# Simple upload workflow

The experimental Three Slicer workspace was removed after a large uploaded model hit its ten-minute watchdog, including in economy mode. Removing its viewer alone would not remove the expensive slicing work. The engine also lacked multicolour timing and validated X2D nozzle grouping, so running it silently in the background would not solve those accuracy limits.

The current flow is upload one STL/3MF → background geometry processing → automatically show time and grams. No separate file, browser-slicer workspace, manual colour-change count or waste entry is required. The analysis worker parses full model geometry, reads saved slice summaries, and sends measured analysis to the existing lightweight recommendation estimator. This is estimation, not real toolpath generation.

If the original 3MF contains a valid Studio slice summary, its saved time and grams appear automatically. A multi-plate file exposes a plate selector. Original saved results stay labelled as original Studio settings and do not change with new recommendations. Otherwise one approximate duration and gram amount are shown. An unverified volume is explicitly marked very rough. For multicolour projects without saved results, the displayed values are model/support subtotals, not a complete job total: unknown colour-change timing, purge, tower and hardware operations are excluded rather than invented. STL does not carry painted material assignments.

The background geometry worker already has cancellation and guards against stale uploads. While processing, previous time/grams are hidden. No model is uploaded to a server. No WebGL or large WASM download is needed for estimates; the existing optional geometry preview uses WebGL independently.

Three Slicer, its viewer, WASM smoke check and associated AGPL integration files are removed from the application and dependency lockfile. The original advisor's MIT license remains.
