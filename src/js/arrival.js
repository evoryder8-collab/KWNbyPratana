/**
 * The arrival.
 *
 * Still one idea — light coming up in a room — but staged, so it is actually
 * witnessed rather than glimpsed. The sequence:
 *
 *   0.00s  A warm luminous field holds the screen. Warmth before detail.
 *   0.20s  The KWIIN emblem settles into a precious-metal finish.
 *   0.62s  A single golden light wave travels across its original colour.
 *   1.05s  The wordmark rises beneath it, letterspacing opening as it settles.
 *   1.70s  The line of the brand appears.
 *   2.35s  The lockup lifts and dissolves as the light begins to go up.
 *   2.60s  The hero resolves underneath; the sen network draws its lines in.
 *   4.00s  Done. The veil is gone and the page is simply the page.
 *
 * It resolves *into* the hero rather than handing over: the emblem dissolves
 * toward the portrait seal's position, and the light lifting is what reveals
 * the hero, which has been sitting there fully painted the whole time.
 *
 * Guarantees kept from the first version:
 * - First visit per session only, unless explicitly replayed from the logo.
 * - pointer-events:none throughout, so the page is clickable from frame one.
 * - Any scroll, tap or key press skips instantly to the finished state.
 * - Does not run at all under prefers-reduced-motion.
 * - Nothing loads behind it; it plays over content that has already painted.
 */

const KEY = "kwiin-arrived";
const REPLAY_KEY = "kwiin-replay-arrival";

const EMBLEM = `
  <span class="arrival__emblem" aria-hidden="true">
    <img class="arrival__logo" src="/assets/kwiin-logo.png" alt="" width="768" height="768" decoding="async">
    <span class="arrival__gleam"></span>
  </span>`;

let active = null;

export function playArrival({ force = false } = {}) {
  const hero = document.querySelector(".home-hero");
  if (!hero) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Never run twice in a session unless the visitor asks for it by tapping
  // the brand mark.
  if (!force) {
    try {
      if (sessionStorage.getItem(KEY) === "1") return;
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* private mode: play once for this visit */
    }
  }

  // A replay while one is already running restarts cleanly.
  if (active) active.cancel();

  const veil = document.createElement("div");
  veil.className = "arrival";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = `
    <span class="arrival__warmth"></span>
    <span class="arrival__grain"></span>
    <div class="arrival__lockup">
      ${EMBLEM}
      <span class="arrival__word">KWIIN</span>
      <span class="arrival__rule"></span>
      <span class="arrival__byline">by Pratana Halstrick</span>
    </div>`;
  document.body.appendChild(veil);
  document.documentElement.classList.add("is-arriving");

  const timers = [];
  const at = (ms, fn) => timers.push(window.setTimeout(fn, ms));
  let settled = false;

  // Touch devices fire touchstart/touchmove long before a scroll event, and
  // on iOS a rubber-band drag may produce no scroll event at all. Listening
  // for the intent rather than the result is what makes the skip reliable.
  const SKIP_EVENTS = ["scroll", "wheel", "touchstart", "touchmove", "pointerdown", "keydown", "click"];

  const cleanup = () => {
    timers.forEach(clearTimeout);
    SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip));
    document.documentElement.classList.remove("is-arriving");
    active = null;
  };

  const finish = () => {
    if (settled) return;
    settled = true;
    veil.classList.add("is-done");
    veil.addEventListener("transitionend", () => veil.remove(), { once: true });
    window.setTimeout(() => veil.remove(), 1600);
    cleanup();
  };

  function skip() {
    if (settled) return;
    // Jump straight to the finished state, never a half-lit one.
    veil.classList.add("is-lifting", "is-skipped");
    window.dispatchEvent(new CustomEvent("kwiin:arrival-reveal", { detail: { instant: true } }));
    finish();
  }

  active = { cancel: () => { settled = true; veil.remove(); cleanup(); } };

  SKIP_EVENTS.forEach((type) =>
    window.addEventListener(type, skip, { once: true, passive: true })
  );

  // Phones get a noticeably shorter sequence. On a small screen the lockup
  // reads immediately, and four seconds of held attention that you cannot
  // interact with feels like a stall rather than an arrival.
  const coarse = matchMedia("(hover: none) and (pointer: coarse)").matches;
  const T = coarse
    ? { lift: 1500, reveal: 1700, done: 2700 }
    : { lift: 2350, reveal: 2600, done: 4000 };

  requestAnimationFrame(() => {
    veil.classList.add("is-drawing");                  // emblem gleams, word rises
    at(T.lift, () => veil.classList.add("is-lifting")); // lockup dissolves, light goes up
    at(T.reveal, () => window.dispatchEvent(new CustomEvent("kwiin:arrival-reveal", { detail: { instant: false } })));
    at(T.done, finish);
    // Hard backstop: whatever happens above, the veil is gone by now.
    at(T.done + 2000, () => { veil.remove(); cleanup(); });
  });
}

/**
 * The brand mark still navigates home. On the home page it additionally
 * replays the arrival, and from any other page it navigates home and the
 * sequence plays on landing. Tapping a logo to see the opening again is a
 * thing people genuinely try; here it works.
 */
export function initArrivalReplay() {
  document.querySelectorAll(".brand").forEach((brand) => {
    brand.addEventListener("click", (event) => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

      if (document.body.dataset.page === "home") {
        // Already home: stay put, scroll up, replay.
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.setTimeout(() => playArrival({ force: true }), window.scrollY > 40 ? 420 : 0);
      } else {
        // Elsewhere: let the navigation happen, and ask home to replay.
        try { sessionStorage.setItem(REPLAY_KEY, "1"); } catch { /* ignore */ }
      }
    });
  });
}

export function initArrival() {
  let replayRequested = false;
  try {
    replayRequested = sessionStorage.getItem(REPLAY_KEY) === "1";
    if (replayRequested) sessionStorage.removeItem(REPLAY_KEY);
  } catch { /* ignore */ }

  playArrival({ force: replayRequested });
}
