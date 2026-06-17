import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://kwiin-by-pratana.ch",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
