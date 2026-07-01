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

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawGlobeCaption(ctx, { width, height, centerY, scale, message, activity, hint, error, voiceActive }) {
  const maxWidth = Math.min(width * 0.88, 440);
  const textY = height * centerY + scale * 0.78;
  const cx = width * 0.5;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (message?.trim()) {
    const isUserSpeech = activity === "listening" && !LISTENING_HINTS.has(message.trim());
    const label = isUserSpeech ? "Du" : "Founder";
    ctx.font = "600 10px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isUserSpeech ? "rgba(140, 200, 255, 0.9)" : "rgba(91, 140, 255, 0.95)";
    ctx.fillText(label, cx, textY - 18);

    ctx.font = "500 14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isUserSpeech ? "rgba(210, 235, 255, 0.95)" : "rgba(235, 242, 255, 0.92)";
    const lines = wrapCanvasText(ctx, message, maxWidth).slice(0, voiceActive ? 5 : 4);
    lines.forEach((line, index) => {
      ctx.fillText(line, cx, textY + index * 20);
    });
  }

  if (hint?.trim()) {
    ctx.font = "500 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(91, 140, 255, 0.75)";
    const hintY = message?.trim() ? textY + 108 : textY;
    ctx.fillText(hint, cx, hintY);
  }

  if (error?.trim()) {
    ctx.font = "500 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(248, 113, 113, 0.9)";
    const errorY = message?.trim() ? textY + (hint?.trim() ? 128 : 108) : textY + 24;
    const errorLines = wrapCanvasText(ctx, error, maxWidth).slice(0, 2);
    errorLines.forEach((line, index) => {
      ctx.fillText(line, cx, errorY + index * 16);
    });
  }
}

export function GlobeBackground({ scaleFactor = 0.34, centerY = 0.42, glowIntensity = 1 }) {
  const canvasRef = useRef(null);
  const geometryRef = useRef(null);
  const { activity, message, voiceGlobe, invokeGlobeTap } = useFounderGlobe();
  const activityRef = useRef(activity);
  const messageRef = useRef(message);
  const voiceGlobeRef = useRef(voiceGlobe);

  const voiceActive = voiceGlobe.active;
  const effectiveScale = voiceActive ? 0.44 : scaleFactor;
  const effectiveCenterY = voiceActive ? 0.34 : centerY;
  const effectiveGlow = voiceActive ? glowIntensity * 1.35 : glowIntensity;

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawLine(points, width, height, scale, rot, strokeStyle, lineWidth = 0.75) {
      ctx.beginPath();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeStyle;
      let started = false;
      for (const raw of points) {
        const rotated = rotateY(raw, rot);
        if (rotated.z < -0.25) {
          started = false;
          continue;
        }
        const p = project(rotated, width, height, scale, effectiveCenterY);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }

    function drawPulseRings(width, height, scale, now, ringStrength) {
      if (ringStrength <= 0) return;

      const cx = width * 0.5;
      const cy = height * effectiveCenterY;
      const baseRadius = scale * 0.55;

      for (let index = 0; index < 3; index += 1) {
        const phase = (now * 0.0016 + index * 0.33) % 1;
        const radius = baseRadius + phase * scale * 0.45;
        const alpha = (1 - phase) * 0.22 * ringStrength;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(91, 140, 255, ${alpha})`;
        ctx.lineWidth = 2 + ringStrength;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function render(now) {
      const { meridians, parallels, nodes } = geometryRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const voice = voiceGlobeRef.current;
      const config = ACTIVITY_CONFIG[activityRef.current] ?? ACTIVITY_CONFIG.idle;
      const activeGlow = effectiveGlow * config.glow;
      const activeSpin = config.spin;
      const scale = Math.min(width, height) * effectiveScale * (config.glow > 1.2 ? 1.14 : 1);
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!reducedMotion) rotation += delta * 0.18 * activeSpin;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * effectiveCenterY,
        scale * 0.08,
        width * 0.5,
        height * effectiveCenterY,
        scale * 1.15
      );
      gradient.addColorStop(0, `rgba(47, 97, 223, ${0.28 * activeGlow})`);
      gradient.addColorStop(0.45, `rgba(26, 58, 173, ${0.16 * activeGlow})`);
      gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      drawPulseRings(width, height, scale, now, config.ring);

      const lineAlpha = voice.active
        ? activityRef.current === "idle"
          ? 0.58
          : 0.72
        : activityRef.current === "idle"
          ? 0.28
          : 0.42;
      const lineWidth = voice.active ? 1.1 : 0.75;

      for (const line of meridians) {
        drawLine(line, width, height, scale, rotation, `rgba(47, 97, 223, ${lineAlpha})`, lineWidth);
      }
      for (const line of parallels) {
        drawLine(line, width, height, scale, rotation, `rgba(26, 58, 173, ${lineAlpha * 0.75})`, lineWidth);
      }

      for (const node of nodes) {
        const rotated = rotateY(node, rotation);
        if (rotated.z < -0.1) continue;
        const p = project(rotated, width, height, scale, effectiveCenterY);
        const glow = 0.55 + Math.sin(now * 0.002 * config.pulse + node.pulse) * 0.35 * config.pulse;
        ctx.beginPath();
        ctx.fillStyle = `rgba(91, 140, 255, ${Math.min(1, p.alpha * glow * 0.9)})`;
        ctx.arc(p.x, p.y, 1.2 + p.alpha * (1.4 + config.pulse * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      drawGlobeCaption(ctx, {
        width,
        height,
        centerY: effectiveCenterY,
        scale,
        message: messageRef.current,
        activity: activityRef.current,
        hint: voice.hint,
        error: voice.error,
        voiceActive: voice.active,
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
  }, [effectiveCenterY, effectiveGlow, effectiveScale]);

  const isActive = activity !== "idle";
  const opacityClass = voiceActive
    ? "opacity-95 sm:opacity-100"
    : isActive
      ? "opacity-80 sm:opacity-95 lg:opacity-100"
      : "opacity-45 sm:opacity-55 lg:opacity-70";

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${opacityClass}`}
      />
      {voiceActive && (
        <button
          type="button"
          disabled={voiceGlobe.tapDisabled}
          onClick={invokeGlobeTap}
          aria-label={voiceGlobe.hint || "Mit Founder sprechen"}
          className={`fixed left-1/2 z-[5] h-[min(82vw,340px)] w-[min(82vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent ${
            voiceGlobe.tapDisabled ? "cursor-wait" : "cursor-pointer"
          }`}
          style={{ top: `${effectiveCenterY * 100}vh` }}
        />
      )}
    </>
  );
}
