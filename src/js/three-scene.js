import * as THREE from "three";

const vertexShader = `
  attribute float aSize;
  attribute float aPhase;
  varying float vAlpha;
  uniform float uTime;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pulse = 0.72 + 0.28 * sin(uTime * 1.35 + aPhase);
    vAlpha = pulse;
    gl_PointSize = aSize * pulse * (22.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(center);
    float core = smoothstep(0.5, 0.02, distanceToCenter);
    float halo = smoothstep(0.5, 0.17, distanceToCenter) * 0.45;
    vec3 color = mix(vec3(0.46, 0.26, 0.54), vec3(0.94, 0.72, 0.31), core);
    gl_FragColor = vec4(color, (core + halo) * vAlpha);
  }
`;

function createNetwork(isMobile) {
  const vector = ([x, y, z = 0]) => new THREE.Vector3(x, y, z);
  const pathData = [
    [[0,-3.55,-.3],[-.65,-1.4,0],[-1.25,.75,-.25],[-.7,2.25,0],[0,3.35,.15]],
    [[0,-3.55,-.3],[.65,-1.4,0],[1.25,.75,-.25],[.7,2.25,0],[0,3.35,.15]],
    [[0,-2.95,.1],[-1.45,-1.25,-.2],[-2.5,.55,.05],[-1.65,1.85,-.15],[0,2.62,.05]],
    [[0,-2.95,.1],[1.45,-1.25,-.2],[2.5,.55,.05],[1.65,1.85,-.15],[0,2.62,.05]],
    [[-.2,-3.1,-.15],[-2.55,-2.15,.1],[-4.25,-.2,-.25],[-3.25,.78,0],[-1.35,1.25,-.1]],
    [[.2,-3.1,-.15],[2.55,-2.15,.1],[4.25,-.2,-.25],[3.25,.78,0],[1.35,1.25,-.1]],
    [[-4.25,-.2,-.2],[-3.65,-2.1,0],[-1.9,-3.35,-.15],[0,-3.65,.05]],
    [[4.25,-.2,-.2],[3.65,-2.1,0],[1.9,-3.35,-.15],[0,-3.65,.05]],
    [[-4.0,-2.25,-.3],[-2.35,-3.65,.05],[0,-3.88,-.1],[2.35,-3.65,.05],[4.0,-2.25,-.3]],
    [[-3.05,-.55,-.25],[-2.25,-1.25,.05],[-1.25,-1.72,-.15],[0,-1.82,.05],[1.25,-1.72,-.15],[2.25,-1.25,.05],[3.05,-.55,-.25]],
  ];
  const curves = pathData.map((path) => new THREE.CatmullRomCurve3(path.map(vector), false, "centripetal", 0.45));

  const anchors = [
    [0,3.35,.15],[-.7,2.25,0],[.7,2.25,0],[-1.65,1.85,-.15],[1.65,1.85,-.15],
    [-3.25,.78,0],[3.25,.78,0],[-4.25,-.2,-.25],[4.25,-.2,-.25],[-3.65,-2.1,0],[3.65,-2.1,0],
    [-2.35,-3.65,.05],[2.35,-3.65,.05],[0,-3.88,-.1],[0,-1.82,.05],[-2.25,-1.25,.05],[2.25,-1.25,.05],
    [-1.25,.75,-.25],[1.25,.75,-.25],[-1.9,-3.35,-.15],[1.9,-3.35,-.15],[-3.05,-.55,-.25],[3.05,-.55,-.25],
  ];
  const visibleAnchors = isMobile ? anchors.filter((_, index) => ![9,10,15,16,19,20].includes(index)) : anchors;
  const points = visibleAnchors.map(vector);

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flatMap((point) => point.toArray()), 3));
  pointGeometry.setAttribute("aSize", new THREE.Float32BufferAttribute(points.map((_, index) => index % 5 === 0 ? 16 : 9 + (index % 3) * 2), 1));
  pointGeometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(points.map((_, index) => index * 0.83), 1));
  const starMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
  });
  const stars = new THREE.Points(pointGeometry, starMaterial);

  const linePositions = [];
  const lineSteps = isMobile ? 22 : 36;
  curves.forEach((curve) => {
    const samples = curve.getPoints(lineSteps);
    for (let index = 0; index < samples.length - 1; index += 1) {
      linePositions.push(...samples[index].toArray(), ...samples[index + 1].toArray());
    }
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x9b7047, transparent: true, opacity: 0.28, depthWrite: false });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);

  const signalCount = isMobile ? 3 : 7;
  const signalPositions = new Float32Array(signalCount * 3);
  const signalGeometry = new THREE.BufferGeometry();
  signalGeometry.setAttribute("position", new THREE.BufferAttribute(signalPositions, 3));
  signalGeometry.setAttribute("aSize", new THREE.Float32BufferAttribute(new Array(signalCount).fill(isMobile ? 13 : 15), 1));
  signalGeometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(new Array(signalCount).fill(0).map((_, index) => index), 1));
  const signals = new THREE.Points(signalGeometry, starMaterial.clone());

  return { curves, stars, lines, signals, starMaterial, lineMaterial };
}

export function initThreeScene() {
  const canvas = document.querySelector("[data-hero-canvas]");
  const hero = canvas?.closest(".home-hero");
  if (!canvas || !hero) return;

  const isMobile = matchMedia("(max-width: 700px)").matches;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.2 : 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isMobile ? 53 : 47, 1, 0.1, 100);
  camera.position.z = isMobile ? 11.5 : 10;
  const network = createNetwork(isMobile);
  const group = new THREE.Group();
  group.add(network.lines, network.stars, network.signals);
  if (isMobile) {
    group.scale.set(0.49, 0.67, 0.55);
    group.position.set(0, -1.7, 0);
  } else {
    group.scale.setScalar(0.88);
    group.position.set(2.45, -0.35, 0);
  }
  scene.add(group);

  let active = true;
  let running = false;
  let frame = 0;
  let previous = 0;
  const clock = new THREE.Clock();
  const pointer = { x: 0, y: 0 };

  function resize() {
    const { width, height } = hero.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function updateSignals(time) {
    const positions = network.signals.geometry.attributes.position.array;
    const target = new THREE.Vector3();
    for (let index = 0; index < positions.length / 3; index += 1) {
      const curve = network.curves[(index * 3 + Math.floor(time * 0.08)) % network.curves.length];
      const progress = (time * (0.075 + index * 0.004) + index * 0.19) % 1;
      curve.getPointAt(progress, target);
      positions[index * 3] = target.x;
      positions[index * 3 + 1] = target.y;
      positions[index * 3 + 2] = target.z;
    }
    network.signals.geometry.attributes.position.needsUpdate = true;
  }

  function render(now = 0) {
    if (!running) return;
    const interval = isMobile ? 1000 / 30 : 1000 / 60;
    if (now - previous >= interval || reducedMotion) {
      const time = clock.getElapsedTime();
      network.starMaterial.uniforms.uTime.value = time;
      network.signals.material.uniforms.uTime.value = time + 1.2;
      network.lineMaterial.opacity = 0.18 + Math.sin(time * 0.45) * 0.035;
      updateSignals(time);
      if (!reducedMotion) {
        group.rotation.z = Math.sin(time * 0.08) * 0.018;
        group.rotation.y += (pointer.x * 0.045 - group.rotation.y) * 0.025;
        group.rotation.x += (-pointer.y * 0.03 - group.rotation.x) * 0.025;
      }
      renderer.render(scene, camera);
      previous = now - ((now - previous) % interval);
    }
    if (!reducedMotion && running) frame = requestAnimationFrame(render);
  }

  function syncPlayback() {
    const shouldRun = active && !document.hidden;
    if (reducedMotion) {
      running = true;
      render();
      running = false;
      return;
    }
    if (shouldRun && !running) {
      running = true;
      frame = requestAnimationFrame(render);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    syncPlayback();
  }, { rootMargin: "150px" });
  observer.observe(hero);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }, { passive: true });
  document.addEventListener("visibilitychange", syncPlayback);

  resize();
  syncPlayback();

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    network.stars.geometry.dispose();
    network.lines.geometry.dispose();
    network.signals.geometry.dispose();
    network.starMaterial.dispose();
    network.lineMaterial.dispose();
    network.signals.material.dispose();
    renderer.dispose();
  }, { once: true });
}
