/**
 * HeroAura — the "KWIIN Aura Shader".
 *
 * A single full-screen plane rendered with a custom GLSL shader: black silk
 * gradients, a warm gold light, faint purple energy wisps, and a slow
 * "breathing" lotus-shaped aura that softly follows the cursor.
 *
 * Performance & accessibility:
 * - Meant to be mounted with `client:visible` so it only hydrates once the
 *   hero is actually on screen.
 * - Respects `prefers-reduced-motion`: animation freezes and the render
 *   loop switches to "demand" (renders one frame, then stops).
 * - Falls back to a static CSS gradient if WebGL isn't available, so the
 *   hero never breaks or shows a blank box.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColorBlack;
  uniform vec3 uColorCharcoal;
  uniform vec3 uColorGold;
  uniform vec3 uColorPurple;

  varying vec2 vUv;

  // cheap hash-based noise — enough for soft energy wisps, no texture lookups
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

    // base silk gradient: charcoal pooling toward the bottom, black above
    float verticalMix = smoothstep(0.0, 1.0, uv.y);
    vec3 base = mix(uColorCharcoal * 0.6, uColorBlack, verticalMix);

    // cursor softly pulls the aura center, clamped so it never travels far
    vec2 mouseOffset = clamp(uMouse, vec2(-1.0), vec2(1.0)) * 0.18;
    vec2 center = mouseOffset;

    vec2 toCenter = aspectUv - center;
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);

    // slow breathing pulse
    float breathe = 0.5 + 0.5 * sin(uTime * 0.35);

    // lotus-shaped aura: a radial glow modulated by petal lobes
    float petals = 0.5 + 0.5 * cos(angle * 5.0 + uTime * 0.08);
    float lotus = smoothstep(0.85, 0.0, dist + petals * 0.06) ;
    lotus *= 0.45 + 0.35 * breathe;

    vec3 goldGlow = uColorGold * lotus;

    // faint purple energy wisps drifting slowly across the scene
    float wisp = noise(aspectUv * 2.2 + vec2(uTime * 0.04, -uTime * 0.03));
    wisp = smoothstep(0.55, 0.95, wisp);
    vec3 purpleEnergy = uColorPurple * wisp * 0.22;

    vec3 color = base + goldGlow + purpleEnergy;

    // soft vignette to keep edges resting in black
    float vignette = smoothstep(1.05, 0.25, length(aspectUv));
    color = mix(uColorBlack, color, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
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
    if (!materialRef.current) return;
    if (reduced) return;

    materialRef.current.uniforms.uTime.value += delta;
    target.current.set(state.pointer.x, state.pointer.y);
    mouse.current.lerp(target.current, 0.04);
    materialRef.current.uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
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

const FALLBACK_GRADIENT =
  "radial-gradient(circle at 50% 38%, rgba(201,168,106,0.22), transparent 60%), radial-gradient(circle at 70% 70%, rgba(110,79,140,0.16), transparent 55%), linear-gradient(180deg, #0a0908 0%, #1c1a18 100%)";

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
        className="absolute inset-0"
        style={{ background: FALLBACK_GRADIENT }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ background: FALLBACK_GRADIENT, opacity: mounted ? 0 : 1 }}
      />
      {webglOk && (
        <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: mounted ? 1 : 0 }}>
          <Canvas
            frameloop={reduced ? "demand" : "always"}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
            onCreated={() => setMounted(true)}
          >
            <AuraPlane reduced={reduced} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
