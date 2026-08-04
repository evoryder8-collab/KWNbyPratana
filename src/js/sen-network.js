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

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!width || !height) return;
    dpr = Math.min(devicePixelRatio || 1, coarse ? 1.2 : 1.5);
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

  const project = (x, y) => [originX + x * scale + pointer.cx * 14, originY - y * scale + pointer.cy * 10];

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    // sen lines — a slow collective breath in opacity
    const breath = reducedMotion ? 0.24 : 0.2 + Math.sin(time * 0.45) * 0.045;
    ctx.strokeStyle = `rgba(${LINE_COLOR.join(",")},${breath.toFixed(3)})`;
    ctx.lineWidth = Math.max(1, scale * 0.012);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const curve of curves) {
      ctx.beginPath();
      for (let i = 0; i < curve.length; i += 1) {
        const [px, py] = project(curve[i].x, curve[i].y);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // anchor stars
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < anchors.length; i += 1) {
      const pulse = reducedMotion ? 0.85 : 0.72 + 0.28 * Math.sin(time * 1.35 + i * 0.83);
      const base = (i % 5 === 0 ? 20 : 12 + (i % 3) * 3) * (scale / 46);
      const size = base * pulse;
      const [px, py] = project(anchors[i][0], anchors[i][1]);
      ctx.globalAlpha = Math.min(1, pulse * 0.9);
      ctx.drawImage(glow, px - size / 2, py - size / 2, size, size);
    }

    // travelling signals: light moving along the sen lines
    const signalCount = coarse ? 3 : 7;
    for (let i = 0; i < signalCount; i += 1) {
      const curve = curves[(i * 3 + Math.floor(time * 0.08)) % curves.length];
      const progress = ((time * (0.075 + i * 0.004) + i * 0.19) % 1 + 1) % 1;
      const point = curve[Math.floor(progress * (curve.length - 1))];
      if (!point) continue;
      const [px, py] = project(point.x, point.y);
      const size = (coarse ? 15 : 18) * (scale / 46) * 1.15;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(glow, px - size / 2, py - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  let running = false;
  let visible = true;
  let frame = 0;
  let previous = 0;
  const start = performance.now();

  function loop(now) {
    if (!running) return;
    const interval = coarse ? 1000 / 30 : 1000 / 60;
    if (now - previous >= interval) {
      pointer.cx += (pointer.x - pointer.cx) * 0.045;
      pointer.cy += (pointer.y - pointer.cy) * 0.045;
      draw((now - start) / 1000);
      previous = now - ((now - previous) % interval);
    }
    frame = requestAnimationFrame(loop);
  }

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
