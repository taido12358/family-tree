"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Member } from "@/lib/types";
import Avatar from "@/components/Avatar";

export default function UserDetailView({
  member,
  members,
  editable,
}: {
  member: Member;
  members: Member[];
  editable: boolean;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Link
        href={`/?root=${member.id}`}
        className="inline-flex items-center gap-2 mb-6 text-sm text-violet-glow/70 hover:text-violet-glow transition-colors"
      >
        ← Đặt làm gốc cây phả hệ
      </Link>

      <div className="glass-strong rounded-3xl p-6 sm:p-10 grain relative overflow-hidden">
          {/* Hero with avatar */}
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative shrink-0 mx-auto sm:mx-0"
            >
              <div
                className="absolute -inset-3 rounded-full opacity-40"
                style={{
                  background:
                    "conic-gradient(from 0deg, #fde68a, #a78bfa, #67e8f9, #f472b6, #fde68a)",
                  animation: "spin 35s linear infinite",
                  filter: "blur(10px)",
                }}
              />
              <Avatar
                member={member}
                size={128}
                className="sm:!w-40 sm:!h-40"
                style={{
                  boxShadow:
                    "inset 0 0 0 3px rgba(5,0,16,0.95), 0 0 40px rgba(167,139,250,0.6)",
                }}
              />
            </motion.div>

            <div className="flex-1">
              <div className="font-mono text-[10px] tracking-[0.3em] text-gold-300/70 mb-2">
                ◉ HỒ SƠ THÀNH VIÊN
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-heritage leading-tight">
                {member.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12px] text-violet-glow/80">
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
            </div>
          </div>

          {/* Bio */}
          <section className="mt-8">
            <div className="font-mono text-[10px] tracking-[0.3em] text-violet-glow/70 mb-3">
              ▸ TIỂU SỬ
            </div>
            <p className="text-white/85 leading-relaxed text-[15px]">
              {member.biography || (
                <span className="italic text-white/40">
                  Chưa có tiểu sử cho thành viên này.
                </span>
              )}
            </p>
          </section>

          {/* Relations */}
          <section className="mt-8 grid sm:grid-cols-2 gap-5">
            <RelationCard label="Bố" items={father ? [father] : []} icon="♂" />
            <RelationCard label="Mẹ" items={mother ? [mother] : []} icon="♀" />
            <RelationCard label="Vợ / Chồng" items={spouses} icon="∞" />
            <RelationCard
              label="Con"
              items={children}
              icon="✧"
              full={children.length > 2}
            />
          </section>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            {editable && (
              <Link
                href={`/user/${member.id}/edit`}
                data-cursor-hover
                className="magnetic-button px-5 py-2.5 rounded-full text-sm font-semibold text-white tracking-wide"
              >
                ✏️ Chỉnh sửa hồ sơ
              </Link>
            )}
            <Link
              href={`/kinship?from=${member.id}`}
              data-cursor-hover
              className="px-5 py-2.5 rounded-full glass text-sm font-medium hover:bg-white/10 transition"
            >
              🔗 Tính quan hệ từ người này
            </Link>
          </div>
      </div>
    </motion.div>
  );
}

function RelationCard({
  label,
  items,
  icon,
  full,
}: {
  label: string;
  items: Member[];
  icon: string;
  full?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-4 grain relative overflow-hidden ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/70 uppercase">
          {label}
        </div>
        <span className="text-gold-300/60 text-lg">{icon}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-white/30 text-sm italic">— chưa có dữ liệu —</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((m) => (
            <Link
              key={m.id}
              href={`/user/${m.id}`}
              data-cursor-hover
              className="px-3 py-1.5 rounded-full glass text-xs hover:bg-white/10 transition"
            >
              {m.name}{" "}
              <span className="text-white/30 ml-1">
                ({m.birthYear ?? "?"})
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
