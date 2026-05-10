"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateRelation } from "@/lib/kinship";
import type { Member, FamilyData } from "@/lib/types";
import Avatar from "@/components/Avatar";

export default function KinshipClient({
  members,
  initialFrom,
  initialTo,
}: {
  members: Member[];
  initialFrom: string;
  initialTo: string;
}) {
  const [fromId, setFromId] = useState(initialFrom);
  const [toId, setToId] = useState(initialTo);

  const data: FamilyData = useMemo(() => ({ members }), [members]);
  const result = useMemo(() => {
    if (!fromId || !toId) return "";
    return calculateRelation(data, fromId, toId);
  }, [data, fromId, toId]);

  const fromMember = members.find((m) => m.id === fromId);
  const toMember = members.find((m) => m.id === toId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.9 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="font-mono text-[10px] tracking-[0.4em] text-gold-300/70 mb-3">
          ◈ HỆ THỐNG TÌM QUAN HỆ HUYẾT THỐNG
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-gradient-heritage">
          Người này gọi người kia là gì?
        </h1>
        <p className="mt-3 text-white/50 text-sm max-w-xl mx-auto">
          Chọn hai thành viên — hệ thống phân tích tổ tiên chung và trả về cách
          xưng hô tiếng Việt phổ biến nhất.
        </p>
      </div>

      {/* Two-column person picker with connection line */}
      <div className="glass-strong rounded-3xl p-5 sm:p-8 grain relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <PersonPicker
              label="Người A (gọi)"
              members={members}
              value={fromId}
              onChange={setFromId}
              accent="violet"
            />

            {/* Connection line in middle */}
            <div className="flex items-center justify-center">
              <ConnectionLine />
            </div>

            <PersonPicker
              label="Người B (được gọi)"
              members={members}
              value={toId}
              onChange={setToId}
              accent="cyan"
            />
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {fromMember && toMember && result && (
              <motion.div
                key={`${fromId}-${toId}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                className="mt-8 relative"
              >
                <div className="text-center">
                  <div className="font-mono text-[10px] tracking-[0.3em] text-violet-glow/70 mb-2">
                    ▸ KẾT QUẢ PHÂN TÍCH
                  </div>
                  <div className="text-base sm:text-lg text-white/80">
                    <span className="font-display font-semibold text-gold-300">
                      {fromMember.name}
                    </span>{" "}
                    gọi{" "}
                    <span className="font-display font-semibold text-cyan-glow">
                      {toMember.name}
                    </span>{" "}
                    là
                  </div>
                  <motion.div
                    key={result}
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-3 font-display text-3xl sm:text-5xl font-bold text-glow text-gradient-heritage"
                  >
                    {result}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-[11px] text-white/40 leading-relaxed text-center max-w-2xl mx-auto">
            ⚠️ Cách xưng hô tiếng Việt rất phong phú và phụ thuộc vùng miền. Kết
            quả là dạng phổ biến ở miền Bắc, có thể không tuyệt đối với mọi
            trường hợp ngoại lệ (con nuôi, kế tự, vùng miền…).
          </p>
      </div>
    </motion.div>
  );
}

function PersonPicker({
  label,
  members,
  value,
  onChange,
  accent,
}: {
  label: string;
  members: Member[];
  value: string;
  onChange: (v: string) => void;
  accent: "violet" | "cyan";
}) {
  const member = members.find((m) => m.id === value);
  const accentColor =
    accent === "violet" ? "rgba(167,139,250,0.6)" : "rgba(34,211,238,0.6)";
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/70 mb-2 uppercase">
        ◉ {label}
      </div>
      <div className="flex flex-col items-center">
        {member && (
          <motion.div
            key={member.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative mb-3"
          >
            <div
              className="absolute -inset-1.5 rounded-full opacity-40"
              style={{
                background: `conic-gradient(from 0deg, ${accentColor}, transparent 30%, ${accentColor} 60%, transparent 90%)`,
                filter: "blur(4px)",
                animation: "spin 30s linear infinite",
              }}
            />
            <Avatar
              member={member}
              size={80}
              style={{
                boxShadow: `inset 0 0 0 2px rgba(5,0,16,0.95), 0 0 20px ${accentColor}`,
              }}
            />
          </motion.div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.birthYear ?? "?"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConnectionLine() {
  return (
    <svg width="80" height="100" viewBox="0 0 80 100" className="hidden md:block">
      <defs>
        <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#fde68a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.9" />
        </linearGradient>
        <filter id="connGlow">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <motion.path
        d="M 5 50 Q 40 20 75 50"
        stroke="url(#connGrad)"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.path
        d="M 5 50 Q 40 80 75 50"
        stroke="url(#connGrad)"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
      />
      {/* Flowing particles */}
      <motion.circle
        r="2.5"
        fill="#fde68a"
        filter="url(#connGlow)"
        animate={{
          offsetDistance: ["0%", "100%"],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ offsetPath: "path('M 5 50 Q 40 20 75 50')" }}
      />
      <motion.circle
        r="2.5"
        fill="#67e8f9"
        filter="url(#connGlow)"
        animate={{
          offsetDistance: ["0%", "100%"],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
        style={{ offsetPath: "path('M 5 50 Q 40 80 75 50')" }}
      />
      {/* Center label */}
      <text
        x="40"
        y="55"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="8"
        fill="#fde68a"
        opacity="0.7"
      >
        ◉
      </text>
    </svg>
  );
}
