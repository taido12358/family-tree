"use client";

import { useEffect, useRef } from "react";

/**
 * Background tổng hợp:
 *  - 3 aurora orbs blur lớn xoay chậm (CSS)
 *  - Canvas particle field (sao bay nhỏ + lớn)
 *  - Grain noise overlay (CSS background-image)
 *  - Mouse spotlight follow cursor
 */
export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface Star {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      a: number;
      tw: number; // twinkle phase
    }

    let stars: Star[] = [];

    const init = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);

      const count = Math.min(
        140,
        Math.floor((window.innerWidth * window.innerHeight) / 12000)
      );
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        vy: Math.random() * 0.15 + 0.02,
        vx: (Math.random() - 0.5) * 0.05,
        a: Math.random() * 0.6 + 0.3,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of stars) {
        s.y += s.vy;
        s.x += s.vx;
        s.tw += 0.03;
        if (s.y > window.innerHeight + 5) {
          s.y = -5;
          s.x = Math.random() * window.innerWidth;
        }
        if (s.x < -5) s.x = window.innerWidth + 5;
        if (s.x > window.innerWidth + 5) s.x = -5;

        const tw = (Math.sin(s.tw) + 1) / 2; // 0..1
        const alpha = s.a * (0.5 + tw * 0.5);

        // Outer glow for larger stars
        if (s.r > 1) {
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
          grad.addColorStop(0, `rgba(167, 139, 250, ${alpha * 0.5})`);
          grad.addColorStop(1, "rgba(167, 139, 250, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${230 + tw * 25}, ${220}, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    init();
    draw();

    const onResize = () => {
      cancelAnimationFrame(raf);
      init();
      draw();
    };
    window.addEventListener("resize", onResize);

    const onMove = (e: MouseEvent) => {
      if (spotRef.current) {
        spotRef.current.style.background = `radial-gradient(circle 400px at ${e.clientX}px ${e.clientY}px, rgba(167, 139, 250, 0.12), transparent 70%)`;
      }
    };
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050010] via-[#0a0118] to-[#10042a]" />

      {/* aurora orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-glow opacity-[0.18] blur-[120px] animate-[float_15s_ease-in-out_infinite]" />
      <div
        className="absolute top-[10%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-cyan-glow opacity-[0.12] blur-[120px] animate-[float_18s_ease-in-out_infinite]"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute bottom-[-20%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-rose-glow opacity-[0.10] blur-[140px] animate-[float_20s_ease-in-out_infinite]"
        style={{ animationDelay: "-6s" }}
      />

      {/* particles */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* spotlight */}
      <div ref={spotRef} className="absolute inset-0" />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(5,0,16,0.7) 100%)",
        }}
      />

      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
