"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Member, SessionPayload } from "@/lib/types";
import { avatarGradient, initialsOf } from "@/lib/avatar";

export default function BioPanel({
  member,
  members,
  session,
  canEdit,
}: {
  member: Member;
  members: Member[];
  session: SessionPayload | null;
  canEdit: boolean;
}) {
  const father = member.fatherId
    ? members.find((m) => m.id === member.fatherId)
    : null;
  const mother = member.motherId
    ? members.find((m) => m.id === member.motherId)
    : null;
  const spouses = member.spouseIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => !!m);
  const children = members.filter(
    (m) => m.fatherId === member.id || m.motherId === member.id
  );

  const lifespan =
    (member.birthYear ?? "?") +
    " — " +
    (member.deathYear == null ? "nay" : String(member.deathYear));

  const generationLabel =
    member.deathYear == null ? "Đang sống" : "Đã qua đời";

  return (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-10 relative"
    >
      <div className="relative glass-strong rounded-3xl p-6 sm:p-8 grain overflow-hidden">
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

        <div className="grid md:grid-cols-[auto_1fr] gap-6">
          {/* Avatar block */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative shrink-0 mx-auto md:mx-0"
          >
            <div
              className="absolute -inset-2 rounded-full opacity-40"
              style={{
                background:
                  "conic-gradient(from 0deg, #fde68a, #a78bfa, #67e8f9, #f472b6, #fde68a)",
                animation: "spin 30s linear infinite",
                filter: "blur(8px)",
              }}
            />
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center font-display text-4xl font-bold text-[#0a0118]"
              style={{
                background: avatarGradient(member.name),
                boxShadow:
                  "inset 0 0 0 3px rgba(5,0,16,0.95), 0 0 30px rgba(167,139,250,0.5)",
              }}
            >
              {initialsOf(member.name)}
            </div>
          </motion.div>

          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gradient-heritage leading-tight">
                {member.name}
              </h2>
              <span
                className={`px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wider ${
                  member.deathYear == null
                    ? "bg-cyan-base/15 text-cyan-glow border border-cyan-base/30"
                    : "bg-gold-400/15 text-gold-300 border border-gold-400/30"
                }`}
              >
                {generationLabel}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 font-mono text-xs text-violet-glow/80">
              <span>
                <span className="text-white/40">SINH—MẤT</span> {lifespan}
              </span>
              {member.birthPlace && (
                <span>
                  <span className="text-white/40">QUÊ</span>{" "}
                  {member.birthPlace}
                </span>
              )}
              {member.occupation && (
                <span>
                  <span className="text-white/40">NGHỀ</span>{" "}
                  {member.occupation}
                </span>
              )}
              <span>
                <span className="text-white/40">GIỚI TÍNH</span>{" "}
                {member.gender === "male"
                  ? "Nam"
                  : member.gender === "female"
                  ? "Nữ"
                  : "—"}
              </span>
            </div>

            <p className="mt-4 text-white/80 leading-relaxed text-[15px]">
              {member.biography || (
                <span className="italic text-white/40">
                  (Chưa có tiểu sử cho thành viên này.)
                </span>
              )}
            </p>

            {/* Relations */}
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <RelationBlock
                label="Bố / Mẹ"
                items={[father, mother].filter((x): x is Member => !!x)}
              />
              <RelationBlock label="Vợ / Chồng" items={spouses} />
              <RelationBlock
                label="Con"
                items={children}
                full={spouses.length === 0 || !!(father || mother)}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-2.5 items-center">
              <Link
                href={`/user/${member.id}`}
                className="px-4 py-2 rounded-full glass text-xs font-medium tracking-wide hover:bg-white/10 transition"
                data-cursor-hover
              >
                Xem trang chi tiết →
              </Link>
              {canEdit && (
                <Link
                  href={`/user/${member.id}/edit`}
                  className="magnetic-button px-4 py-2 rounded-full text-xs font-semibold text-white tracking-wide"
                  data-cursor-hover
                >
                  ✏️ Chỉnh sửa
                </Link>
              )}
              {!session && (
                <Link
                  href="/login"
                  className="text-xs text-violet-glow/60 hover:text-violet-glow underline-offset-4 hover:underline"
                >
                  Đăng nhập để chỉnh sửa
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RelationBlock({
  label,
  items,
  full,
}: {
  label: string;
  items: Member[];
  full?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 mb-1.5">
        {label.toUpperCase()}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((m) => (
          <Link
            key={m.id}
            href={`/user/${m.id}`}
            className="px-2.5 py-1 rounded-full glass text-xs hover:bg-white/10 transition"
            data-cursor-hover
          >
            {m.name}{" "}
            <span className="text-white/30">
              ({m.birthYear ?? "?"})
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
