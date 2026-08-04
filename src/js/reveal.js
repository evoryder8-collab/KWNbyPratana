/**
 * Scroll reveals.
 *
 * These used to live in the animation chunk alongside GSAP, which meant every
 * [data-reveal] element on the page was hidden by the `.js` class the moment
 * the main bundle ran, and stayed hidden until a 44 KB library finished
 * loading on an idle callback. On a slow connection that is seconds of blank
 * page below the fold, and if the chunk ever failed the content never
 * appeared at all.
 *
 * Reveals are content, so they belong in the main bundle. This is an
 * IntersectionObserver that adds a class; the transition itself is CSS.
 * Under prefers-reduced-motion everything is simply revealed at once.
 */

const REVEALED = "is-revealed";

export function initReveals() {
  const blocks = document.querySelectorAll("[data-reveal]");
  const groups = document.querySelectorAll("[data-stagger]");
  if (!blocks.length && !groups.length) return;

  const revealAll = () => {
    blocks.forEach((el) => el.classList.add(REVEALED));
    groups.forEach((g) => [...g.children].forEach((c) => c.classList.add(REVEALED)));
  };

  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      observer.unobserve(el);

      if (el.hasAttribute("data-stagger")) {
        // Children arrive in sequence, capped so a long list never trails.
        [...el.children].forEach((child, i) => {
          child.style.transitionDelay = `${Math.min(i * 90, 540)}ms`;
          child.classList.add(REVEALED);
        });
      } else {
        el.classList.add(REVEALED);
      }
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  blocks.forEach((el) => observer.observe(el));
  groups.forEach((el) => observer.observe(el));

  // Anything already in view on load should not wait for a scroll event.
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    [...blocks, ...groups].forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        observer.unobserve(el);
        if (el.hasAttribute("data-stagger")) {
          [...el.children].forEach((c, i) => {
            c.style.transitionDelay = `${Math.min(i * 90, 540)}ms`;
            c.classList.add(REVEALED);
          });
        } else {
          el.classList.add(REVEALED);
        }
      }
    });
  });
}
