"use client";

import { useEffect, useRef } from "react";
import { useFounderGlobe } from "@/components/cockpit/FounderGlobeContext";

const MERIDIANS = 24;
const PARALLELS = 14;
const GLOW_NODES = 48;

const LISTENING_HINTS = new Set([
  "Sprich — ich höre zu.",
  "Tippe die Kugel — sprich mit Founder",
  "Ich höre zu — sprich einfach los.",
  "Tippe die Kugel — sprich jetzt.",
  "Tippe die Kugel — sprich direkt",
  "Tippe die Kugel — dann sprich",
  "Sprich jetzt — ich höre zu.",
]);

const ACTIVITY_CONFIG = {
  idle: { glow: 1.2, spin: 1, pulse: 1, ring: 0 },
  speaking: { glow: 3.8, spin: 2.4, pulse: 2.8, ring: 1 },
  listening: { glow: 3, spin: 1.6, pulse: 2.2, ring: 0.85 },
  typing: { glow: 2.5, spin: 1.3, pulse: 2, ring: 0.7 },
  thinking: { glow: 2.4, spin: 1.8, pulse: 1.6, ring: 0.55 },
};

function buildGlobeGeometry() {
  const meridians = [];
  for (let m = 0; m < MERIDIANS; m += 1) {
    const theta = (m / MERIDIANS) * Math.PI * 2;
    const line = [];
    for (let p = 0; p <= 64; p += 1) {
      const phi = (p / 64) * Math.PI;
      line.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
      });
    }
    meridians.push(line);
  }

  const parallels = [];
  for (let p = 1; p < PARALLELS; p += 1) {
    const phi = (p / PARALLELS) * Math.PI;
    const y = Math.cos(phi);
    const radius = Math.sin(phi);
    const line = [];
    for (let s = 0; s <= 64; s += 1) {
      const theta = (s / 64) * Math.PI * 2;
      line.push({
        x: radius * Math.cos(theta),
        y,
        z: radius * Math.sin(theta),
      });
    }
    parallels.push(line);
  }

  const nodes = [];
  for (let i = 0; i < GLOW_NODES; i += 1) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / GLOW_NODES);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    nodes.push({
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta),
      pulse: Math.random() * Math.PI * 2,
    });
  }

  return { meridians, parallels, nodes };
}

function rotateY(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  };
}

function project(point, width, height, scale, centerY) {
  const perspective = 2.8 / (2.8 + point.z);
  return {
    x: width * 0.5 + point.x * scale * perspective,
    y: height * centerY + point.y * scale * perspective,
    depth: point.z,
    alpha: 0.15 + (point.z + 1) * 0.35,
  };
}

function drawGlobeFrame(ctx, { width, height, centerY, scale, rotation, activity, voiceActive, now, geometry }) {
  const { meridians, parallels, nodes } = geometry;
  const config = ACTIVITY_CONFIG[activity] ?? ACTIVITY_CONFIG.idle;
  const activeGlow = (voiceActive ? 1.35 : 1) * config.glow;
  const lineAlpha = voiceActive ? (activity === "idle" ? 0.62 : 0.78) : activity === "idle" ? 0.28 : 0.42;
  const lineWidth = voiceActive ? 1.15 : 0.75;

  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * centerY,
    scale * 0.08,
    width * 0.5,
    height * centerY,
    scale * 1.15
  );
  gradient.addColorStop(0, `rgba(47, 97, 223, ${0.3 * activeGlow})`);
  gradient.addColorStop(0.45, `rgba(26, 58, 173, ${0.18 * activeGlow})`);
  gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (config.ring > 0) {
    const cx = width * 0.5;
    const cy = height * centerY;
    const baseRadius = scale * 0.55;
    for (let index = 0; index < 3; index += 1) {
      const phase = (now * 0.0016 + index * 0.33) % 1;
      const radius = baseRadius + phase * scale * 0.45;
      const alpha = (1 - phase) * 0.22 * config.ring;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(91, 140, 255, ${alpha})`;
      ctx.lineWidth = 2 + config.ring;
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawLine(points, rot, strokeStyle, lw) {
    ctx.beginPath();
    ctx.lineWidth = lw;
    ctx.strokeStyle = strokeStyle;
    let started = false;
    for (const raw of points) {
      const rotated = rotateY(raw, rot);
      if (rotated.z < -0.25) {
        started = false;
        continue;
      }
      const p = project(rotated, width, height, scale, centerY);
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  for (const line of meridians) {
    drawLine(line, rotation, `rgba(47, 97, 223, ${lineAlpha})`, lineWidth);
  }
  for (const line of parallels) {
    drawLine(line, rotation, `rgba(26, 58, 173, ${lineAlpha * 0.75})`, lineWidth);
  }

  for (const node of nodes) {
    const rotated = rotateY(node, rotation);
    if (rotated.z < -0.1) continue;
    const p = project(rotated, width, height, scale, centerY);
    const glow = 0.55 + Math.sin(now * 0.002 * config.pulse + node.pulse) * 0.35 * config.pulse;
    ctx.beginPath();
    ctx.fillStyle = `rgba(91, 140, 255, ${Math.min(1, p.alpha * glow * 0.9)})`;
    ctx.arc(p.x, p.y, 1.2 + p.alpha * (1.4 + config.pulse * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
}

function getVoiceGlobeCanvasSize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Mobile: unchanged — compact above chat dock
  if (vw < 768) {
    return Math.min(Math.floor(vw * 0.56), 232);
  }

  // Voice chat panel is max 34dvh but usually much shorter when empty (~13rem)
  const headerReserve = vw >= 1024 ? 72 : 64;
  const panelVh = vw >= 640 ? 0.34 : 0.38;
  const panelCap = vw >= 640 ? 208 : 224;
  const panelHeight = Math.min(Math.floor(vh * panelVh), panelCap);
  const bottomReserve = 96 + panelHeight;
  const bandHeight = Math.max(vh - headerReserve - bottomReserve, 300);
  const hintReserve = 28;
  const byHeight = Math.floor(bandHeight - hintReserve);
  const byWidth = Math.floor(vw * 0.54);
  const size = Math.min(byHeight, byWidth);

  return Math.min(Math.max(size, 420), 720);
}

function getVoiceGlobeDrawScale(canvasSize) {
  const isDesktop = window.innerWidth >= 768;
  return canvasSize * (isDesktop ? 0.54 : 0.36);
}

function isUserSpeech(activity, message) {
  return activity === "listening" && message?.trim() && !LISTENING_HINTS.has(message.trim());
}

export function GlobeBackground({ scaleFactor = 0.34, centerY = 0.42, glowIntensity = 1 }) {
  const canvasRef = useRef(null);
  const geometryRef = useRef(null);
  const { activity, message, voiceGlobe, invokeGlobeTap } = useFounderGlobe();
  const activityRef = useRef(activity);
  const voiceGlobeRef = useRef(voiceGlobe);

  const voiceActive = voiceGlobe.active;

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    voiceGlobeRef.current = voiceGlobe;
  }, [voiceGlobe]);

  useEffect(() => {
    geometryRef.current = buildGlobeGeometry();
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return undefined;

    let frameId = 0;
    let rotation = 0;
    let lastTime = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const hero = voiceGlobeRef.current.active;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (hero) {
        const size = getVoiceGlobeCanvasSize();
        canvas.width = Math.floor(size * dpr);
        canvas.height = Math.floor(size * dpr);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      } else {
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render(now) {
      const voice = voiceGlobeRef.current;
      const width = voice.active ? parseInt(canvas.style.width, 10) : window.innerWidth;
      const height = voice.active ? parseInt(canvas.style.height, 10) : window.innerHeight;
      const center = voice.active ? 0.5 : centerY;
      const scale = voice.active
        ? getVoiceGlobeDrawScale(Math.min(width, height))
        : Math.min(width, height) * scaleFactor * glowIntensity;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!reducedMotion) {
        const spin = ACTIVITY_CONFIG[activityRef.current]?.spin ?? 1;
        rotation += delta * 0.18 * spin;
      }

      drawGlobeFrame(ctx, {
        width,
        height,
        centerY: center,
        scale,
        rotation,
        activity: activityRef.current,
        voiceActive: voice.active,
        now,
        geometry: geometryRef.current,
      });

      frameId = requestAnimationFrame(render);
    }

    resize();
    frameId = requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [centerY, glowIntensity, scaleFactor, voiceActive]);

  if (voiceActive) {
    const userSpeech = isUserSpeech(activity, message);
    const isActive = activity !== "idle";

    return (
      <div className="pointer-events-none fixed inset-0 z-[25] flex items-center justify-center px-4 pt-14 pb-[calc(6.5rem+min(34dvh,13rem)+env(safe-area-inset-bottom))] sm:pt-16">
        <div className="flex max-w-full flex-col items-center">
          <div className="relative shrink-0 pointer-events-auto">
          <canvas
            ref={canvasRef}
            aria-hidden
            className={`block rounded-full transition-shadow duration-500 ${
              isActive ? "shadow-[0_0_48px_rgba(91,140,255,0.45)]" : "shadow-[0_0_28px_rgba(26,58,173,0.3)]"
            }`}
          />
          <button
            type="button"
            disabled={voiceGlobe.tapDisabled}
            onClick={invokeGlobeTap}
            aria-label={voiceGlobe.hint || "Mit Founder sprechen"}
            className={`absolute inset-0 rounded-full border-2 border-transparent transition active:scale-[0.97] ${
              isActive ? "border-[#5b8cff]/30" : "hover:border-[#5b8cff]/20"
            } ${voiceGlobe.tapDisabled ? "cursor-wait" : "cursor-pointer"}`}
          />
        </div>

        {voiceGlobe.started && message?.trim() && activity !== "thinking" && (
          <div className="mt-4 max-w-sm text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b8cff]">
              {userSpeech ? "Du" : "Founder"}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-neutral-100">{message}</p>
          </div>
        )}

        {voiceGlobe.hint && (
          <p
            className={`max-w-xs text-center text-sm leading-6 ${
              voiceGlobe.started ? "mt-2 text-xs font-medium text-[#5b8cff]/80" : "mt-3 text-neutral-200"
            }`}
          >
            {voiceGlobe.hint}
          </p>
        )}

        {voiceGlobe.error && (
          <p className="mt-2 max-w-xs text-center text-xs leading-5 text-red-300">{voiceGlobe.error}</p>
        )}
        </div>
      </div>
    );
  }

  const isActive = activity !== "idle";

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${
        isActive ? "opacity-80 sm:opacity-95 lg:opacity-100" : "opacity-45 sm:opacity-55 lg:opacity-70"
      }`}
    />
  );
}
