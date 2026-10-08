# Akule project website

Static project website for **Akule: Fast and Scalable Multi-Robot Motion Planning via Sparse Interaction Diffusion**.

Serve this directory with any static HTTP server. No build step, package installation, external font, or client framework is required.

```bash
python -m http.server 8000
```

GitHub Pages: publish `main` from `/` in Settings → Pages. `.nojekyll` preserves the static assets. The site is intended for `https://akule-diff.github.io/`.

The responsive gallery loads one selected recording at a time. H.264 MP4 videos include posters, inline controls, and no identifying metadata. Reduced-motion preferences disable automatic hero playback. `assets/media-manifest.json` records environment, population, method, source recording, and published asset names.

Research content and figures accompany the anonymous AAMAS submission. Code: https://github.com/akule-diff/Akule.
