# Akule project website

Static research companion for **Akule: Fast and Scalable Multi-Robot Motion Planning via Sparse Interaction Diffusion**.

Serve locally with `python -m http.server 8000`. GitHub Pages publishes `main` from `/`; no build tool or external font is required.

- `assets/media-manifest.json`: 44 complete 2D comparison panels across eight environments. Each entry records population, original panel filename, displayed methods, caption, dimensions, frame rate, and video/poster paths. The original H.264 video streams are preserved, with no cropping, resizing, or temporal changes.
- `assets/benchmark-results.json`: 180 rows transcribed from the final paper tables, with original decimal precision, table filename, line number, and source hash. Select a population or inspect the full table. Cross-paper timing qualifications remain with the relevant tables.
- `assets/figure-manifest.json`: final paper figure sources and hashes. Figures open in a keyboard-accessible preview; Escape closes it.
- `app.js`: independent gallery/results filters with links that transfer the selected population, plus lightweight U/G schematics. Only the selected gallery video is loaded. Reduced-motion preferences pause the schematics and disable automatic hero playback.

The website preserves anonymous review. Paper and supplement links can be added once approved anonymous public PDFs are available.
