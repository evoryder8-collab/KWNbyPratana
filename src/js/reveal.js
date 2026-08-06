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

  const show = (el) => {
    if (el.classList.contains(REVEALED)) return;
    if (el.hasAttribute("data-stagger")) {
      // Children arrive in sequence, capped so a long list never trails.
      [...el.children].forEach((child, i) => {
        child.style.transitionDelay = `${Math.min(i * 90, 540)}ms`;
        child.classList.add(REVEALED);
      });
    } else {
      el.classList.add(REVEALED);
    }
  };

  /**
   * A generous positive root margin is the whole point: elements are told to
   * appear a full viewport *before* they scroll into view. The previous
   * negative margin did the opposite — it delayed the reveal until an element
   * was already well inside the viewport, and on a phone a fast momentum
   * scroll outruns that easily, so you arrive at a section before it has been
   * told to exist and scroll through blank space until it catches up.
   */
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      show(entry.target);
    }
  }, { rootMargin: "120% 0px 120% 0px", threshold: 0 });

  blocks.forEach((el) => observer.observe(el));
  groups.forEach((el) => observer.observe(el));

  /**
   * IntersectionObserver callbacks are throttled during iOS momentum
   * scrolling, so the observer alone is not a guarantee. This scroll handler
   * is the safety net: it is passive, rAF-throttled, reads nothing it has not
   * already been given, and reveals anything within two viewports. Once every
   * element is shown it removes itself.
   */
  let pending = false;
  const sweep = () => {
    pending = false;
    const vh = window.innerHeight;
    let remaining = 0;
    [...blocks, ...groups].forEach((el) => {
      if (el.classList.contains(REVEALED)) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 2 && r.bottom > -vh) { observer.unobserve(el); show(el); }
      else remaining += 1;
    });
    if (!remaining) window.removeEventListener("scroll", onScroll);
  };
  const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(sweep); } };
  window.addEventListener("scroll", onScroll, { passive: true });

  // And anything already near the viewport on load never waits at all.
  requestAnimationFrame(sweep);
}
