/**
 * The sen network — KWIIN's material gesture, drawn in Canvas 2D.
 *
 * In Thai medicine the *sen* are the body's energy lines, and Nuad Thai works
 * along them. That is what this figure is: a constellation of sen lines with
 * light travelling down them. It is the one piece of imagery on the site that
 * is about the actual practice rather than about spa-ness, so it stays.
 *
 * This replaces a Three.js implementation that rendered the same figure for
 * 118 KB gzipped. Everything here — the curve data, the palette, the pointer
 * parallax, the travelling signals — is carried over unchanged; only the
 * renderer differs. Glow sprites are pre-rendered once to an offscreen canvas
 * and blitted, so per-frame cost is a handful of drawImage calls rather than
 * hundreds of radial gradients.
 *
 * Budget discipline:
 * - Paused entirely when offscreen (IntersectionObserver) or backgrounded.
 * - 30fps on coarse pointers, 60fps on desktop, DPR capped at 1.5.
 * - Under prefers-reduced-motion it renders exactly one still frame: the
 *   figure is present and composed, it simply does not move.
 */

const LINE_COLOR = [155, 112, 71]; // gold, matches --gold-deep family
const CORE_COLOR = [240, 211, 144]; // --gold-light
const HALO_COLOR = [117, 66, 138]; // plum, the cool half of the palette

// Sen paths and anchor points, in the original scene's coordinate space.
const PATH_DATA = [
  [[0,-3.55],[-.65,-1.4],[-1.25,.75],[-.7,2.25],[0,3.35]],
  [[0,-3.55],[.65,-1.4],[1.25,.75],[.7,2.25],[0,3.35]],
  [[0,-2.95],[-1.45,-1.25],[-2.5,.55],[-1.65,1.85],[0,2.62]],
  [[0,-2.95],[1.45,-1.25],[2.5,.55],[1.65,1.85],[0,2.62]],
  [[-.2,-3.1],[-2.55,-2.15],[-4.25,-.2],[-3.25,.78],[-1.35,1.25]],
  [[.2,-3.1],[2.55,-2.15],[4.25,-.2],[3.25,.78],[1.35,1.25]],
  [[-4.25,-.2],[-3.65,-2.1],[-1.9,-3.35],[0,-3.65]],
  [[4.25,-.2],[3.65,-2.1],[1.9,-3.35],[0,-3.65]],
  [[-4,-2.25],[-2.35,-3.65],[0,-3.88],[2.35,-3.65],[4,-2.25]],
  [[-3.05,-.55],[-2.25,-1.25],[-1.25,-1.72],[0,-1.82],[1.25,-1.72],[2.25,-1.25],[3.05,-.55]],
];

const ANCHORS = [
  [0,3.35],[-.7,2.25],[.7,2.25],[-1.65,1.85],[1.65,1.85],
  [-3.25,.78],[3.25,.78],[-4.25,-.2],[4.25,-.2],[-3.65,-2.1],[3.65,-2.1],
  [-2.35,-3.65],[2.35,-3.65],[0,-3.88],[0,-1.82],[-2.25,-1.25],[2.25,-1.25],
  [-1.25,.75],[1.25,.75],[-1.9,-3.35],[1.9,-3.35],[-3.05,-.55],[3.05,-.55],
];
const MOBILE_HIDDEN = new Set([9, 10, 15, 16, 19, 20]);

/** Centripetal Catmull-Rom, matching the curve the original scene used. */
function sampleCurve(points, steps) {
  const pts = points.map(([x, y]) => ({ x, y }));
  const out = [];
  const get = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];

  for (let seg = 0; seg < pts.length - 1; seg += 1) {
    const p0 = get(seg - 1), p1 = get(seg), p2 = get(seg + 1), p3 = get(seg + 2);
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      // tension 0.45, as in the original
      const a = 0.45;
      out.push({
        x: p1.x + (-a * p0.x + a * p2.x) * t
          + (2 * a * p0.x + (a - 3) * p1.x + (3 - 2 * a) * p2.x - a * p3.x) * t2
          + (-a * p0.x + (2 - a) * p1.x + (a - 2) * p2.x + a * p3.x) * t3,
        y: p1.y + (-a * p0.y + a * p2.y) * t
          + (2 * a * p0.y + (a - 3) * p1.y + (3 - 2 * a) * p2.y - a * p3.y) * t2
          + (-a * p0.y + (2 - a) * p1.y + (a - 2) * p2.y + a * p3.y) * t3,
      });
    }
  }
  out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y });
  return out;
}

/** Pre-render a soft radial glow once; blitting it is far cheaper than gradients per frame. */
function makeGlowSprite(size, core, halo) {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const ctx = sprite.getContext("2d");
  const r = size / 2;
  // Tight core, fast falloff: these must read as points of light on a sen
  // line, not as soft blobs. Matches the original shader's
  // smoothstep(0.5, 0.02) core against a wider, dimmer plum halo.
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, `rgba(${core.join(",")},1)`);
  gradient.addColorStop(0.12, `rgba(${core.join(",")},0.82)`);
  gradient.addColorStop(0.3, `rgba(${core.join(",")},0.28)`);
  gradient.addColorStop(0.55, `rgba(${halo.join(",")},0.12)`);
  gradient.addColorStop(1, `rgba(${halo.join(",")},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

export function initSenNetwork() {
  const canvas = document.querySelector("[data-hero-canvas]");
  const hero = canvas?.closest(".home-hero");
  if (!canvas || !hero) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const coarse = matchMedia("(max-width: 700px)").matches;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const curves = PATH_DATA.map((path) => sampleCurve(path, coarse ? 10 : 16));
  const anchors = ANCHORS.filter((_, i) => !(coarse && MOBILE_HIDDEN.has(i)));
  const glow = makeGlowSprite(64, CORE_COLOR, HALO_COLOR);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let scale = 1;
  let originX = 0;
  let originY = 0;
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };

  // Reveal progress, 0..1. The sen lines draw themselves along their own
  // length during the arrival, so the network appears to switch on rather
  // than fade in. Idle state is 1 (fully drawn); if an arrival is already
  // running we start dark so the lines are never seen complete and then
  // reset when the reveal fires.
  let reveal = document.documentElement.classList.contains("is-arriving") ? 0 : 1;
  let revealFrom = 0;
  let revealStart = 0;
  let revealing = false;

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!width || !height) return;
    // Phones render this figure as soft light over a photograph, where extra
    // buffer resolution buys nothing visible but costs real fill rate. A 15
    // Pro Max reports DPR 3; capping at 1 here quarters the pixels pushed
    // per frame versus 1.2 with no perceptible difference in the result.
    dpr = Math.min(devicePixelRatio || 1, coarse ? 1 : 1.5);
    lineLayerValid = false;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Match the framing the 3D camera produced: offset right on desktop,
    // lower and smaller on mobile.
    if (coarse) {
      scale = Math.min(width / 11.5, height / 15) * 1.05;
      originX = width * 0.5;
      originY = height * 0.62;
    } else {
      scale = Math.min(width / 13, height / 10.5) * 1.12;
      originX = width * 0.68;
      originY = height * 0.47;
    }
  }

  /**
   * Projection without allocation. Returning [x, y] from here meant ~600
   * short-lived arrays every frame, and the resulting garbage collection is
   * what made this stutter on phones. Results land in these two scratch
   * variables instead.
   */
  let projX = 0;
  let projY = 0;
  function project(x, y, withPointer = true) {
    projX = originX + x * scale + (withPointer ? pointer.cx * 14 : 0);
    projY = originY - y * scale + (withPointer ? pointer.cy * 10 : 0);
  }

  /**
   * The sen lines are static geometry — only their opacity breathes and the
   * whole figure drifts with the pointer. Stroking ten round-joined polylines
   * every frame was the real cost, so once the network is fully revealed we
   * stroke it once into an offscreen layer and blit that instead. Breathing
   * becomes a globalAlpha on the blit; parallax becomes a blit offset.
   */
  const lineLayer = document.createElement("canvas");
  const lineCtx = lineLayer.getContext("2d");
  let lineLayerValid = false;

  function strokeCurves(target, upToFraction) {
    target.save();
    target.setTransform(dpr, 0, 0, dpr, 0, 0);
    target.strokeStyle = `rgba(${LINE_COLOR.join(",")},1)`;
    target.lineWidth = Math.max(1, scale * 0.012);
    target.lineCap = "round";
    target.lineJoin = "round";
    for (let c = 0; c < curves.length; c += 1) {
      const curve = curves[c];
      const offset = (c / curves.length) * 0.35;
      const local = Math.max(0, Math.min(1, (upToFraction - offset) / (1 - offset || 1)));
      if (local <= 0) continue;
      const upTo = Math.max(2, Math.round(curve.length * local));
      target.beginPath();
      for (let i = 0; i < upTo; i += 1) {
        project(curve[i].x, curve[i].y, false);
        if (i === 0) target.moveTo(projX, projY); else target.lineTo(projX, projY);
      }
      target.stroke();
    }
    target.restore();
  }

  function buildLineLayer() {
    if (!width || !height) return;
    lineLayer.width = canvas.width;
    lineLayer.height = canvas.height;
    lineCtx.clearRect(0, 0, lineLayer.width, lineLayer.height);
    strokeCurves(lineCtx, 1);
    lineLayerValid = true;
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    // sen lines — a slow collective breath in opacity
    const breath = reducedMotion ? 0.24 : 0.2 + Math.sin(time * 0.45) * 0.045;

    if (reveal >= 1) {
      // Fast path: one blit instead of ~600 path operations.
      if (!lineLayerValid) buildLineLayer();
      ctx.save();
      ctx.globalAlpha = breath;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(lineLayer, pointer.cx * 14 * dpr, pointer.cy * 10 * dpr);
      ctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      // Only while the network is drawing itself in, ~2 seconds.
      ctx.save();
      ctx.globalAlpha = breath;
      strokeCurves(ctx, reveal);
      ctx.restore();
    }

    // anchor stars
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < anchors.length; i += 1) {
      // Anchors ignite in sequence as the reveal passes over them.
      const ignite = Math.max(0, Math.min(1, (reveal - (i / anchors.length) * 0.55) * 3));
      if (ignite <= 0) continue;
      const pulse = reducedMotion ? 0.85 : 0.72 + 0.28 * Math.sin(time * 1.35 + i * 0.83);
      const base = (i % 5 === 0 ? 20 : 12 + (i % 3) * 3) * (scale / 46);
      const size = base * pulse * (0.6 + 0.4 * ignite);
      project(anchors[i][0], anchors[i][1]);
      ctx.globalAlpha = Math.min(1, pulse * 0.9 * ignite);
      ctx.drawImage(glow, projX - size / 2, projY - size / 2, size, size);
    }

    // travelling signals: light moving along the sen lines
    const signalCount = reveal < 0.98 ? 0 : (coarse ? 3 : 7);
    for (let i = 0; i < signalCount; i += 1) {
      const curve = curves[(i * 3 + Math.floor(time * 0.08)) % curves.length];
      const progress = ((time * (0.075 + i * 0.004) + i * 0.19) % 1 + 1) % 1;
      const point = curve[Math.floor(progress * (curve.length - 1))];
      if (!point) continue;
      project(point.x, point.y);
      const size = (coarse ? 15 : 18) * (scale / 46) * 1.15;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(glow, projX - size / 2, projY - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  let running = false;
  let visible = true;
  let frame = 0;
  let previous = 0;
  const start = performance.now();

  /**
   * Adaptive quality.
   *
   * The brief's floor is 60fps on a mid-range Android, and the honest rule
   * when a technique cannot hold that is to simplify rather than ship it
   * stuttering. So we watch our own frame cost: if the device is struggling
   * we first halve the rate, and if it is still struggling we settle the
   * figure into a still frame. A composed still image reads as intentional;
   * judder reads as cheap.
   */
  let budget = coarse ? 1000 / 24 : 1000 / 60;
  let slowFrames = 0;
  let degraded = 0;
  let lastFrameAt = 0;

  function watchdog(now) {
    if (!lastFrameAt) { lastFrameAt = now; return; }
    const delta = now - lastFrameAt;
    lastFrameAt = now;
    if (delta > budget * 2.2) slowFrames += 1; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 24 && degraded === 0) {
      degraded = 1;
      budget = coarse ? 1000 / 12 : 1000 / 30;   // halve the rate first
      slowFrames = 0;
    } else if (slowFrames > 24 && degraded === 1) {
      degraded = 2;                               // settle into a still frame
      running = false;
      cancelAnimationFrame(frame);
      draw((performance.now() - start) / 1000);
    }
  }

  function loop(now) {
    if (!running) return;
    watchdog(now);
    const interval = budget;
    if (now - previous >= interval) {
      pointer.cx += (pointer.x - pointer.cx) * 0.045;
      pointer.cy += (pointer.y - pointer.cy) * 0.045;
      if (revealing) {
        const t = Math.min(1, (now - revealStart) / 1900);
        reveal = revealFrom + (1 - revealFrom) * (1 - Math.pow(1 - t, 3));
        if (t >= 1) { reveal = 1; revealing = false; }
      }
      draw((now - start) / 1000);
      previous = now - ((now - previous) % interval);
    }
    frame = requestAnimationFrame(loop);
  }

  /** Draw the network in from nothing. Called by the arrival sequence. */
  function playReveal(instant) {
    lineLayerValid = false;
    if (reducedMotion || instant) { reveal = 1; revealing = false; draw((performance.now() - start) / 1000); return; }
    reveal = 0;
    revealFrom = 0;
    revealStart = performance.now();
    revealing = true;
    sync();
  }
  window.addEventListener("kwiin:arrival-reveal", (event) => playReveal(event.detail?.instant));

  function sync() {
    if (reducedMotion) return; // one still frame only, already drawn
    const should = visible && !document.hidden;
    if (should && !running) {
      running = true;
      previous = performance.now();
      frame = requestAnimationFrame(loop);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { rootMargin: "150px" });
  io.observe(hero);

  const ro = new ResizeObserver(() => {
    resize();
    if (reducedMotion || !running) draw((performance.now() - start) / 1000);
  });
  ro.observe(hero);

  if (!reducedMotion) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
  }
  document.addEventListener("visibilitychange", sync);

  resize();
  draw(0);
  sync();

  window.addEventListener("pagehide", () => {
    running = false;
    cancelAnimationFrame(frame);
    io.disconnect();
    ro.disconnect();
  }, { once: true });
}
