import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Deployed for preview on GitHub Pages. When the kwiin-by-pratana.ch
  // custom domain is ready, update `site` to it and remove `base`.
  site: "https://evoryder8-collab.github.io",
  base: "/KWNbyPratana",
  vite: {
    plugins: [tailwindcss()],
  },
});
