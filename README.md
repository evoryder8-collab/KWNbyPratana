# KWIIN by Pratana Halstrick

Die mehrsprachige Website von KWIIN: preisgekrönte Thai Massage im Studio in
Dübendorf und als Mobile Spa in der Region Zürich.

## Stack

- [Vite](https://vite.dev) als echte Multi Page Application
- Semantisches HTML, eigenes CSS und Vanilla JavaScript
- GSAP mit ScrollTrigger für Übergänge und Scroll Animationen
- Direktes Three.js für die ressourcenschonende Hero Konstellation
- Acht vollständig integrierte Sprachen

Die hochauflösenden Originalbilder liegen in `source-assets/`. Für die Website
werden daraus kleine responsive WebP Varianten in `public/assets/` verwendet.

## Entwicklung

```bash
npm ci
npm run dev        # http://localhost:5173/KWNbyPratana/
npm run build      # schreibt die Produktionsdateien nach dist/
npm run preview    # lokale Vorschau des Produktionsbuilds
```

## Deployment

Jeder Push auf `main` deployt automatisch via GitHub Actions auf GitHub Pages:
https://evoryder8-collab.github.io/KWNbyPratana/

Der letzte verifizierte Astro Stand vor dem Vite Neubau bleibt dauerhaft über
den Tag `live-astro-bef3379-2026-07-11` und die Branch
`backup/live-astro-bef3379-2026-07-11` verfügbar.
