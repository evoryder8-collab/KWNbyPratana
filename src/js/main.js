import "../styles/main.css";
import { initI18n } from "./i18n.js";
import { initNavigation } from "./navigation.js";
import { initPricing } from "./pricing.js";

document.documentElement.classList.add("js");

initI18n();
initNavigation();
initPricing();

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

function canUseWebGL() {
  try {
    const testCanvas = document.createElement("canvas");
    return Boolean(testCanvas.getContext("webgl2") || testCanvas.getContext("webgl"));
  } catch {
    return false;
  }
}

if (document.body.dataset.page === "home" && canUseWebGL()) {
  import("./three-scene.js").then(({ initThreeScene }) => initThreeScene()).catch(() => {
    document.querySelector("[data-hero-canvas]")?.remove();
  });
} else {
  document.querySelector("[data-hero-canvas]")?.remove();
}
