"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Disable on touch / mobile
    const touch =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(max-width: 768px)").matches);
    if (touch) return;
    setEnabled(true);

    let rafId = 0;
    const target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };

    const animate = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      setRingPos({ x: current.x, y: current.y });
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setPos({ x: e.clientX, y: e.clientY });
      const el = e.target as HTMLElement;
      const interactive = el.closest(
        "a, button, input, select, textarea, [data-cursor-hover], .member-card-host"
      );
      setHovering(!!interactive);
    };
    window.addEventListener("mousemove", onMove);
    document.documentElement.classList.add("cursor-hide");

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.classList.remove("cursor-hide");
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 z-[100] pointer-events-none rounded-full"
        style={{
          width: hovering ? 12 : 6,
          height: hovering ? 12 : 6,
          transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
          background:
            "radial-gradient(circle, #ffffff 0%, rgba(167,139,250,0.9) 60%, transparent 100%)",
          boxShadow: "0 0 12px rgba(167,139,250,0.9)",
          transition: "width .15s, height .15s",
        }}
      />
      <div
        className="fixed top-0 left-0 z-[100] pointer-events-none rounded-full"
        style={{
          width: hovering ? 56 : 32,
          height: hovering ? 56 : 32,
          transform: `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`,
          border: "1.5px solid rgba(167,139,250,0.6)",
          background: hovering
            ? "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)"
            : "transparent",
          boxShadow: hovering
            ? "0 0 25px rgba(167,139,250,0.5), inset 0 0 15px rgba(34,211,238,0.2)"
            : "0 0 12px rgba(167,139,250,0.3)",
          transition: "width .25s, height .25s, background .25s, box-shadow .25s",
        }}
      />
    </>
  );
}
