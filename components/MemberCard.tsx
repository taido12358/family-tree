"use client";

import { motion } from "framer-motion";
import type { Member } from "@/lib/types";
import Avatar from "./Avatar";
import clsx from "clsx";

interface Props {
  member: Member;
  selected?: boolean;
  onClick?: () => void;
  showExpandHint?: boolean;
  expanded?: boolean;
  size?: "sm" | "md";
}

export default function MemberCard({
  member,
  selected,
  onClick,
  showExpandHint,
  expanded,
  size = "md",
}: Props) {
  const isMale = member.gender === "male";
  const isFemale = member.gender === "female";

  const accent = isMale
    ? "rgba(34,211,238,0.5)" // cyan
    : isFemale
    ? "rgba(244,114,182,0.5)" // pink
    : "rgba(167,139,250,0.5)"; // violet
  const accent2 = isMale
    ? "rgba(34,211,238,0.15)"
    : isFemale
    ? "rgba(244,114,182,0.15)"
    : "rgba(167,139,250,0.15)";

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      data-cursor-hover
      className={clsx(
        "member-card-host relative cursor-pointer group select-none",
        size === "md" ? "min-w-[180px] max-w-[210px]" : "min-w-[150px] max-w-[180px]"
      )}
      style={{
        // Use CSS var for selected glow
        ["--accent" as string]: accent,
        ["--accent2" as string]: accent2,
      }}
    >
      {/* Outer glow when selected */}
      {selected && (
        <motion.div
          layoutId="member-selected-ring"
          className="absolute -inset-1 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, #fde68a, #a78bfa, #67e8f9)",
            filter: "blur(10px)",
            opacity: 0.3,
          }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
        />
      )}

      {/* Card */}
      <div
        className={clsx(
          "relative glass rounded-2xl p-3 transition-all duration-300 grain overflow-hidden",
          "group-hover:shadow-[0_0_30px_rgba(167,139,250,0.4)]"
        )}
        style={{
          borderColor: selected ? "rgba(253, 230, 138, 0.5)" : undefined,
        }}
      >
        {/* Top gradient line */}
        <div
          className="absolute top-0 left-4 right-4 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />

        {/* Avatar with rotating gradient ring */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div
              className="absolute inset-0 rounded-full opacity-30 group-hover:opacity-60 transition-opacity"
              style={{
                background: `conic-gradient(from 0deg, ${accent}, transparent 30%, ${accent} 60%, transparent 90%, ${accent})`,
                animation: "spin 30s linear infinite",
                filter: "blur(2px)",
              }}
            />
            <Avatar
              member={member}
              size={44}
              style={{
                boxShadow: `inset 0 0 0 2px rgba(5,0,16,0.9), 0 0 12px ${accent}`,
              }}
            />
            {member.deathYear != null && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gold-400 flex items-center justify-center text-[8px] text-[#0a0118] font-bold shadow-glow-gold">
                ✧
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={clsx(
                "font-display font-semibold leading-tight truncate",
                size === "md" ? "text-[15px]" : "text-[13px]"
              )}
              title={member.name}
            >
              {member.name}
            </div>
            <div className="font-mono text-[10px] text-violet-glow/70 mt-0.5 tracking-wide">
              {member.birthYear ?? "?"}
              {member.deathYear != null ? ` – ${member.deathYear}` : ""}
            </div>
          </div>
        </div>

        {member.occupation && (
          <div className="mt-2 text-[11px] text-white/50 truncate">
            {member.occupation}
          </div>
        )}

        {showExpandHint && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-center gap-1 text-[10px] font-mono tracking-wider text-violet-glow/80">
            <span>{expanded ? "▲ THU GỌN" : "▼ XEM CON CHÁU"}</span>
          </div>
        )}

        {/* Shine sweep on hover */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
            transform: "translateX(-100%)",
            animation: "shine 1.2s ease-in-out",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shine {
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  );
}
