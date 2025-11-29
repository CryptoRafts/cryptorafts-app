"use client";

import React, { useEffect, useMemo, useRef, useState, useId } from "react";
import { geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";

// === HDR 4K Neo‑Glass World Background (Pro v5.4: Fix Unterminated String, Static BG, Slow Motion) ===
// Changes in this patch:
// • FIX: Removed corrupted string in tests that caused "Unterminated string constant".
// • FIX: Ensured all <g> blocks close properly; no SVG nodes inside string literals.
// • UPDATE: Background (ocean + film grain) is STATIC (outside animated group) to prevent corner flicker.
// • UPDATE: Map motion slowed (scale 28s, translate 48s) with cinematic amplitudes.
// • UPDATE: Pure off/on star blink via discrete opacity animation; neutral white stars (no blue tint).
// • TESTS: Non-throwing runtime asserts for path generation, clipPath, blink presence, and map anim transforms.

export default function HDRWorldBackground({
  quality = "4k",
  intensity = 1,
  speed = 0.5,
  showSafeBand = false,
  dataUrl,
  geojson,
  dotDensity = "dense",
  mapScale = 1.3,            // larger than fitted size
  starDrift = false,         // default OFF: pure blink, no motion
  blinkSpeed = 2.2,          // seconds; cadence for pure on/off blink
  children,
}: {
  quality?: "4k" | "2k" | "1080p";
  intensity?: number; // 0.5 – 1.5
  speed?: number;     // 0.0 – 2 (drift multiplier; used only if starDrift)
  showSafeBand?: boolean;
  dataUrl?: string;
  geojson?: any;
  dotDensity?: "light" | "balanced" | "dense";
  mapScale?: number;
  starDrift?: boolean;
  blinkSpeed?: number;
  children?: React.ReactNode;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dims, setDims] = useState({ w: 1920, h: 1080 });
  const [landFeature, setLandFeature] = useState<any | null>(null);
  const uid = useId();

  // Respect reduced motion
  const prefersReduced = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Responsive sizing
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const density = useMemo(() => (quality === "4k" ? 1.0 : quality === "2k" ? 0.7 : 0.45), [quality]);
  const dpr = typeof window !== "undefined" ? Math.min(2.5, window.devicePixelRatio || 1) : 1;

  // === Data loader (robust fallbacks) ===
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      try {
        if (geojson) {
          if (!isCancelled) setLandFeature(toLandFeature(geojson));
          return;
        }
        if (dataUrl && typeof window !== "undefined") {
          const g = await fetchGeoOrTopo(dataUrl);
          if (g && !isCancelled) {
            setLandFeature(toLandFeature(g));
            return;
          }
        }
        if (typeof window !== "undefined") {
          const candidates = [
            "world-atlas/world/110m.json",
            "world-atlas/countries-110m.json",
            "world-atlas/world/50m.json",
          ];
          for (const spec of candidates) {
            try {
              const mod = await (new Function("spec", "return import(/* @vite-ignore */ spec);") as any)(spec);
              const topo = mod?.default || mod;
              const land = topo?.objects?.land || topo?.objects?.countries;
              if (land && !isCancelled) {
                setLandFeature(feature(topo as any, land));
                return;
              }
            } catch {}
          }
        }
        if (typeof window !== "undefined") {
          const cdnUrls = [
            "https://unpkg.com/world-atlas/world/110m.json",
            "https://cdn.jsdelivr.net/npm/world-atlas/world/110m.json",
            "https://unpkg.com/world-atlas/world/50m.json",
          ];
          for (const url of cdnUrls) {
            const g = await fetchGeoOrTopo(url, 2500);
            if (g && !isCancelled) {
              setLandFeature(toLandFeature(g));
              return;
            }
          }
        }
        if (!isCancelled) setLandFeature(SIMPLIFIED_FALLBACK_LAND);
      } catch {
        if (!isCancelled) setLandFeature(SIMPLIFIED_FALLBACK_LAND);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [dataUrl, geojson]);

  // Projection & path (tight fit + upscale)
  const projection = useMemo(() => {
    const g = landFeature ?? SIMPLIFIED_FALLBACK_LAND;
    const proj = geoMercator().fitExtent(
      [
        [8, 8],
        [dims.w - 8, dims.h - 8],
      ],
      g as any
    );
    const s = proj.scale();
    proj.scale(s * mapScale);
    return proj;
  }, [landFeature, dims, mapScale]);
  const path = useMemo(() => geoPath(projection), [projection]);

  // Hubs (only for subtle clustering bias)
  const hubs = useMemo(() => {
    const C: [number, number][] = [
      // North America
      [-123.1207, 49.2827], [-122.4194, 37.7749], [-118.2437, 34.0522], [-95.3698, 29.7604],
      [-87.6298, 41.8781], [-79.3832, 43.6532], [-74.006, 40.7128], [-71.0589, 42.3601],
      [-99.1332, 19.4326], [-79.5197, 8.9824],
      // South America
      [-58.3816, -34.6037], [-46.6333, -23.5505], [-43.1729, -22.9068], [-77.0428, -12.0464],
      [-70.6693, -33.4489], [-74.0721, 4.711],
      // Europe
      [-3.7038, 40.4168], [2.3522, 48.8566], [4.9041, 52.3676], [12.4964, 41.9028], [14.4378, 50.0755],
      [19.0402, 47.4979], [24.7536, 59.437], [30.3351, 59.9343], [-0.1276, 51.5074], [37.6173, 55.7558],
      // Africa
      [31.2357, 30.0444], [28.0473, -26.2041], [18.4241, -33.9249], [3.3792, 6.5244], [32.5825, 0.3476],
      [39.2083, -6.7924], [-17.4677, 14.7167],
      // Middle East & Central Asia
      [55.2708, 25.2048], [51.389, 35.6892], [44.3661, 33.3152], [46.6753, 24.7136], [58.3829, 23.588], [66.9237, 39.6542],
      // South Asia
      [67.0099, 24.8615], [74.3587, 31.5204], [72.8777, 19.076], [77.209, 28.6139], [88.3639, 22.5726],
      [90.4125, 23.8103], [80.2707, 13.0827], [78.4867, 17.385], [72.5714, 23.0225],
      // East & SE Asia & Oceania
      [116.4074, 39.9042], [121.4737, 31.2304], [114.1694, 22.3193], [120.9842, 14.5995], [100.5018, 13.7563],
      [106.865, -6.1751], [151.2093, -33.8688], [144.9631, -37.8136], [139.6503, 35.6762], [135.5022, 34.6937],
      [127.0246, 37.5326], [121.5654, 25.033], [103.8198, 1.3521],
      // Caucasus & Central
      [35.2433, 31.7717], [44.8024, 41.7151], [69.2401, 41.2995],
    ];
    return C.map((c) => ({ c, p: projection(c as any) as [number, number] })).filter((d) => !!d.p);
  }, [projection]);

  // --- Dot field (tiny glowing points) ---
  const dotBase = dotDensity === "dense" ? 3200 : dotDensity === "balanced" ? 2100 : 1200; // richer at 4K
  const dotCount = Math.floor((prefersReduced ? dotBase * 0.6 : dotBase) * density * (dims.w / 1920));
  const rngDots = useMemo(() => seededRandom(2025), []);
  const dots = useMemo(() => {
    const arr: { id: number; x: number; y: number; r: number; dx: number; dy: number }[] = [];
    for (let i = 0; i < dotCount; i++) {
      let x = rngDots() * dims.w;
      let y = rngDots() * dims.h;
      // Slight clustering near hubs for visual interest
      if (i % 5 === 0 && hubs.length) {
        const h = hubs[Math.floor(rngDots() * hubs.length)];
        const jx = (rngDots() - 0.5) * 120;
        const jy = (rngDots() - 0.5) * 80;
        x = Math.max(0, Math.min(dims.w, h.p![0] + jx));
        y = Math.max(0, Math.min(dims.h, h.p![1] + jy));
      }
      const r = 0.28 + rngDots() * (intensity * 0.55); // star core size
      const dx = (rngDots() - 0.5) * 4 * speed;        // gentle drift vector (used if starDrift)
      const dy = (rngDots() - 0.5) * 4 * speed;
      arr.push({ id: i, x, y, r, dx, dy });
    }
    return arr;
  }, [dotCount, dims, hubs, intensity, rngDots, speed]);

  // Unique IDs (include landClip)
  const ids = useMemo(
    () => ({
      glow: `glow-${uid}`,
      ocean: `ocean-${uid}`,
      landgrad: `landgrad-${uid}`,
      linkGlow: `linkGlow-${uid}`,
      landClip: `landClip-${uid}`,
    }),
    [uid]
  );

  // Smoke tests (non-throwing)
  useEffect(() => {
    try {
      console.assert(validateMultiPolygon(SIMPLIFIED_FALLBACK_LAND), "[TEST] fallback GeoJSON invalid");
      const p = path(landFeature ?? SIMPLIFIED_FALLBACK_LAND);
      console.assert(typeof p === "string" && p.length > 0, "[TEST] map path generation failed");
      console.assert(ids.landClip && typeof ids.landClip === "string", "[TEST] landClip id missing");
    } catch (e) {
      console.warn("[TEST] map path generation threw", e);
    }
    console.assert(dots.length > 0, "[TEST] no dots generated");
    console.assert(dots.every(d => Number.isFinite(d.r) && d.r > 0), "[TEST] invalid dot radius");
    if (typeof document !== 'undefined') {
      const blinkAnim = document.querySelector('animate[attributeName="opacity"]');
      console.assert(!!blinkAnim, "[TEST] blink <animate> not found");
      const scaleAnim = document.querySelector('g[id^="mapAnim-"] animateTransform[type="scale"]');
      const transAnim = document.querySelector('g[id^="mapAnim-"] animateTransform[type="translate"]');
      console.assert(!!scaleAnim && !!transAnim, "[TEST] map animation transforms missing");
    }
  }, [landFeature, path, dots, ids.landClip]);

  return (
    <div
      data-testid="hdr-world-bg"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(1200px 1200px at 70% 20%, rgba(50,140,180,0.25), rgba(6,10,18,0.6) 40%, #060A12 70%)",
        filter: "saturate(1.12) contrast(1.08)",
        willChange: "transform",
      }}
    >
      {/* sheen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 40%), radial-gradient(1000px 600px at 20% -10%, rgba(120,200,255,0.08), rgba(0,0,0,0))",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* map */}
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{ position: "absolute", inset: 0 }}
        shapeRendering="geometricPrecision"
      >
        <defs>
          <filter id={ids.glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6 * intensity * dpr} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={ids.linkGlow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3 * intensity * dpr} result="gb" />
            <feMerge>
              <feMergeNode in="gb" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* HDR star bloom (crisp core + soft glow) */}
          <filter id={`starBloom-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={2.2 * dpr} result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={0.8 * dpr} result="b2" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Subtle film grain to avoid banding on large gradients */}
          <filter id={`film-${uid}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="1" seed="7" result="n" />
            <feColorMatrix in="n" type="saturate" values="0" result="gn" />
            <feComponentTransfer in="gn">
              <feFuncA type="table" tableValues="0 0.04" />
            </feComponentTransfer>
          </filter>
          <linearGradient id={ids.ocean} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(70,180,255,0.18)" />
            <stop offset="100%" stopColor="rgba(0,180,140,0.12)" />
          </linearGradient>
          <linearGradient id={ids.landgrad} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(160,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(60,220,220,0.75)" />
          </linearGradient>
          {/* Clip stars to land only */}
          <clipPath id={ids.landClip}>
            <path d={path((landFeature ?? SIMPLIFIED_FALLBACK_LAND) as any) || ""} />
          </clipPath>
        </defs>

        {/* Static background to prevent corner reveal */}
        <rect width="100%" height="100%" fill="#060A12" />
        <rect width="100%" height="100%" fill={`url(#${ids.ocean})`} opacity={0.25} />
        <rect width="100%" height="100%" filter={`url(#film-${uid})`} opacity={0.18} style={{ mixBlendMode: 'overlay' }} />

        {/* Animated wrapper for land + stars only (background is static) */}
        <g id={`mapAnim-${uid}`}>
          {!prefersReduced && (
            <>
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1 1; 1.10 1.10; 1 1"
                dur="28s"
                repeatCount="indefinite"
                additive="replace"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -24 -16; 0 0; 24 16; 0 0"
                dur="48s"
                repeatCount="indefinite"
                additive="sum"
              />
            </>
          )}

          {/* land */}
          <g filter={`url(#${ids.glow})`}>
            <path d={path((landFeature ?? SIMPLIFIED_FALLBACK_LAND) as any) || ""} fill="rgba(180,255,255,0.06)" />
            <path d={path((landFeature ?? SIMPLIFIED_FALLBACK_LAND) as any) || ""} fill="none" stroke="rgba(10,30,40,0.7)" strokeWidth={1.8 * dpr} />
            <path
              d={path((landFeature ?? SIMPLIFIED_FALLBACK_LAND) as any) || ""}
              fill="none"
              stroke={`url(#${ids.landgrad})`}
              strokeOpacity={0.95}
              strokeWidth={1.0 * dpr}
            />
          </g>

          {/* Dot field (land‑clipped) */}
          <g clipPath={`url(#${ids.landClip})`} filter={`url(#starBloom-${uid})`}>
            {dots.map((d, i) => (
              <g key={d.id} transform={`translate(${d.x}, ${d.y})`}>
                {/* halo */}
                <circle r={d.r * 3} fill="rgba(255,255,255,0.22)" />
                {/* core */}
                <circle r={d.r} fill="white">
                  {!prefersReduced && (
                    <animate
                      attributeName="opacity"
                      values="0;1;0"
                      keyTimes="0;0.5;1"
                      dur={`${blinkSpeed}s`}
                      begin={`${(i % 29) * 0.035}s`}
                      calcMode="discrete"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                {/* optional motion (drift) */}
                {!prefersReduced && starDrift && (
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0 0; ${d.dx.toFixed(2)} ${d.dy.toFixed(2)}; 0 0`}
                    dur={`${6 + (i % 5)}s`}
                    repeatCount="indefinite"
                    additive="sum"
                  />
                )}
              </g>
            ))}
          </g>
        </g>
      </svg>

      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%), linear-gradient(0deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 30%)",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

      {showSafeBand && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "46%",
            height: "8%",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.24) 40%, rgba(0,0,0,0) 100%)",
            filter: "blur(8px)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
      )}

      {children ? (
        <div style={{ position: "relative", zIndex: 2, width: "100%", height: "100%" }}>{children}</div>
      ) : null}
    </div>
  );
}

// ===== helpers =====
async function fetchGeoOrTopo(url: string, timeoutMs = 4000): Promise<any | null> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

function toLandFeature(data: any): any {
  if (!data) return SIMPLIFIED_FALLBACK_LAND;
  if ((data as any).type === "Topology") {
    const topo: any = data;
    const obj = topo.objects?.land || topo.objects?.countries || topo.objects?.ne_110m_admin_0_countries;
    if (obj) return feature(topo, obj);
  }
  if ((data as any).type === "FeatureCollection") return data;
  if ((data as any).type === "Feature") return data;
  return SIMPLIFIED_FALLBACK_LAND;
}

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return function () {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

// Simple validator for MultiPolygon-like shapes
function validateMultiPolygon(f: any): boolean {
  try {
    if (!f || f.type !== "Feature") return false;
    const g = f.geometry;
    if (!g || g.type !== "MultiPolygon" || !Array.isArray(g.coordinates)) return false;
    const firstPoly = g.coordinates[0];
    return Array.isArray(firstPoly) && Array.isArray(firstPoly[0]) && Array.isArray(firstPoly[0][0]) &&
      typeof firstPoly[0][0][0] === "number" && typeof firstPoly[0][0][1] === "number";
  } catch { return false; }
}

// Simplified fallback land (valid GeoJSON; properly closed)
const SIMPLIFIED_FALLBACK_LAND = {
  type: "Feature",
  properties: { name: "fallback" },
  geometry: {
    type: "MultiPolygon",
    coordinates: [
      // Eurasia (very rough envelope)
      [[[-10, 35], [60, 35], [90, 45], [120, 55], [140, 65], [60, 70], [20, 70], [-10, 60], [-10, 35]]],
      // Africa
      [[[-20, 35], [50, 35], [50, -35], [10, -35], [-20, 0], [-20, 35]]],
      // North America
      [[[-170, 15], [-60, 15], [-60, 70], [-130, 75], [-170, 60], [-170, 15]]],
      // South America
      [[[-80, 12], [-35, 12], [-35, -55], [-65, -50], [-80, -10], [-80, 12]]],
      // Australia
      [[[110, -10], [155, -10], [155, -45], [115, -45], [110, -10]]],
      // Greenland/Iceland blob
      [[[-50, 60], [-20, 60], [-20, 70], [-45, 75], [-50, 60]]],
      // SE Asia archipelago blob
      [[[100, 5], [130, 5], [130, -10], [105, -10], [100, 5]]],
      // Japan blob
      [[[135, 30], [145, 30], [145, 40], [135, 40], [135, 30]]],
      // UK blob
      [[[-8, 50], [2, 50], [2, 59], [-8, 59], [-8, 50]]]
    ]
  }
};
