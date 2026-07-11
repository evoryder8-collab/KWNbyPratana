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
  const anchors = [
    [-4.8, 2.2, -1.1], [-3.9, 3.3, -0.4], [-2.7, 2.45, 0], [-1.5, 3.55, -0.8],
    [-0.3, 2.55, 0.2], [1.1, 3.45, -0.5], [2.4, 2.35, 0.1], [3.8, 3.15, -0.7], [4.9, 2.0, -1.2],
    [-4.3, 0.5, -0.3], [-2.9, 0.9, -0.9], [-1.5, 0.35, 0.2], [0, 1.3, -1.1], [1.6, 0.25, 0.15], [3.0, 0.85, -0.8], [4.4, 0.4, -0.3],
    [-4.8, -1.45, -1], [-3.2, -0.85, 0.1], [-1.8, -1.75, -0.7], [0, -0.8, 0.25], [1.9, -1.8, -0.6], [3.3, -0.85, 0.15], [4.9, -1.55, -1],
    [-3.8, -3.0, -0.6], [-2.0, -2.55, 0], [0, -3.25, -0.8], [2.1, -2.5, 0], [3.9, -3.05, -0.7],
  ];
  const points = isMobile ? anchors.filter((_, index) => index % 2 === 0 || index === 12 || index === 19) : anchors;
  const connections = isMobile
    ? [[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[10,11],[11,12],[12,13]]
    : [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,2],[10,11],[11,4],[4,12],[12,6],[6,14],[14,15],[15,8],[9,16],[16,17],[17,11],[11,18],[18,19],[19,13],[13,20],[20,21],[21,15],[15,22],[16,23],[23,24],[24,18],[18,25],[25,20],[20,26],[26,27],[27,22],[23,25],[25,27]];

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
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
  connections.forEach(([a, b]) => {
    if (!points[a] || !points[b]) return;
    linePositions.push(...points[a], ...points[b]);
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x9b7047, transparent: true, opacity: 0.22 });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);

  const signalCount = isMobile ? 3 : 7;
  const signalPositions = new Float32Array(signalCount * 3);
  const signalGeometry = new THREE.BufferGeometry();
  signalGeometry.setAttribute("position", new THREE.BufferAttribute(signalPositions, 3));
  signalGeometry.setAttribute("aSize", new THREE.Float32BufferAttribute(new Array(signalCount).fill(isMobile ? 13 : 15), 1));
  signalGeometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(new Array(signalCount).fill(0).map((_, index) => index), 1));
  const signals = new THREE.Points(signalGeometry, starMaterial.clone());

  return { points, connections: connections.filter(([a, b]) => points[a] && points[b]), stars, lines, signals, starMaterial, lineMaterial };
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
    for (let index = 0; index < positions.length / 3; index += 1) {
      const connection = network.connections[(index * 5 + Math.floor(time * 0.12)) % network.connections.length];
      if (!connection) continue;
      const [a, b] = connection;
      const start = network.points[a];
      const end = network.points[b];
      const progress = (time * (0.1 + index * 0.006) + index * 0.17) % 1;
      const smooth = progress * progress * (3 - 2 * progress);
      positions[index * 3] = THREE.MathUtils.lerp(start[0], end[0], smooth);
      positions[index * 3 + 1] = THREE.MathUtils.lerp(start[1], end[1], smooth);
      positions[index * 3 + 2] = THREE.MathUtils.lerp(start[2], end[2], smooth);
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
