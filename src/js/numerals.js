/**
 * Animated numerals.
 *
 * Two moments on this site involve a number changing, and both should feel
 * like the figure settling rather than being swapped:
 *
 *   1. The heritage statistics (2'500 years, 2019, 4 medals) count up as they
 *      scroll into view.
 *   2. A price changes when the visitor picks a different travel radius. This
 *      is the money moment — the number should visibly travel from the old
 *      value to the new one so the visitor sees the cost of their choice
 *      rather than finding a different number where the old one was.
 *
 * Timing follows the site's register: an exhale, not a spring. Easing is
 * expo-out so the figure moves decisively then settles, and digits are
 * tabular so nothing reflows while counting.
 *
 * Under prefers-reduced-motion no counting happens; values are written
 * directly. The final value is always correct even if the animation is
 * interrupted mid-flight by another change.
 */

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -9 * t));

/**
 * Swiss formatting: 2'500.
 *
 * Grouping is opt-in per element rather than "any value over 999", because
 * that rule turns the year 2019 into 2'019. The authored markup already
 * contains the correct final rendering ("2'500+" but "2019"), so we read the
 * intent from there and the HTML stays the source of truth.
 */
function format(value, { thousands = false } = {}) {
  const rounded = Math.round(value);
  return thousands && rounded >= 1000 ? rounded.toLocaleString("de-CH") : String(rounded);
}

/** Does the value as authored in the HTML use a thousands separator? */
function authoredUsesGrouping(element) {
  return /[’'’.  ]\d{3}\b/.test(String(element.textContent));
}

const running = new WeakMap();

/**
 * Tween an element's numeric text from its current value to `to`.
 * Re-entrant: a new call cancels the previous tween on the same element and
 * continues from wherever it had reached, so rapid changes stay smooth.
 */
export function animateNumber(element, to, { duration = 900, thousands = false, suffix = "" } = {}) {
  if (!element) return;

  const previous = running.get(element);
  if (previous) cancelAnimationFrame(previous.frame);

  const from = previous ? previous.value : Number(String(element.textContent).replace(/[^\d.-]/g, "")) || 0;

  if (reduced() || from === to) {
    running.delete(element);
    element.textContent = format(to, { thousands }) + suffix;
    return;
  }

  const started = performance.now();
  const state = { value: from, frame: 0 };
  running.set(element, state);

  const step = (now) => {
    const progress = Math.min(1, (now - started) / duration);
    state.value = from + (to - from) * easeOutExpo(progress);
    element.textContent = format(state.value, { thousands }) + suffix;
    if (progress < 1) {
      state.frame = requestAnimationFrame(step);
    } else {
      state.value = to;
      element.textContent = format(to, { thousands }) + suffix;
      running.delete(element);
    }
  };
  state.frame = requestAnimationFrame(step);
}

/**
 * Heritage counters. Uses IntersectionObserver directly rather than
 * ScrollTrigger so the numbers work even before the animation bundle has
 * loaded — these are content, not decoration.
 */
export function initCounters() {
  const targets = document.querySelectorAll("[data-counter]");
  if (!targets.length) return;

  // Read the formatting intent from the authored markup before we touch it.
  targets.forEach((el) => { el.dataset.counterGroup = String(authoredUsesGrouping(el)); });

  if (reduced()) {
    targets.forEach((el) => {
      const value = Number(el.dataset.counter);
      el.textContent = format(value, { thousands: el.dataset.counterGroup === "true" })
        + (el.dataset.counterSuffix ?? "");
    });
    return;
  }

  // Hold at zero until seen, so the count is witnessed rather than missed.
  targets.forEach((el) => {
    el.style.fontVariantNumeric = "tabular-nums";
    el.textContent = "0" + (el.dataset.counterSuffix ?? "");
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      animateNumber(el, Number(el.dataset.counter), {
        duration: 1900,
        thousands: el.dataset.counterGroup === "true",
        suffix: el.dataset.counterSuffix ?? "",
      });
    });
  }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });

  targets.forEach((el) => observer.observe(el));
}
