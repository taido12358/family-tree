"use client";

import Image from "next/image";
import { avatarGradient, initialsOf } from "@/lib/avatar";

interface AvatarMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

/**
 * Hiển thị avatar:
 *  - Nếu member.avatarUrl: <img> của ảnh thật
 *  - Nếu không: gradient + initials deterministic từ tên
 *
 * Dùng inline style để consumer có thể override boxShadow, fontSize.
 */
export default function Avatar({
  member,
  size = 44,
  fontSize,
  className = "",
  style,
}: {
  member: AvatarMember;
  size?: number;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const fs = fontSize ?? Math.max(11, Math.round(size * 0.34));
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: fs,
    ...style,
  };

  if (member.avatarUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden ${className}`}
        style={baseStyle}
      >
        <Image
          src={member.avatarUrl}
          alt={member.name}
          fill
          sizes={`${size}px`}
          draggable={false}
          className="object-cover select-none"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full flex items-center justify-center font-display font-bold text-[#0a0118] ${className}`}
      style={{
        ...baseStyle,
        background: avatarGradient(member.name),
      }}
    >
      {initialsOf(member.name)}
    </div>
  );
}
