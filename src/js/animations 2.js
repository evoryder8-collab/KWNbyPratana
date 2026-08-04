import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function initPortal() {
  const portal = document.querySelector("[data-portal]");
  if (!portal) return;
  const cards = [...portal.querySelectorAll("[data-portal-card]")];
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (finePointer) {
    const setX = gsap.quickTo(portal, "--portal-x", { duration: 0.8, ease: "power3.out" });
    const setY = gsap.quickTo(portal, "--portal-y", { duration: 0.8, ease: "power3.out" });
    portal.addEventListener("pointermove", (event) => {
      const bounds = portal.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 4;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -3;
      setX(`${x}deg`);
      setY(`${y}deg`);
    });
    portal.addEventListener("pointerleave", () => {
      setX("0deg");
      setY("0deg");
    });
  }

  const clearPressed = () => cards.forEach((card) => card.classList.remove("is-pressed"));
  cards.forEach((card) => {
    card.addEventListener("pointerdown", () => {
      clearPressed();
      card.classList.add("is-pressed");
    });
    card.addEventListener("pointerup", () => window.setTimeout(clearPressed, 160));
    card.addEventListener("pointercancel", clearPressed);
    card.addEventListener("pointerleave", clearPressed);
  });
  window.addEventListener("blur", clearPressed);
  document.addEventListener("visibilitychange", clearPressed);
}

function initCounters() {
  document.querySelectorAll("[data-counter]").forEach((element) => {
    const target = Number(element.dataset.counter);
    const suffix = element.dataset.counterSuffix ?? "";
    const state = { value: 0 };
    ScrollTrigger.create({
      trigger: element,
      start: "top 88%",
      once: true,
      onEnter: () => gsap.to(state, {
        value: target,
        duration: 1.8,
        ease: "power3.out",
        onUpdate: () => {
          const value = Math.round(state.value);
          element.textContent = `${value >= 1000 ? value.toLocaleString("de-CH") : value}${suffix}`;
        },
      }),
    });
  });
}

export function initAnimations() {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    document.querySelectorAll("[data-reveal], [data-stagger] > *").forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
    return;
  }

  gsap.utils.toArray("[data-reveal]").forEach((element) => {
    gsap.to(element, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: element, start: "top 88%", once: true },
    });
  });

  gsap.utils.toArray("[data-stagger]").forEach((group) => {
    gsap.to(group.children, {
      y: 0,
      opacity: 1,
      duration: 0.85,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: group, start: "top 86%", once: true },
    });
  });

  gsap.utils.toArray(".inner-hero__art span, .services-hero__ribbons span, .contact-hero__rings span").forEach((element, index) => {
    gsap.to(element, {
      yPercent: index % 2 ? 12 : -12,
      xPercent: index % 2 ? -4 : 4,
      ease: "none",
      scrollTrigger: { trigger: element.parentElement, start: "top top", end: "bottom top", scrub: 1.2 },
    });
  });

  initPortal();
  initCounters();
  ScrollTrigger.refresh();
}
