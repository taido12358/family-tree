"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FamilyTree from "@/components/FamilyTree";
import BioPanel from "@/components/BioPanel";
import type { Member, SessionPayload } from "@/lib/types";

export default function HomeClient({
  members,
  initialRootId,
  initialSelectedId,
  session,
  editPermissions,
}: {
  members: Member[];
  initialRootId: string;
  initialSelectedId: string;
  session: SessionPayload | null;
  editPermissions: Record<string, boolean>;
}) {
  const [rootId, setRootId] = useState(initialRootId);
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  const selected = members.find((m) => m.id === selectedId) ?? null;

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-10 sm:py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.9 }}
          className="font-mono text-[10px] tracking-[0.4em] text-gold-300/70 mb-4"
        >
          ✧ ✧ ✧
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 2.0 }}
          className="font-display text-4xl sm:text-6xl md:text-7xl font-bold text-glow text-gradient-heritage leading-[1.1]"
        >
          Lưu giữ huyết thống
          <br />
          <span className="text-gradient-violet">Kết nối thế hệ</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 2.2 }}
          className="mt-5 text-white/60 text-sm sm:text-base max-w-xl mx-auto"
        >
          Khám phá cây phả hệ bằng giao diện cinematic — mỗi thành viên là một
          nút sáng, mỗi thế hệ là một mạch năng lượng.
        </motion.p>
      </section>

      {/* Root selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.3 }}
        className="glass rounded-2xl p-4 sm:p-5 max-w-2xl mx-auto mb-2"
      >
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/70 uppercase">
            ◉ Chọn người làm gốc cây phả hệ
          </span>
          <select
            value={rootId}
            onChange={(e) => {
              setRootId(e.target.value);
              setSelectedId(e.target.value);
            }}
            className="mt-2"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.birthYear ?? "?"}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-[11px] text-white/40 font-mono leading-relaxed">
          ▸ Nhấn vào mỗi thẻ để xem chi tiết và mở rộng nhánh bố/mẹ phía trên.
          ▸ Cây mở ngược lên — gốc bên dưới, tổ tiên ở trên.
        </p>
      </motion.div>

      {/* Tree */}
      <FamilyTree
        members={members}
        rootId={rootId}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Bio */}
      {selected && (
        <BioPanel
          member={selected}
          members={members}
          session={session}
          canEdit={editPermissions[selected.id] ?? false}
        />
      )}
    </div>
  );
}
