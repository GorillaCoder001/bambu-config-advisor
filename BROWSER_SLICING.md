# Browser slicing (experimental)

The advisor now lazy-loads Three Slicer 0.4.1 and its matching viewer. The original upload is retained in memory and handed directly to the viewer’s public `files` API. This preserves the engine’s 3MF project-import path (layout, settings and facet painting) instead of passing the advisor’s flattened analysis mesh. No model is sent to a server. STL samples are converted to binary STL without shifting their coordinates. Closing the workspace unmounts it and terminates its workers.

The workflow is upload → Open browser slicer → check imported settings → Slice. Existing geometry/manual/saved-slice controls are collapsed under Advanced. The browser workspace uses its own project settings; advisor changes do not silently claim to update its cached slice.

## Verified engine limits

A real WASM smoke test (`npm run test:slicer`) slices one box and two material-assigned boxes. It verifies emitted G-code, both tool IDs, per-tool filament totals and a nonzero real prime tower. The pinned engine provides time for the single-material case, but **does not provide time_estimate for the multicolour path**. The UI displays that limitation instead of substituting geometry time or multiplying by colour count. Thus this release enables browser slicing but does not solve complete multicolour/X2D timing.

Filament mass = sum over each used tool of filament length × π × (diameter/2)² × density / 1000. The engine’s filament length already includes its tower. Missing density yields no grams, rather than an assumed PLA value. External flushing, startup waste and vendor firmware procedures are not certified as complete. X2D physical nozzle grouping is not validated by this engine. Downloads are intercepted to prevent presenting unvalidated output as a production printer file.

Some imported schema settings are unsupported by the kernel; its `partialSupport()` disclosures are exposed. Native project import support does not imply parity with Bambu Studio. The engine documents a timing difference between single- and multi-threaded kernels. GitHub Pages runs the single-threaded worker without cross-origin isolation; it still runs off the UI thread. No COOP/COEP changes or service worker are added.

## Source and licensing

Original advisor files retain their MIT notice. BrowserSlicer.tsx is offered under AGPL-3.0-or-later; the combined application including the AGPL engine is distributed subject to that license’s applicable terms. The full license is served as AGPL-3.0.txt. Corresponding application source is linked in the workspace, engine source is https://github.com/kimgh06/Three_Slicer (npm three-slicer@0.4.1); the separate viewer is MIT. Both packages are pinned in package-lock.json. No modified engine binary is distributed.
