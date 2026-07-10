/**
 * Shared animation bootstrapping for GSAP/ScrollTrigger reveals, the
 * "magnetic" hover effect used on buttons, cursor-perspective tilt on
 * content cards, word-by-word manifesto reveals, and scroll counters.
 * Initialized once globally from BaseLayout and re-run after every Astro
 * view transition swap.
 *
 * Everything here is a no-op (or safely skipped) when the user has
 * prefers-reduced-motion enabled, and never hides content that JS fails
 * to reach. Initial opacity is only ever set right before animating in.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate } from "motion";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initSectionReveals(): void {
  const blocks = document.querySelectorAll<HTMLElement>("[data-section-reveal]");

  blocks.forEach((block) => {
    if (block.dataset.revealBound === "true") return;
    block.dataset.revealBound = "true";

    const stagger = block.dataset.stagger === "true";
    const targets = stagger
      ? Array.from(block.querySelectorAll<HTMLElement>("[data-reveal-child]"))
      : [block];
    const items = targets.length ? targets : [block];

    gsap.set(items, { opacity: 0, y: 28 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: stagger ? 0.12 : 0,
      scrollTrigger: { trigger: block, start: "top 85%", once: true },
    });
  });

  // Standalone cards (award/service/testimonial cards, etc.) marked with
  // .reveal-up animate in individually wherever they appear on a page.
  const cards = document.querySelectorAll<HTMLElement>(".reveal-up:not([data-reveal-bound])");
  cards.forEach((card) => {
    card.dataset.revealBound = "true";
    gsap.set(card, { opacity: 0, y: 24 });
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 90%", once: true },
    });
  });
}

/**
 * Word-by-word reveal for manifesto lines marked with [data-words].
 * The original text is preserved on the element as aria-label; the visual
 * word spans are aria-hidden, so screen readers hear one clean sentence.
 * Skipped entirely under reduced motion (text simply stays visible).
 */
function initWordReveals(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-words]:not([data-words-bound])");

  els.forEach((el) => {
    el.dataset.wordsBound = "true";
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ");
    if (!text) return;

    el.setAttribute("aria-label", text);
    const frag = document.createDocumentFragment();
    const words = text.split(" ");
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "kwiin-word";
      span.textContent = word;
      span.setAttribute("aria-hidden", "true");
      frag.appendChild(span);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
    });
    el.textContent = "";
    el.appendChild(frag);

    const spans = el.querySelectorAll<HTMLElement>(".kwiin-word");
    gsap.to(spans, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

/**
 * Counts [data-counter] elements up from 0 to their target when scrolled
 * into view, formatted for de-CH (2'500). The final value is authored in
 * the HTML, so no-JS and reduced-motion users always see the real number.
 */
function initCounters(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-counter]:not([data-counter-bound])");

  els.forEach((el) => {
    el.dataset.counterBound = "true";
    const target = Number(el.dataset.counter ?? "0");
    if (!Number.isFinite(target)) return;
    const suffix = el.dataset.counterSuffix ?? "";
    const obj = { v: 0 };

    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toLocaleString("de-CH") + suffix;
      },
    });
  });
}

function initMagneticButtons(): void {
  const magnets = document.querySelectorAll<HTMLElement>(
    ".kwiin-magnetic:not([data-magnetic-bound])"
  );

  magnets.forEach((el) => {
    el.dataset.magneticBound = "true";
    const strength = 0.25;

    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e as MouseEvent).clientX - rect.left - rect.width / 2;
      const y = (e as MouseEvent).clientY - rect.top - rect.height / 2;
      animate(el, { x: x * strength, y: y * strength }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
    });

    el.addEventListener("mouseleave", () => {
      animate(el, { x: 0, y: 0 }, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    });
  });
}

// Cursor-perspective tilt for content cards (.kwiin-tilt). The whole card
// leans toward the pointer; a CSS sheen layer tracks --mx/--my. Fine-pointer
// devices only; the global reduced-motion guard skips this entirely.
function initTiltCards(): void {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return;

  const cards = document.querySelectorAll<HTMLElement>(
    ".kwiin-tilt:not([data-tilt-bound])"
  );
  cards.forEach((el) => {
    el.dataset.tiltBound = "true";
    const MAX = 6;
    let cx = 0,
      cy = 0,
      tx = 0,
      ty = 0,
      raf = 0;

    function render() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      el.style.transform = `perspective(900px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg)`;
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
        raf = requestAnimationFrame(render);
      } else {
        raf = 0;
      }
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(render);
    }

    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = ((e as PointerEvent).clientX - r.left) / r.width;
      const py = ((e as PointerEvent).clientY - r.top) / r.height;
      tx = (py - 0.5) * 2 * MAX;
      ty = (0.5 - px) * 2 * MAX;
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      kick();
    });
    el.addEventListener("pointerleave", () => {
      tx = 0;
      ty = 0;
      kick();
    });
  });
}

export function initKwiinAnimations(): void {
  if (prefersReducedMotion()) return;
  initSectionReveals();
  initWordReveals();
  initCounters();
  initMagneticButtons();
  initTiltCards();
}

export function refreshScrollTriggers(): void {
  ScrollTrigger.refresh();
}

export function resetKwiinAnimations(): void {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  document
    .querySelectorAll<HTMLElement>("[data-reveal-bound]")
    .forEach((el) => delete el.dataset.revealBound);
}
