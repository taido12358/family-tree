"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Member } from "@/lib/types";
import SearchableSelect from "@/components/SearchableSelect";

export default function NewMemberForm({
  allMembers,
}: {
  allMembers: Member[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    gender: "male" as "male" | "female" | "other",
    birthYear: "",
    deathYear: "",
    birthPlace: "",
    occupation: "",
    biography: "",
    fatherId: "",
    motherId: "",
    ownerEmail: "",
  });
  const [spouseIds, setSpouseIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const possibleFathers = allMembers.filter((m) => m.gender !== "female");
  const possibleMothers = allMembers.filter((m) => m.gender !== "male");

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleSpouse = (id: string) => {
    setSpouseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clientValidate = (): string | null => {
    if (!form.name.trim()) return "Họ tên không được để trống.";
    if (form.fatherId && form.motherId && form.fatherId === form.motherId)
      return "Bố và mẹ không thể là cùng một người.";
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
      ownerEmail: form.ownerEmail.trim() || null,
      spouseIds,
    };
    const res = await fetch(`/api/admin/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: data.error ?? "Lỗi khi tạo thành viên" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
      className="max-w-3xl mx-auto"
    >
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 mb-6 text-sm text-violet-glow/70 hover:text-violet-glow transition-colors"
      >
        ← Quay lại trang admin
      </Link>

      <div className="glass-strong rounded-3xl p-6 sm:p-8 grain relative overflow-hidden">
        <div className="font-mono text-[10px] tracking-[0.3em] text-gold-300/70 mb-2">
          ＋ THÊM THÀNH VIÊN MỚI
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-gradient-heritage mb-6">
          Khai sinh nhánh mới
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
          <Field label="Họ tên *">
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              autoFocus
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
                placeholder="VD: Hà Nội"
              />
            </Field>
            <Field label="Năm sinh">
              <input
                type="number"
                value={form.birthYear}
                onChange={(e) => update("birthYear", e.target.value)}
                placeholder="VD: 1980"
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
              rows={4}
              placeholder="Mô tả ngắn về cuộc đời, sự nghiệp..."
            />
          </Field>
          <Field label="Email tài khoản (nếu liên kết user, optional)">
            <input
              type="email"
              value={form.ownerEmail}
              onChange={(e) => update("ownerEmail", e.target.value)}
              placeholder="VD: nguyen@example.com"
            />
          </Field>
        </Section>

        <Section title="Quan hệ huyết thống (tùy chọn)">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Bố">
              <SearchableSelect
                value={form.fatherId}
                onChange={(v) => update("fatherId", v)}
                options={possibleFathers.map((m) => ({
                  value: m.id,
                  label: m.name,
                  sublabel: String(m.birthYear ?? "?"),
                }))}
                allowEmpty
                ariaLabel="Chọn bố"
              />
            </Field>
            <Field label="Mẹ">
              <SearchableSelect
                value={form.motherId}
                onChange={(v) => update("motherId", v)}
                options={possibleMothers.map((m) => ({
                  value: m.id,
                  label: m.name,
                  sublabel: String(m.birthYear ?? "?"),
                }))}
                allowEmpty
                ariaLabel="Chọn mẹ"
              />
            </Field>
          </div>
        </Section>

        <Section title="Vợ / Chồng (tùy chọn)">
          <div className="glass rounded-xl p-3 max-h-72 overflow-y-auto">
            {allMembers.length === 0 ? (
              <span className="text-white/40 text-sm italic">
                Chưa có thành viên nào.
              </span>
            ) : (
              <div className="space-y-1">
                {allMembers.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={spouseIds.includes(m.id)}
                      onChange={() => toggleSpouse(m.id)}
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
            )}
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            Khi tích chọn, hệ thống sẽ tự đồng bộ hai chiều.
          </p>
        </Section>

        <div className="mt-8 flex gap-3 items-center">
          <button
            onClick={save}
            disabled={saving}
            data-cursor-hover
            className="magnetic-button px-6 py-3 rounded-full text-sm font-semibold text-white tracking-wider uppercase disabled:opacity-50"
          >
            {saving ? "Đang tạo…" : "✦ Tạo thành viên"}
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-full glass text-sm hover:bg-white/10 transition"
          >
            Hủy
          </Link>
        </div>
      </div>
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
