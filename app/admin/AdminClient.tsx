"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Member } from "@/lib/types";
import Avatar from "@/components/Avatar";

type SortKey = "name" | "birthYear" | "gender";
type SortDir = "asc" | "desc";

export default function AdminClient({ members }: { members: Member[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("birthYear");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = members.length;
    const alive = members.filter((m) => m.deathYear == null).length;
    const deceased = total - alive;
    const males = members.filter((m) => m.gender === "male").length;
    const females = members.filter((m) => m.gender === "female").length;
    const withBirth = members.filter((m) => m.birthYear != null);
    const oldestBy =
      withBirth.length > 0
        ? Math.min(...withBirth.map((m) => m.birthYear as number))
        : null;
    const youngestBy =
      withBirth.length > 0
        ? Math.max(...withBirth.map((m) => m.birthYear as number))
        : null;
    return { total, alive, deceased, males, females, oldestBy, youngestBy };
  }, [members]);

  const filtered = useMemo(() => {
    let arr = [...members];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.birthPlace.toLowerCase().includes(q) ||
          m.occupation.toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortKey === "name") {
        va = a.name;
        vb = b.name;
      } else if (sortKey === "birthYear") {
        va = a.birthYear ?? 9999;
        vb = b.birthYear ?? 9999;
      } else {
        va = a.gender;
        vb = b.gender;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [members, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const onDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    const res = await fetch(`/api/user/${confirmDelete.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setToast({
        type: "ok",
        text: `Đã xoá "${confirmDelete.name}". ${
          data.affectedMembers?.length
            ? `${data.affectedMembers.length} thành viên khác bị mất tham chiếu (đã tự dọn).`
            : ""
        }`,
      });
      setConfirmDelete(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setToast({ type: "err", text: data.error ?? "Xoá thất bại" });
    }
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="font-mono text-[10px] tracking-[0.4em] text-gold-300/70 mb-2">
            ◆ ADMIN PANEL
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-gradient-heritage">
            Quản trị thành viên
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            href="/admin/builder"
            data-cursor-hover
            className="px-5 py-2.5 rounded-full glass text-sm font-semibold text-violet-glow hover:bg-violet-base/20 transition whitespace-nowrap"
          >
            ⊹ Trình dựng cây
          </Link>
          <Link
            href="/admin/new"
            data-cursor-hover
            className="magnetic-button px-5 py-2.5 rounded-full text-sm font-semibold text-white tracking-wide whitespace-nowrap"
          >
            ＋ Thêm thành viên
          </Link>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-lg border text-sm ${
              toast.type === "ok"
                ? "bg-cyan-base/10 border-cyan-base/30 text-cyan-glow"
                : "bg-rose-base/10 border-rose-base/30 text-rose-glow"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng" value={stats.total} accent="violet" />
        <StatCard label="Còn sống" value={stats.alive} accent="cyan" />
        <StatCard label="Đã mất" value={stats.deceased} accent="gold" />
        <StatCard
          label="Nam ♂ / Nữ ♀"
          value={`${stats.males}/${stats.females}`}
          accent="rose"
          small
        />
      </div>

      {/* Search + sort */}
      <div className="glass rounded-2xl p-4 mb-4 flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Tìm theo tên, quê, nghề, ID..."
          className="flex-1 min-w-[200px]"
        />
        <div className="flex gap-1.5 text-xs">
          <SortBtn
            active={sortKey === "name"}
            dir={sortDir}
            onClick={() => toggleSort("name")}
          >
            Tên
          </SortBtn>
          <SortBtn
            active={sortKey === "birthYear"}
            dir={sortDir}
            onClick={() => toggleSort("birthYear")}
          >
            Năm sinh
          </SortBtn>
          <SortBtn
            active={sortKey === "gender"}
            dir={sortDir}
            onClick={() => toggleSort("gender")}
          >
            Giới tính
          </SortBtn>
        </div>
      </div>

      {/* Table */}
      <div className="glass-strong rounded-2xl overflow-hidden grain relative">
        {/* Header row */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-3 border-b border-white/5 font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase">
          <div className="w-10">Avatar</div>
          <div>Họ tên / ID</div>
          <div className="w-20 text-center">Giới tính</div>
          <div className="w-28 text-center">Sinh — Mất</div>
          <div className="w-28 text-center">Quê quán</div>
          <div className="w-32 text-center">Hành động</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-white/40 italic">
            {search
              ? `Không tìm thấy thành viên khớp với "${search}".`
              : "Chưa có thành viên nào."}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-3 items-center hover:bg-white/[0.03] transition group"
              >
                {/* Avatar */}
                <Avatar
                  member={m}
                  size={40}
                  style={{
                    boxShadow: "inset 0 0 0 2px rgba(5,0,16,0.95)",
                  }}
                />

                {/* Name + meta */}
                <div className="min-w-0">
                  <Link
                    href={`/user/${m.id}`}
                    className="font-display text-[15px] font-semibold hover:text-gold-300 transition-colors block truncate"
                  >
                    {m.name}
                  </Link>
                  <div className="font-mono text-[10px] text-violet-glow/50 truncate">
                    {m.id} · {m.occupation || "—"}
                  </div>
                </div>

                {/* Gender */}
                <div className="hidden md:block w-20 text-center text-sm text-white/70">
                  {m.gender === "male"
                    ? "♂ Nam"
                    : m.gender === "female"
                    ? "♀ Nữ"
                    : "—"}
                </div>

                {/* Years */}
                <div className="hidden md:block w-28 text-center font-mono text-xs text-white/60">
                  {m.birthYear ?? "?"}
                  {m.deathYear != null ? ` – ${m.deathYear}` : " – nay"}
                </div>

                {/* Place */}
                <div className="hidden md:block w-28 text-center text-xs text-white/50 truncate">
                  {m.birthPlace || "—"}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 justify-end col-start-3 md:col-auto">
                  <Link
                    href={`/user/${m.id}/edit`}
                    data-cursor-hover
                    className="px-2.5 py-1.5 rounded-lg glass text-xs hover:bg-violet-base/20 hover:text-violet-glow transition"
                    title="Sửa"
                    aria-label={`Sửa ${m.name}`}
                  >
                    ✎
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(m)}
                    data-cursor-hover
                    className="px-2.5 py-1.5 rounded-lg glass text-xs text-rose-glow/70 hover:text-rose-glow hover:bg-rose-base/20 transition"
                    title="Xoá"
                    aria-label={`Xoá ${m.name}`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-white/40 text-center">
        Hiển thị {filtered.length}/{members.length} thành viên
      </p>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDelete && (
          <DeleteModal
            member={confirmDelete}
            members={members}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={onDelete}
            busy={busy}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: number | string;
  accent: "violet" | "cyan" | "gold" | "rose";
  small?: boolean;
}) {
  const colors = {
    violet: "text-violet-glow",
    cyan: "text-cyan-glow",
    gold: "text-gold-300",
    rose: "text-rose-glow",
  };
  return (
    <div className="glass rounded-xl p-4 grain relative overflow-hidden">
      <div className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase mb-1">
        {label}
      </div>
      <div
        className={`font-display ${
          small ? "text-2xl" : "text-3xl"
        } font-bold ${colors[accent]}`}
      >
        {value}
      </div>
    </div>
  );
}

function SortBtn({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      data-cursor-hover
      className={`px-2.5 py-1.5 rounded-lg transition font-mono text-[11px] tracking-wide ${
        active
          ? "bg-violet-base/20 text-violet-glow"
          : "glass hover:bg-white/5 text-white/60"
      }`}
    >
      {children} {active && (dir === "asc" ? "↑" : "↓")}
    </button>
  );
}

function DeleteModal({
  member,
  members,
  onCancel,
  onConfirm,
  busy,
}: {
  member: Member;
  members: Member[];
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  // Đếm references
  const childrenCount = members.filter(
    (m) => m.fatherId === member.id || m.motherId === member.id
  ).length;
  const spousesCount = member.spouseIds.length;

  // Đóng bằng phím Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050010]/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Xác nhận xoá ${member.name}`}
        className="glass-strong rounded-2xl p-6 max-w-md w-full grain relative border-rose-base/30"
        style={{ borderWidth: 1 }}
      >
        <div className="font-mono text-[10px] tracking-[0.3em] text-rose-glow/70 mb-2">
          ⚠ XÁC NHẬN XOÁ
        </div>
        <h3 className="font-display text-2xl text-rose-glow mb-3">
          Xoá &ldquo;{member.name}&rdquo;?
        </h3>
        <div className="text-sm text-white/70 mb-4 space-y-1.5">
          <p>Hành động này KHÔNG THỂ HOÀN TÁC. Khi xoá:</p>
          {childrenCount > 0 && (
            <p className="text-gold-300">
              ▸ <strong>{childrenCount} con/cháu</strong> sẽ bị mất tham chiếu
              bố/mẹ (sẽ tự chuyển về null).
            </p>
          )}
          {spousesCount > 0 && (
            <p className="text-gold-300">
              ▸ <strong>{spousesCount} vợ/chồng</strong> sẽ tự được bỏ liên kết.
            </p>
          )}
          {childrenCount === 0 && spousesCount === 0 && (
            <p className="text-white/50 italic">
              Không có thành viên nào tham chiếu tới người này.
            </p>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-full glass text-sm hover:bg-white/10 transition"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded-full bg-rose-base/30 hover:bg-rose-base/50 border border-rose-base/50 text-rose-glow text-sm font-semibold transition disabled:opacity-50"
          >
            {busy ? "Đang xoá..." : "Xoá vĩnh viễn"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
