"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Member } from "@/lib/types";
import Avatar from "./Avatar";

type Mode = "child" | "spouse" | "father" | "mother";

const MODE_LABEL: Record<Mode, string> = {
  child: "Con",
  spouse: "Vợ / Chồng",
  father: "Bố",
  mother: "Mẹ",
};

const MODE_ICON: Record<Mode, string> = {
  child: "↓",
  spouse: "♥",
  father: "♂",
  mother: "♀",
};

interface Props {
  open: boolean;
  anchor: Member | null;
  members: Member[];
  initialMode?: Mode;
  onClose: () => void;
  onCreated: () => void;
}

export default function QuickAddPanel({
  open,
  anchor,
  members,
  initialMode = "child",
  onClose,
  onCreated,
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [occupation, setOccupation] = useState("");
  const [biography, setBiography] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset state khi mở modal
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      resetForm();
      // Focus tên ngay
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [open, initialMode]);

  // Khi đổi mode bố/mẹ → set giới tính tương ứng
  useEffect(() => {
    if (mode === "father") setGender("male");
    else if (mode === "mother") setGender("female");
  }, [mode]);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const resetForm = () => {
    setName("");
    setBirthYear("");
    setDeathYear("");
    setBirthPlace("");
    setOccupation("");
    setBiography("");
    setAvatarFile(null);
    setAvatarPreview(null);
    setShowMore(false);
    setErr(null);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErr("Ảnh quá lớn (tối đa 5MB)");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  const submit = async (continueAdding: boolean) => {
    if (!anchor) return;
    if (!name.trim()) {
      setErr("Cần điền họ tên");
      nameInputRef.current?.focus();
      return;
    }
    setSaving(true);
    setErr(null);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      gender,
      birthYear: birthYear ? parseInt(birthYear, 10) : null,
      deathYear: deathYear ? parseInt(deathYear, 10) : null,
      birthPlace,
      occupation,
      biography,
    };

    // Xác định liên kết
    if (mode === "child") {
      if (anchor.gender === "male") {
        payload.fatherId = anchor.id;
        // Nếu anchor có đúng 1 vợ → cũng tự set mẹ
        if (anchor.spouseIds.length === 1) {
          payload.motherId = anchor.spouseIds[0];
        }
      } else if (anchor.gender === "female") {
        payload.motherId = anchor.id;
        if (anchor.spouseIds.length === 1) {
          payload.fatherId = anchor.spouseIds[0];
        }
      } else {
        // Anchor là "other" → đặt làm fatherId mặc định
        payload.fatherId = anchor.id;
      }
    } else if (mode === "spouse") {
      payload.spouseIds = [anchor.id];
    }
    // Cho mode "father" / "mother": tạo trước, sau đó PATCH anchor

    try {
      // 1. Tạo thành viên
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Tạo thất bại");
      }
      const { member: newMember } = await res.json();

      // 2. Nếu là Bố/Mẹ → PATCH anchor để liên kết
      if (mode === "father") {
        await fetch(`/api/user/${anchor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fatherId: newMember.id }),
        });
      } else if (mode === "mother") {
        await fetch(`/api/user/${anchor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motherId: newMember.id }),
        });
      }

      // 3. Upload avatar nếu có
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        await fetch(`/api/admin/members/${newMember.id}/avatar`, {
          method: "POST",
          body: fd,
        });
      }

      onCreated();
      setToast(`✓ Đã thêm "${newMember.name}"`);
      setTimeout(() => setToast(null), 2000);

      if (continueAdding) {
        // Reset form, giữ mode + anchor để tiếp tục thêm anh chị em
        resetForm();
        setTimeout(() => nameInputRef.current?.focus(), 50);
      } else {
        onClose();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit(false);
    }
  };

  return (
    <AnimatePresence>
      {open && anchor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#050010]/80 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Thêm thành viên mới"
            className="glass-strong rounded-2xl p-5 sm:p-6 grain relative max-w-md w-full my-auto"
          >
            {/* Header với anchor */}
            <div className="font-mono text-[10px] tracking-[0.3em] text-gold-300/70 mb-2">
              ⊕ THÊM THÀNH VIÊN MỚI
            </div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
              <Avatar member={anchor} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[9px] tracking-[0.15em] text-violet-glow/60">
                  LIÊN KẾT VỚI
                </div>
                <div className="font-display text-base font-semibold truncate">
                  {anchor.name}
                </div>
              </div>
            </div>

            {/* Mode picker */}
            <div className="mb-4">
              <div className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 mb-2">
                QUAN HỆ
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(["child", "spouse", "father", "mother"] as Mode[]).map(
                  (m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      data-cursor-hover
                      className={`px-2 py-2 rounded-lg text-xs font-semibold tracking-wide transition border ${
                        mode === m
                          ? "bg-violet-base/30 border-violet-glow/50 text-violet-glow shadow-[0_0_12px_rgba(167,139,250,0.3)]"
                          : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      <div className="text-base mb-0.5">{MODE_ICON[m]}</div>
                      <div className="text-[10px]">{MODE_LABEL[m]}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Avatar drop */}
            <div className="mb-4 flex items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden cursor-pointer group flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(34,211,238,0.1))",
                  border: "1px dashed rgba(167,139,250,0.4)",
                }}
                data-cursor-hover
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[10px] font-mono text-violet-glow/70 text-center leading-tight">
                    📷<br />
                    <span className="text-[8px]">ẢNH</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-mono">
                  {avatarPreview ? "ĐỔI" : "CHỌN"}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onPickFile}
                className="hidden"
              />
              <div className="flex-1 text-[11px] text-white/40 leading-relaxed">
                {avatarPreview ? (
                  <>
                    Đã chọn ảnh.{" "}
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="text-rose-glow/80 hover:underline"
                    >
                      bỏ
                    </button>
                  </>
                ) : (
                  <>Click để chọn ảnh đại diện (tùy chọn). Có thể thêm sau.</>
                )}
              </div>
            </div>

            {/* Name */}
            <label className="block mb-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
                Họ tên *
              </span>
              <input
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn B"
                disabled={saving}
              />
            </label>

            {/* Gender + Birth year */}
            <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
                  Giới tính
                </span>
                <div className="flex gap-1">
                  {(
                    [
                      ["male", "Nam"],
                      ["female", "Nữ"],
                      ["other", "Khác"],
                    ] as const
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGender(v)}
                      data-cursor-hover
                      disabled={
                        (mode === "father" && v !== "male") ||
                        (mode === "mother" && v !== "female")
                      }
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${
                        gender === v
                          ? "bg-cyan-base/20 border-cyan-glow/50 text-cyan-glow"
                          : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
                  Năm sinh
                </span>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="2000"
                  className="w-24"
                  disabled={saving}
                />
              </label>
            </div>

            {/* Show more toggle */}
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              className="text-[11px] font-mono tracking-wider text-violet-glow/60 hover:text-violet-glow mb-2 transition"
            >
              {showMore ? "▾" : "▸"} {showMore ? "ẨN" : "THÊM"} THÔNG TIN CHI
              TIẾT
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
                          Năm mất
                        </span>
                        <input
                          type="number"
                          value={deathYear}
                          onChange={(e) => setDeathYear(e.target.value)}
                          disabled={saving}
                        />
                      </label>
                      <label className="block">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
                          Quê quán
                        </span>
                        <input
                          value={birthPlace}
                          onChange={(e) => setBirthPlace(e.target.value)}
                          disabled={saving}
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
                        Nghề nghiệp
                      </span>
                      <input
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        disabled={saving}
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
                        Tiểu sử
                      </span>
                      <textarea
                        value={biography}
                        onChange={(e) => setBiography(e.target.value)}
                        rows={2}
                        disabled={saving}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {err && (
              <div className="mt-3 p-2 rounded-lg bg-rose-base/10 border border-rose-base/30 text-rose-glow text-xs whitespace-pre-line">
                {err}
              </div>
            )}

            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-2 rounded-lg bg-cyan-base/10 border border-cyan-base/30 text-cyan-glow text-xs"
              >
                {toast}
              </motion.div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-2 justify-end">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-3 py-2 rounded-full glass text-xs hover:bg-white/10 transition"
              >
                Đóng
              </button>
              <button
                onClick={() => submit(true)}
                disabled={saving}
                data-cursor-hover
                className="px-3 py-2 rounded-full bg-violet-base/20 hover:bg-violet-base/40 border border-violet-glow/30 text-violet-glow text-xs font-semibold transition disabled:opacity-50"
                title="Lưu rồi reset form để thêm thành viên tiếp theo"
              >
                Lưu &amp; thêm tiếp
              </button>
              <button
                onClick={() => submit(false)}
                disabled={saving}
                data-cursor-hover
                className="magnetic-button px-4 py-2 rounded-full text-xs font-semibold text-white tracking-wide disabled:opacity-50"
              >
                {saving ? "Đang lưu…" : "✦ Lưu"}
              </button>
            </div>

            <p className="mt-3 text-[10px] text-white/30 text-center">
              ⌘/Ctrl + Enter để lưu nhanh
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
