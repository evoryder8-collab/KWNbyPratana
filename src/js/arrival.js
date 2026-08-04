/**
 * The arrival.
 *
 * One idea, executed precisely: light coming up in a room. Warmth arrives
 * before detail. A warm wash sits over the hero at full strength, then lifts
 * — as though someone is slowly raising a dimmer — and as it lifts the hero
 * resolves underneath it. The last frame of the sequence is the first frame
 * of the page, because it is literally the same DOM: nothing is rebuilt or
 * handed over.
 *
 * Rules this obeys:
 * - First visit only, remembered in sessionStorage. Nobody sits through it
 *   twice.
 * - The page is readable and usable in well under two seconds. The wash is
 *   pointer-events:none from the first frame, so a visitor can click through
 *   it while it is still lifting.
 * - Skippable by any scroll, tap, or key. Skipping lands in the finished
 *   state, never a half-lit one.
 * - Nothing loads behind a blank screen. The hero paints first and the wash
 *   plays *over* content that is already there — if this module never runs,
 *   the page is simply the finished page.
 * - Under prefers-reduced-motion it does not run at all.
 *
 * The timing is an exhale: a long, decelerating lift rather than a spring.
 */

const KEY = "kwiin-arrived";

export function initArrival() {
  const hero = document.querySelector(".home-hero");
  if (!hero) return;

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  try {
    if (sessionStorage.getItem(KEY) === "1") return;
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Private mode: play it once, this visit only.
  }

  const veil = document.createElement("div");
  veil.className = "arrival";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = '<span class="arrival__warmth"></span>';
  document.body.appendChild(veil);
  document.documentElement.classList.add("is-arriving");

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    document.documentElement.classList.remove("is-arriving");
    veil.classList.add("is-done");
    // Remove only after the fade completes, so nothing pops.
    veil.addEventListener("transitionend", () => veil.remove(), { once: true });
    window.setTimeout(() => veil.remove(), 1400);
    window.removeEventListener("scroll", finish);
    window.removeEventListener("pointerdown", finish);
    window.removeEventListener("keydown", finish);
  };

  // Any intent to interact ends the sequence immediately, in its final state.
  window.addEventListener("scroll", finish, { once: true, passive: true });
  window.addEventListener("pointerdown", finish, { once: true });
  window.addEventListener("keydown", finish, { once: true });

  // The lift itself. Kicked off on the next frame so the hero has painted.
  requestAnimationFrame(() => {
    veil.classList.add("is-lifting");
    window.setTimeout(finish, 1750);
  });
}
