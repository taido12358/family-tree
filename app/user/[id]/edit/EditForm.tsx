"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Member } from "@/lib/types";
import Avatar from "@/components/Avatar";
import SearchableSelect from "@/components/SearchableSelect";

export default function EditForm({
  member,
  allMembers,
  isAdmin = false,
}: {
  member: Member;
  allMembers: Member[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: member.name,
    gender: member.gender,
    birthYear: member.birthYear?.toString() ?? "",
    deathYear: member.deathYear?.toString() ?? "",
    birthPlace: member.birthPlace,
    occupation: member.occupation,
    biography: member.biography,
    fatherId: member.fatherId ?? "",
    motherId: member.motherId ?? "",
  });
  const [spouseIds, setSpouseIds] = useState<string[]>([...member.spouseIds]);
  const [spouseSearch, setSpouseSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(member.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const onDelete = async () => {
    setSaving(true);
    const res = await fetch(`/api/user/${member.id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: data.error ?? "Xoá thất bại" });
      setConfirmDelete(false);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar(file);
    if (e.target) e.target.value = "";
  };

  const uploadAvatar = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "err", text: "Ảnh quá lớn (tối đa 5MB)." });
      return;
    }
    setUploadingAvatar(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/members/${member.id}/avatar`, {
      method: "POST",
      body: fd,
    });
    setUploadingAvatar(false);
    if (res.ok) {
      const data = await res.json();
      setCurrentAvatarUrl(data.avatarUrl);
      setMsg({ type: "ok", text: "✓ Đã cập nhật ảnh đại diện." });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: data.error ?? "Upload thất bại" });
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    const res = await fetch(`/api/admin/members/${member.id}/avatar`, {
      method: "DELETE",
    });
    setUploadingAvatar(false);
    if (res.ok) {
      setCurrentAvatarUrl(null);
      setMsg({ type: "ok", text: "Đã xoá ảnh đại diện. Hiển thị gradient initials lại." });
      router.refresh();
    }
  };

  const others = allMembers.filter((m) => m.id !== member.id);
  const possibleFathers = others.filter((m) => m.gender !== "female");
  const possibleMothers = others.filter((m) => m.gender !== "male");

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleSpouse = (id: string) => {
    setSpouseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clientValidate = (): string | null => {
    if (!form.name.trim()) return "Họ tên không được để trống.";
    if (form.fatherId === member.id) return "Không thể tự đặt mình làm bố.";
    if (form.motherId === member.id) return "Không thể tự đặt mình làm mẹ.";
    if (form.fatherId && form.motherId && form.fatherId === form.motherId)
      return "Bố và mẹ không thể là cùng một người.";
    if (spouseIds.includes(member.id))
      return "Không thể tự đặt mình là vợ/chồng.";
    if (form.fatherId && spouseIds.includes(form.fatherId))
      return "Bố không thể đồng thời là vợ/chồng.";
    if (form.motherId && spouseIds.includes(form.motherId))
      return "Mẹ không thể đồng thời là vợ/chồng.";
    const by = form.birthYear ? parseInt(form.birthYear, 10) : null;
    const dy = form.deathYear ? parseInt(form.deathYear, 10) : null;
    if (by != null && dy != null && dy < by)
      return "Năm mất phải bằng hoặc sau năm sinh.";
    return null;
  };

  const save = async () => {
    setMsg(null);
    const err = clientValidate();
    if (err) {
      setMsg({ type: "err", text: err });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      gender: form.gender,
      birthYear: form.birthYear ? parseInt(form.birthYear, 10) : null,
      deathYear: form.deathYear ? parseInt(form.deathYear, 10) : null,
      birthPlace: form.birthPlace,
      occupation: form.occupation,
      biography: form.biography,
      fatherId: form.fatherId || null,
      motherId: form.motherId || null,
      spouseIds: spouseIds,
    };
    const res = await fetch(`/api/user/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "✓ Đã lưu thay đổi." });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: data.error ?? "Lỗi khi lưu" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.9 }}
      className="max-w-3xl mx-auto"
    >
      <Link
        href={`/user/${member.id}`}
        className="inline-flex items-center gap-2 mb-6 text-sm text-violet-glow/70 hover:text-violet-glow transition-colors"
      >
        ← Quay lại trang chi tiết
      </Link>

      <div className="glass-strong rounded-3xl p-6 sm:p-8 grain relative overflow-hidden">
        <div className="font-mono text-[10px] tracking-[0.3em] text-gold-300/70 mb-2">
          ✎ CHỈNH SỬA HỒ SƠ
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-gradient-heritage mb-6">
          {member.name}
        </h1>

        {msg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-5 p-3 rounded-lg border text-sm whitespace-pre-line ${
              msg.type === "ok"
                ? "bg-cyan-base/10 border-cyan-base/30 text-cyan-glow"
                : "bg-rose-base/10 border-rose-base/30 text-rose-glow"
            }`}
          >
            {msg.text}
          </motion.div>
        )}

        <Section title="Thông tin cơ bản">
          <Field label="Họ tên">
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Giới tính">
              <select
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </Field>
            <Field label="Quê quán">
              <input
                value={form.birthPlace}
                onChange={(e) => update("birthPlace", e.target.value)}
              />
            </Field>
            <Field label="Năm sinh">
              <input
                type="number"
                value={form.birthYear}
                onChange={(e) => update("birthYear", e.target.value)}
              />
            </Field>
            <Field label="Năm mất (để trống nếu còn sống)">
              <input
                type="number"
                value={form.deathYear}
                onChange={(e) => update("deathYear", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Nghề nghiệp">
                <input
                  value={form.occupation}
                  onChange={(e) => update("occupation", e.target.value)}
                />
              </Field>
            </div>
          </div>
          <Field label="Tiểu sử">
            <textarea
              value={form.biography}
              onChange={(e) => update("biography", e.target.value)}
              rows={5}
            />
          </Field>
        </Section>

        {isAdmin && (
          <Section title="Ảnh đại diện (admin only)">
            <div className="flex items-start gap-5">
              <Avatar
                member={{
                  id: member.id,
                  name: member.name,
                  avatarUrl: currentAvatarUrl,
                }}
                size={96}
                style={{
                  boxShadow:
                    "inset 0 0 0 2px rgba(5,0,16,0.95), 0 0 20px rgba(167,139,250,0.4)",
                }}
              />
              <div className="flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onPickFile}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    data-cursor-hover
                    type="button"
                    className="magnetic-button px-4 py-2 rounded-full text-xs font-semibold text-white tracking-wide disabled:opacity-50"
                  >
                    {uploadingAvatar
                      ? "Đang upload…"
                      : currentAvatarUrl
                      ? "📷 Đổi ảnh"
                      : "📷 Tải ảnh lên"}
                  </button>
                  {currentAvatarUrl && (
                    <button
                      onClick={removeAvatar}
                      disabled={uploadingAvatar}
                      type="button"
                      className="px-3 py-2 rounded-full bg-rose-base/15 hover:bg-rose-base/30 border border-rose-base/30 text-rose-glow text-xs font-medium transition disabled:opacity-50"
                    >
                      Xoá ảnh
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-white/40 leading-relaxed">
                  JPG/PNG/WEBP/GIF, tối đa 5MB. Ảnh được lưu vào{" "}
                  <code className="text-violet-glow/60">
                    public/uploads/avatar/{member.id}.[ext]
                  </code>
                  . Nếu không có ảnh, hệ thống dùng gradient initials tự sinh.
                </p>
              </div>
            </div>
          </Section>
        )}

        <Section title="Quan hệ huyết thống">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Bố">
              <SearchableSelect
                value={form.fatherId}
                onChange={(v) => update("fatherId", v)}
                options={possibleFathers.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${m.birthYear ?? "?"})`,
                }))}
                placeholder="Tìm tên bố..."
              />
            </Field>
            <Field label="Mẹ">
              <SearchableSelect
                value={form.motherId}
                onChange={(v) => update("motherId", v)}
                options={possibleMothers.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${m.birthYear ?? "?"})`,
                }))}
                placeholder="Tìm tên mẹ..."
              />
            </Field>
          </div>
        </Section>

        <Section title="Vợ / Chồng">
          <div className="glass rounded-xl overflow-hidden">
            {others.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-white/30 text-xs shrink-0">🔍</span>
                <input
                  type="text"
                  value={spouseSearch}
                  onChange={(e) => setSpouseSearch(e.target.value)}
                  placeholder="Tìm tên vợ/chồng..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
                {spouseSearch && (
                  <button
                    type="button"
                    onClick={() => setSpouseSearch("")}
                    className="text-white/30 hover:text-white/60 text-xs transition shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
            <div className="p-3 max-h-64 overflow-y-auto">
              {others.length === 0 ? (
                <span className="text-white/40 text-sm italic">
                  Không có thành viên khác.
                </span>
              ) : (() => {
                const visible = spouseSearch
                  ? others.filter((m) =>
                      m.name.toLowerCase().includes(spouseSearch.toLowerCase())
                    )
                  : others;
                return visible.length === 0 ? (
                  <span className="text-white/30 text-sm italic">
                    Không tìm thấy &ldquo;{spouseSearch}&rdquo;.
                  </span>
                ) : (
                  <div className="space-y-1">
                    {visible.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={spouseIds.includes(m.id)}
                          onChange={() => toggleSpouse(m.id)}
                          className="w-4 h-4 accent-violet-glow"
                          style={{ width: 16, height: 16 }}
                        />
                        <span className="font-medium text-sm">{m.name}</span>
                        <span className="text-white/40 text-xs font-mono">
                          {m.gender === "male"
                            ? "♂"
                            : m.gender === "female"
                            ? "♀"
                            : "—"}{" "}
                          · {m.birthYear ?? "?"}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            Khi tích chọn, hệ thống sẽ tự đồng bộ hai chiều: người được chọn cũng
            sẽ có bạn trong danh sách vợ/chồng của họ.
          </p>
        </Section>

        <div className="mt-8 flex flex-wrap gap-3 items-center">
          <button
            onClick={save}
            disabled={saving}
            data-cursor-hover
            className="magnetic-button px-6 py-3 rounded-full text-sm font-semibold text-white tracking-wider uppercase disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : "💾 Lưu thay đổi"}
          </button>
          <Link
            href={`/user/${member.id}`}
            className="px-5 py-2.5 rounded-full glass text-sm hover:bg-white/10 transition"
          >
            Hủy
          </Link>
          {isAdmin && (
            <button
              onClick={() => setConfirmDelete(true)}
              data-cursor-hover
              className="ml-auto px-4 py-2 rounded-full bg-rose-base/15 hover:bg-rose-base/30 border border-rose-base/30 text-rose-glow text-xs font-semibold transition"
            >
              🗑 Xoá thành viên
            </button>
          )}
        </div>
      </div>

      {/* Modal xác nhận xoá */}
      {confirmDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050010]/70 backdrop-blur-sm"
          onClick={() => setConfirmDelete(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 max-w-md w-full grain relative border-rose-base/30"
            style={{ borderWidth: 1 }}
          >
            <div className="font-mono text-[10px] tracking-[0.3em] text-rose-glow/70 mb-2">
              ⚠ XÁC NHẬN XOÁ
            </div>
            <h3 className="font-display text-2xl text-rose-glow mb-3">
              Xoá &ldquo;{member.name}&rdquo;?
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Hành động này KHÔNG THỂ HOÀN TÁC. Mọi tham chiếu (con cái, vợ/chồng)
              sẽ tự được dọn về null.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
                className="px-4 py-2 rounded-full glass text-sm hover:bg-white/10 transition"
              >
                Huỷ
              </button>
              <button
                onClick={onDelete}
                disabled={saving}
                className="px-4 py-2 rounded-full bg-rose-base/30 hover:bg-rose-base/50 border border-rose-base/50 text-rose-glow text-sm font-semibold transition disabled:opacity-50"
              >
                {saving ? "Đang xoá..." : "Xoá vĩnh viễn"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="font-mono text-[10px] tracking-[0.3em] text-violet-glow/70 mb-3 pb-2 border-b border-white/5">
        ▸ {title.toUpperCase()}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.15em] text-violet-glow/60 uppercase block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
