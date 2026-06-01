"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Đã chạy trong session này → không cần show lại
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("loaderShown") === "1"
    ) {
      setShow(false);
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem("loaderShown", "1");
    }
    const t = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050010]"
        >
          <div className="relative">
            {/* Glow background */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0.6 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(167,139,250,0.4), rgba(34,211,238,0.2), transparent 70%)",
              }}
            />

            {/* SVG tree drawing */}
            <svg
              width="180"
              height="200"
              viewBox="0 0 180 200"
              fill="none"
              className="relative z-10"
            >
              <defs>
                <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>
                <filter id="treeGlow">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Root node */}
              <motion.circle
                cx="90"
                cy="170"
                r="6"
                fill="url(#treeGrad)"
                filter="url(#treeGlow)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              />
              {/* Trunk */}
              <motion.path
                d="M 90 170 L 90 110"
                stroke="url(#treeGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#treeGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              {/* Two main branches */}
              <motion.path
                d="M 90 110 L 50 70"
                stroke="url(#treeGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#treeGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              />
              <motion.path
                d="M 90 110 L 130 70"
                stroke="url(#treeGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#treeGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              />
              {/* Sub branches */}
              <motion.path
                d="M 50 70 L 25 40"
                stroke="url(#treeGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.65 }}
              />
              <motion.path
                d="M 50 70 L 65 30"
                stroke="url(#treeGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              />
              <motion.path
                d="M 130 70 L 115 30"
                stroke="url(#treeGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.65 }}
              />
              <motion.path
                d="M 130 70 L 155 40"
                stroke="url(#treeGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              />
              {/* Leaf nodes */}
              {[
                { cx: 25, cy: 40, d: 0.85 },
                { cx: 65, cy: 30, d: 0.9 },
                { cx: 115, cy: 30, d: 0.85 },
                { cx: 155, cy: 40, d: 0.9 },
                { cx: 50, cy: 70, d: 0.75 },
                { cx: 130, cy: 70, d: 0.75 },
                { cx: 90, cy: 110, d: 0.55 },
              ].map((n, i) => (
                <motion.circle
                  key={i}
                  cx={n.cx}
                  cy={n.cy}
                  r="3.5"
                  fill="url(#treeGrad)"
                  filter="url(#treeGlow)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: n.d, type: "spring", stiffness: 200 }}
                />
              ))}
            </svg>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="text-center mt-6 font-display text-xl tracking-[0.3em] text-gradient-heritage"
            >
              GIA PHẢ
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.95, duration: 0.5 }}
              className="text-center mt-1 font-mono text-[10px] tracking-[0.2em] text-violet-glow"
            >
              KẾT NỐI THẾ HỆ
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
