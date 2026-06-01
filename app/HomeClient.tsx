"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FamilyTree from "@/components/FamilyTree";
import BioPanel from "@/components/BioPanel";
import QuickAddPanel from "@/components/QuickAddPanel";
import SearchableSelect from "@/components/SearchableSelect";
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
  const router = useRouter();
  const [rootId, setRootId] = useState(initialRootId);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [quickAddAnchor, setQuickAddAnchor] = useState<Member | null>(null);

  const isAdmin = session?.role === "admin";
  const selected = members.find((m) => m.id === selectedId) ?? null;

  const onQuickAdd = (member: Member) => {
    setQuickAddAnchor(member);
  };

  const onCreated = () => {
    router.refresh();
  };

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-10 sm:py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="font-mono text-[10px] tracking-[0.4em] text-gold-300/70 mb-4"
        >
          ✧ ✧ ✧
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-4xl sm:text-6xl md:text-7xl font-bold text-glow text-gradient-heritage leading-[1.1]"
        >
          Lưu giữ huyết thống
          <br />
          <span className="text-gradient-violet">Kết nối thế hệ</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass rounded-2xl p-4 sm:p-5 max-w-2xl mx-auto mb-2"
      >
        <div className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/70 uppercase">
            ◉ Chọn ông tổ / bà tổ làm gốc cây phả hệ
          </span>
          <SearchableSelect
            value={rootId}
            onChange={(v) => {
              setRootId(v);
              setSelectedId(v);
            }}
            options={members.map((m) => ({
              value: m.id,
              label: m.name,
              sublabel: String(m.birthYear ?? "?"),
            }))}
            ariaLabel="Chọn gốc cây phả hệ"
            className="mt-2"
          />
        </div>
        <p className="mt-3 text-[11px] text-white/40 font-mono leading-relaxed">
          ▸ Nhấn vào mỗi thẻ để xem chi tiết và mở nhánh con cháu phía dưới.
          ▸ Cây mọc xuống — gốc ở trên, hậu duệ tỏa xuống dưới.
        </p>
      </motion.div>

      {/* Tree */}
      <FamilyTree
        members={members}
        rootId={rootId}
        selectedId={selectedId}
        onSelect={setSelectedId}
        isAdmin={isAdmin}
        onQuickAdd={onQuickAdd}
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

      {/* Quick add modal — admin only */}
      <QuickAddPanel
        open={!!quickAddAnchor}
        anchor={quickAddAnchor}
        members={members}
        onClose={() => setQuickAddAnchor(null)}
        onCreated={onCreated}
      />
    </div>
  );
}
