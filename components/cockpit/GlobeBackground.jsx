"use client";

import { useEffect, useRef } from "react";

const MERIDIANS = 24;
const PARALLELS = 14;
const GLOW_NODES = 48;

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

function project(point, width, height, scale) {
  const perspective = 2.8 / (2.8 + point.z);
  return {
    x: width * 0.5 + point.x * scale * perspective,
    y: height * 0.42 + point.y * scale * perspective,
    depth: point.z,
    alpha: 0.15 + (point.z + 1) * 0.35,
  };
}

export function GlobeBackground() {
  const canvasRef = useRef(null);
  const geometryRef = useRef(null);

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

    function drawLine(points, width, height, scale, rot) {
      ctx.beginPath();
      let started = false;
      for (const raw of points) {
        const rotated = rotateY(raw, rot);
        if (rotated.z < -0.25) {
          started = false;
          continue;
        }
        const p = project(rotated, width, height, scale);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }

    function render(now) {
      const { meridians, parallels, nodes } = geometryRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scale = Math.min(width, height) * 0.34;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!reducedMotion) rotation += delta * 0.18;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.42, scale * 0.1, width * 0.5, height * 0.42, scale * 1.1);
      gradient.addColorStop(0, "rgba(26, 58, 173, 0.14)");
      gradient.addColorStop(0.55, "rgba(26, 58, 173, 0.04)");
      gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 0.75;
      for (const line of meridians) {
        ctx.strokeStyle = "rgba(26, 58, 173, 0.28)";
        drawLine(line, width, height, scale, rotation);
      }
      for (const line of parallels) {
        ctx.strokeStyle = "rgba(26, 58, 173, 0.2)";
        drawLine(line, width, height, scale, rotation);
      }

      for (const node of nodes) {
        const rotated = rotateY(node, rotation);
        if (rotated.z < -0.1) continue;
        const p = project(rotated, width, height, scale);
        const glow = 0.55 + Math.sin(now * 0.002 + node.pulse) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = `rgba(47, 97, 223, ${p.alpha * glow})`;
        ctx.arc(p.x, p.y, 1.2 + p.alpha * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = requestAnimationFrame(render);
    }

    resize();
    frameId = requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
