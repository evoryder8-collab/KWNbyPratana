# KWIIN by Pratana Halstrick

Where Luxury meets Healing. Die Website von KWIIN: preisgekrönte Thai-Massage
im Studio in Dübendorf und als Mobile Spa in der ganzen Region Zürich.

## Stack

- [Astro 6](https://astro.build) + View Transitions
- Tailwind CSS 4
- GSAP ScrollTrigger, Lenis smooth scroll, Motion
- React Three Fiber (hero aura shader)

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:4321/KWNbyPratana
npm run build      # astro check + production build
```

## Deployment

Jeder Push auf `main` deployt automatisch via GitHub Actions auf GitHub Pages:
https://evoryder8-collab.github.io/KWNbyPratana/

Wenn die Domain kwiin-by-pratana.ch bereit ist: `site` in `astro.config.mjs`
anpassen und `base` entfernen.
