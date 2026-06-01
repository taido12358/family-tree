"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import Avatar from "./Avatar";
import type { Member } from "@/lib/types";

export interface MemberNodeData {
  member: Member;
  onDelete?: (member: Member) => void;
  [key: string]: unknown;
}

const ACCENT: Record<string, string> = {
  male: "#22d3ee", // cyan
  female: "#f9a8d4", // rose
  other: "#a78bfa", // violet
};

/**
 * Node tuỳ biến cho trình dựng cây.
 * Handle:
 *  - Top    (target, id="parent") — nhận cha/mẹ kéo xuống.
 *  - Bottom (source, id="child")  — kéo xuống node con để node này làm cha/mẹ.
 *  - Right  (source, id="spouse") / Left (target, id="spouse") — nối vợ/chồng.
 */
export default function MemberNode({ data, selected }: NodeProps) {
  const { member, onDelete } = data as MemberNodeData;
  const accent = ACCENT[member.gender] ?? ACCENT.other;

  const years =
    (member.birthYear ?? "?") +
    (member.deathYear != null ? ` – ${member.deathYear}` : "");

  const handleBase: React.CSSProperties = {
    width: 11,
    height: 11,
    border: "2px solid rgba(5,0,16,0.9)",
  };

  return (
    <div
      className="relative rounded-xl glass-strong px-3 py-2 w-[180px] select-none"
      style={{
        border: `1px solid ${accent}`,
        boxShadow: selected
          ? `0 0 0 2px ${accent}, 0 0 22px ${accent}88`
          : `0 0 12px ${accent}44`,
      }}
    >
      {/* Cha/mẹ vào đỉnh */}
      <Handle
        type="target"
        position={Position.Top}
        id="parent"
        title="Kéo cha/mẹ vào đây"
        style={{ ...handleBase, background: "#fde68a" }}
      />
      {/* Vợ/chồng — phải (nguồn) / trái (đích) */}
      <Handle
        type="source"
        position={Position.Right}
        id="spouse"
        title="Kéo sang người kia để nối vợ/chồng"
        style={{ ...handleBase, background: "#f9a8d4" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="spouse"
        title="Điểm nối vợ/chồng"
        style={{ ...handleBase, background: "#f9a8d4" }}
      />

      <div className="flex items-center gap-2.5">
        <Avatar
          member={member}
          size={36}
          style={{ boxShadow: `inset 0 0 0 2px rgba(5,0,16,0.9)` }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="font-display text-[13px] font-semibold leading-tight truncate"
            title={member.name}
          >
            {member.name}
          </div>
          <div className="font-mono text-[10px] text-violet-glow/70 tracking-wide">
            {years}
          </div>
        </div>
      </div>

      {/* Nút xoá — chỉ hiện khi node được chọn */}
      {selected && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(member);
          }}
          aria-label={`Xoá ${member.name}`}
          title="Xoá thành viên"
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-base/80 hover:bg-rose-base text-white text-[11px] leading-none flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.6)] z-10 nodrag"
        >
          ✕
        </button>
      )}

      {/* Con đi ra từ đáy */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="child"
        title="Kéo xuống con để làm cha/mẹ"
        style={{ ...handleBase, background: "#a78bfa" }}
      />
    </div>
  );
}
