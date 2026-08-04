import "../styles/main.css";
import { initI18n } from "./i18n.js";
import { initNavigation } from "./navigation.js";
import { initPricing } from "./pricing.js";
import { initCounters } from "./numerals.js";
import { initArrival } from "./arrival.js";

document.documentElement.classList.add("js");

// Arrival runs first so the wash is in place on the same frame the hero
// paints; it is a no-op on every page but the home page's first visit.
if (document.body.dataset.page === "home") initArrival();

initI18n();
initNavigation();
initPricing();
initCounters();

let animationsStarted = false;
const startAnimations = () => {
  if (animationsStarted) return;
  animationsStarted = true;
  import("./animations.js").then(({ initAnimations }) => initAnimations());
};

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(startAnimations, { timeout: 1800 });
} else {
  window.setTimeout(startAnimations, 700);
}

window.addEventListener("scroll", startAnimations, { once: true, passive: true });
window.addEventListener("pointerdown", startAnimations, { once: true, passive: true });

// The sen network is Canvas 2D, so it needs no capability probe and no
// WebGL fallback path. If the module fails to load the canvas is removed and
// the hero still reads as finished.
if (document.body.dataset.page === "home") {
  import("./sen-network.js").then(({ initSenNetwork }) => initSenNetwork()).catch(() => {
    document.querySelector("[data-hero-canvas]")?.remove();
  });
} else {
  document.querySelector("[data-hero-canvas]")?.remove();
}
