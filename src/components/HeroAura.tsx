/**
 * HeroAura — KWIIN's living night-sky.
 *
 * A full-screen GLSL silk aura sits behind a connected 3D constellation.
 * Anchor stars form a deliberate graph around Pratana's portrait, faint
 * secondary stars add depth, and luminous signals continuously travel along
 * several routes through the network. The whole field breathes and responds
 * to the pointer with restrained parallax.
 *
 * Performance & accessibility:
 * - Mounted with client:visible so WebGL starts only when the hero is visible.
 * - One WebGL canvas contains both the aura and constellation.
 * - Reduced-motion mode keeps the constellation visible but freezes motion.
 * - A static layered gradient remains the non-WebGL fallback.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const auraVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const auraFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColorBlack;
  uniform vec3 uColorCharcoal;
  uniform vec3 uColorGold;
  uniform vec3 uColorPurple;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspectUv = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

    float verticalMix = smoothstep(0.0, 1.0, uv.y);
    vec3 base = mix(uColorCharcoal * 0.58, uColorBlack, verticalMix);

    vec2 mouseOffset = clamp(uMouse, vec2(-1.0), vec2(1.0)) * 0.18;
    vec2 toCenter = aspectUv - mouseOffset;
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);
    float breathe = 0.5 + 0.5 * sin(uTime * 0.35);

    float petals = 0.5 + 0.5 * cos(angle * 5.0 + uTime * 0.08);
    float lotus = smoothstep(0.88, 0.0, dist + petals * 0.06);
    lotus *= 0.42 + 0.34 * breathe;

    float wisp = noise(aspectUv * 2.2 + vec2(uTime * 0.04, -uTime * 0.03));
    wisp = smoothstep(0.55, 0.95, wisp);

    vec3 color = base;
    color += uColorGold * lotus;
    color += uColorPurple * wisp * 0.21;

    float vignette = smoothstep(1.08, 0.22, length(aspectUv));
    color = mix(uColorBlack, color, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aStrength;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vStrength;

  void main() {
    vColor = color;
    float shimmer = 0.76 + 0.24 * sin(uTime * 1.15 + aPhase);
    vStrength = aStrength * shimmer;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (5.0 / max(2.8, -mvPosition.z));
  }
`;

const starFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vStrength;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float radius = length(p);
    float core = smoothstep(0.24, 0.0, radius);
    float halo = smoothstep(0.5, 0.05, radius) * 0.32;
    float rayX = smoothstep(0.065, 0.0, abs(p.x)) * smoothstep(0.5, 0.04, abs(p.y));
    float rayY = smoothstep(0.065, 0.0, abs(p.y)) * smoothstep(0.5, 0.04, abs(p.x));
    float rays = (rayX + rayY) * 0.55;
    float alpha = min(1.0, (core + halo + rays) * vStrength);

    if (alpha < 0.015) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const signalVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;

  uniform float uPixelRatio;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vAlpha = aAlpha;
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (5.0 / max(2.8, -mvPosition.z));
  }
`;

const signalFragmentShader = /* glsl */ `
  precision highp float;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float radius = length(p);
    float core = smoothstep(0.18, 0.0, radius);
    float glow = smoothstep(0.5, 0.0, radius) * 0.72;
    float alpha = (core + glow) * vAlpha;

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

type NodeDefinition = readonly [
  x: number,
  y: number,
  z: number,
  size: number,
  strength: number,
];

/**
 * The network loosely echoes a protective crown / lotus around the portrait.
 * Coordinates are normalized around the center of the hero.
 */
const CONSTELLATION_NODES: readonly NodeDefinition[] = [
  [-0.47, 0.28, -0.05, 8.4, 0.68],
  [-0.38, 0.18, 0.02, 6.5, 0.62],
  [-0.29, 0.32, 0.08, 10.5, 0.9],
  [-0.18, 0.21, 0.12, 7.4, 0.7],
  [-0.06, 0.35, 0.04, 11.5, 0.92],
  [0.07, 0.25, 0.1, 7.2, 0.72],
  [0.2, 0.35, 0.02, 10.8, 0.9],
  [0.33, 0.2, 0.08, 7.5, 0.68],
  [0.46, 0.29, -0.04, 9.4, 0.76],
  [-0.44, 0.02, 0.01, 6.2, 0.55],
  [-0.31, 0.08, 0.1, 9.8, 0.82],
  [-0.2, -0.03, 0.04, 6.6, 0.62],
  [-0.08, 0.09, 0.14, 8.8, 0.76],
  [0.04, -0.02, 0.12, 7.2, 0.66],
  [0.17, 0.1, 0.15, 9.8, 0.84],
  [0.3, 0.02, 0.06, 6.8, 0.64],
  [0.43, 0.08, 0.0, 8.6, 0.72],
  [-0.37, -0.2, -0.03, 8.8, 0.72],
  [-0.24, -0.15, 0.09, 6.7, 0.62],
  [-0.12, -0.25, 0.04, 9.8, 0.82],
  [0.01, -0.13, 0.16, 7.2, 0.68],
  [0.15, -0.25, 0.08, 9.6, 0.8],
  [0.29, -0.15, 0.11, 6.7, 0.62],
  [0.42, -0.22, -0.02, 9.2, 0.75],
  [-0.25, -0.36, -0.04, 7.6, 0.67],
  [-0.04, -0.33, 0.08, 11.2, 0.9],
  [0.2, -0.36, -0.03, 8.4, 0.7],
] as const;

const CONSTELLATION_EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [1, 2], [1, 9], [2, 3], [3, 4], [3, 10],
  [4, 5], [5, 6], [5, 12], [6, 7], [7, 8], [7, 15],
  [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  [14, 15], [15, 16], [9, 17], [17, 18], [18, 11],
  [18, 19], [19, 20], [20, 13], [20, 21], [21, 22],
  [22, 15], [22, 23], [19, 24], [24, 25], [25, 20],
  [25, 26], [26, 22], [10, 3], [14, 5],
] as const;

const SIGNAL_ROUTES: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23],
  [2, 1, 10, 11, 18, 19, 24],
  [6, 5, 12, 13, 20, 21, 26],
  [17, 9, 10, 3, 4, 5, 14, 15, 23],
] as const;

const SIGNAL_SPEEDS = [0.034, 0.028, 0.032, 0.025, 0.03, 0.022] as const;
const SIGNAL_OFFSETS = [0.02, 0.38, 0.71, 0.19, 0.57, 0.84] as const;
const TRAIL_LENGTH = 4;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function AuraPlane({ reduced }: { reduced: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector2(0, 0));
  const { viewport, size, invalidate } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorBlack: { value: new THREE.Color("#0b0908") },
      uColorCharcoal: { value: new THREE.Color("#1b1613") },
      uColorGold: { value: new THREE.Color("#c9a35c") },
      uColorPurple: { value: new THREE.Color("#7c5ea3") },
    }),
    []
  );

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    if (reduced) invalidate();
  }, [size, reduced, invalidate]);

  useFrame((state, delta) => {
    if (!materialRef.current || reduced) return;

    materialRef.current.uniforms.uTime.value += delta;
    target.current.set(state.pointer.x, state.pointer.y);
    mouse.current.lerp(target.current, 0.04);
    materialRef.current.uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <mesh position={[0, 0, -0.5]} scale={[viewport.width, viewport.height, 1]} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={auraVertexShader}
        fragmentShader={auraFragmentShader}
        depthWrite={false}
      />
    </mesh>
  );
}

function toScenePosition(
  node: NodeDefinition,
  width: number,
  height: number
): THREE.Vector3 {
  const portraitBias = width < height * 0.72 ? 0.96 : 0.88;
  return new THREE.Vector3(
    node[0] * width * 0.98,
    node[1] * height * portraitBias,
    node[2]
  );
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

interface StarCloudData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
  strengths: Float32Array;
}

function buildDeepStarCloud(width: number, height: number): StarCloudData {
  const random = createSeededRandom(24111989);
  const count = width < height * 0.72 ? 64 : 88;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const strengths = new Float32Array(count);

  const gold = new THREE.Color("#ecd29b");
  const ivory = new THREE.Color("#fff6df");
  const violet = new THREE.Color("#b99ad8");

  for (let index = 0; index < count; index += 1) {
    const x = (random() - 0.5) * width * 0.98;
    const y = (random() - 0.5) * height * 0.88;
    const z = -0.32 + random() * 0.18;
    const colorChoice = random();
    const color = colorChoice > 0.82 ? violet : colorChoice > 0.48 ? ivory : gold;
    const offset = index * 3;

    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
    sizes[index] = 2.2 + random() * 3.8;
    phases[index] = random() * Math.PI * 2;
    strengths[index] = 0.22 + random() * 0.44;
  }

  return { positions, colors, sizes, phases, strengths };
}

function StarCloud({
  data,
  reduced,
}: {
  data: StarCloudData;
  reduced: boolean;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl, invalidate } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 1.35 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.75) },
    }),
    [gl]
  );

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.75);
    if (reduced) invalidate();
  }, [gl, invalidate, reduced, uniforms]);

  useFrame((state) => {
    if (!materialRef.current || reduced) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
        <bufferAttribute attach="attributes-aStrength" args={[data.strengths, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function buildAnchorStarCloud(nodes: readonly THREE.Vector3[]): StarCloudData {
  const count = nodes.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const strengths = new Float32Array(count);
  const warm = new THREE.Color("#ffecc1");
  const cool = new THREE.Color("#c8a9e2");

  nodes.forEach((point, index) => {
    const offset = index * 3;
    const mix = (CONSTELLATION_NODES[index][0] + 0.5) * 0.78;
    const color = warm.clone().lerp(cool, Math.max(0, Math.min(1, mix)));

    positions[offset] = point.x;
    positions[offset + 1] = point.y;
    positions[offset + 2] = point.z;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
    sizes[index] = CONSTELLATION_NODES[index][3];
    phases[index] = index * 1.793;
    strengths[index] = CONSTELLATION_NODES[index][4];
  });

  return { positions, colors, sizes, phases, strengths };
}

function ConstellationLines({ nodes }: { nodes: readonly THREE.Vector3[] }) {
  const { positions, colors } = useMemo(() => {
    const linePositions = new Float32Array(CONSTELLATION_EDGES.length * 6);
    const lineColors = new Float32Array(CONSTELLATION_EDGES.length * 6);
    const gold = new THREE.Color("#d8b978");
    const ivory = new THREE.Color("#f7ead0");
    const violet = new THREE.Color("#aa83cf");

    CONSTELLATION_EDGES.forEach(([fromIndex, toIndex], edgeIndex) => {
      const from = nodes[fromIndex];
      const to = nodes[toIndex];
      const offset = edgeIndex * 6;
      const fromMix = (CONSTELLATION_NODES[fromIndex][0] + 0.5);
      const toMix = (CONSTELLATION_NODES[toIndex][0] + 0.5);
      const fromColor = fromMix < 0.47
        ? gold.clone().lerp(ivory, fromMix * 1.4)
        : ivory.clone().lerp(violet, (fromMix - 0.47) * 1.65);
      const toColor = toMix < 0.47
        ? gold.clone().lerp(ivory, toMix * 1.4)
        : ivory.clone().lerp(violet, (toMix - 0.47) * 1.65);

      linePositions.set([from.x, from.y, from.z, to.x, to.y, to.z], offset);
      lineColors.set(
        [fromColor.r, fromColor.g, fromColor.b, toColor.r, toColor.g, toColor.b],
        offset
      );
    });

    return { positions: linePositions, colors: lineColors };
  }, [nodes]);

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.23}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

interface RouteData {
  points: readonly THREE.Vector3[];
  lengths: readonly number[];
  total: number;
}

function sampleRoute(route: RouteData, progress: number, target: THREE.Vector3) {
  const wrapped = ((progress % 1) + 1) % 1;
  let remaining = wrapped * route.total;

  for (let index = 0; index < route.lengths.length; index += 1) {
    const length = route.lengths[index];
    if (remaining <= length || index === route.lengths.length - 1) {
      const amount = length === 0 ? 0 : remaining / length;
      target.lerpVectors(route.points[index], route.points[index + 1], amount);
      return;
    }
    remaining -= length;
  }
}

function SignalNetwork({
  nodes,
  reduced,
}: {
  nodes: readonly THREE.Vector3[];
  reduced: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const { gl, invalidate } = useThree();
  const scratch = useMemo(() => new THREE.Vector3(), []);

  const routeData = useMemo<RouteData[]>(
    () =>
      SIGNAL_ROUTES.map((route) => {
        const points = route.map((nodeIndex) => nodes[nodeIndex]);
        const lengths = points.slice(0, -1).map((point, index) =>
          point.distanceTo(points[index + 1])
        );
        return {
          points,
          lengths,
          total: lengths.reduce((sum, length) => sum + length, 0),
        };
      }),
    [nodes]
  );

  const count = SIGNAL_ROUTES.length * TRAIL_LENGTH;
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const sizes = useMemo(() => {
    const values = new Float32Array(count);
    for (let signal = 0; signal < SIGNAL_ROUTES.length; signal += 1) {
      for (let trail = 0; trail < TRAIL_LENGTH; trail += 1) {
        values[signal * TRAIL_LENGTH + trail] = [11, 7.2, 4.8, 3][trail];
      }
    }
    return values;
  }, [count]);
  const alphas = useMemo(() => {
    const values = new Float32Array(count);
    for (let signal = 0; signal < SIGNAL_ROUTES.length; signal += 1) {
      for (let trail = 0; trail < TRAIL_LENGTH; trail += 1) {
        values[signal * TRAIL_LENGTH + trail] = [1, 0.56, 0.27, 0.1][trail];
      }
    }
    return values;
  }, [count]);
  const colors = useMemo(() => {
    const values = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#fff4d2"),
      new THREE.Color("#e9c982"),
      new THREE.Color("#d8b2f2"),
    ];

    for (let signal = 0; signal < SIGNAL_ROUTES.length; signal += 1) {
      const color = palette[signal % palette.length];
      for (let trail = 0; trail < TRAIL_LENGTH; trail += 1) {
        const offset = (signal * TRAIL_LENGTH + trail) * 3;
        values[offset] = color.r;
        values[offset + 1] = color.g;
        values[offset + 2] = color.b;
      }
    }
    return values;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.75) },
    }),
    [gl]
  );

  function updateSignals(time: number) {
    routeData.forEach((route, signalIndex) => {
      const head =
        SIGNAL_OFFSETS[signalIndex] + time * SIGNAL_SPEEDS[signalIndex];

      for (let trailIndex = 0; trailIndex < TRAIL_LENGTH; trailIndex += 1) {
        const progress = head - trailIndex * 0.0125;
        sampleRoute(route, progress, scratch);
        const offset = (signalIndex * TRAIL_LENGTH + trailIndex) * 3;
        positions[offset] = scratch.x;
        positions[offset + 1] = scratch.y;
        positions[offset + 2] = scratch.z + 0.1 + trailIndex * 0.004;
      }
    });

    const attribute = pointsRef.current?.geometry.getAttribute("position");
    if (attribute) attribute.needsUpdate = true;
  }

  useEffect(() => {
    updateSignals(reduced ? 19 : 0);
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.75);
    invalidate();
  }, [gl, invalidate, reduced, routeData, uniforms]);

  useFrame((state) => {
    if (reduced) return;
    updateSignals(state.clock.elapsedTime);
  });

  return (
    <points ref={pointsRef} frustumCulled={false} renderOrder={12}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={signalVertexShader}
        fragmentShader={signalFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function LivingConstellation({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const nodes = useMemo(
    () =>
      CONSTELLATION_NODES.map((node) =>
        toScenePosition(node, viewport.width, viewport.height)
      ),
    [viewport.width, viewport.height]
  );
  const anchorStars = useMemo(() => buildAnchorStarCloud(nodes), [nodes]);
  const deepStars = useMemo(
    () => buildDeepStarCloud(viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );

  useFrame((state, delta) => {
    if (!groupRef.current || reduced) return;

    const targetX = state.pointer.x * viewport.width * 0.018;
    const targetY =
      state.pointer.y * viewport.height * 0.012 +
      Math.sin(state.clock.elapsedTime * 0.17) * 0.018;
    const amount = 1 - Math.pow(0.001, delta);

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      amount * 0.22
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      amount * 0.22
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      state.pointer.x * 0.006,
      amount * 0.18
    );
  });

  return (
    <group ref={groupRef} position={[0, -viewport.height * 0.005, 0.08]}>
      <StarCloud data={deepStars} reduced={reduced} />
      <ConstellationLines nodes={nodes} />
      <StarCloud data={anchorStars} reduced={reduced} />
      <SignalNetwork nodes={nodes} reduced={reduced} />
    </group>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const FALLBACK_GRADIENT = [
  "radial-gradient(circle at 18% 34%, rgba(255,239,200,.72) 0 1px, transparent 2px)",
  "radial-gradient(circle at 31% 27%, rgba(236,210,155,.6) 0 1px, transparent 2px)",
  "radial-gradient(circle at 72% 31%, rgba(207,177,231,.58) 0 1px, transparent 2px)",
  "radial-gradient(circle at 84% 48%, rgba(255,242,211,.64) 0 1px, transparent 2px)",
  "radial-gradient(circle at 50% 38%, rgba(201,168,106,.24), transparent 60%)",
  "radial-gradient(circle at 70% 70%, rgba(110,79,140,.16), transparent 55%)",
  "linear-gradient(180deg, #0a0908 0%, #1c1a18 100%)",
].join(", ");

export default function HeroAura() {
  const reduced = usePrefersReducedMotion();
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWebglOk(supportsWebGL());
  }, []);

  if (webglOk === false) {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: FALLBACK_GRADIENT }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ background: FALLBACK_GRADIENT, opacity: mounted ? 0 : 1 }}
      />
      {webglOk && (
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          <Canvas
            frameloop={reduced ? "demand" : "always"}
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "low-power",
            }}
            onCreated={() => setMounted(true)}
          >
            <AuraPlane reduced={reduced} />
            <LivingConstellation reduced={reduced} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
