"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Đăng nhập thất bại");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.9 }}
      className="max-w-md mx-auto mt-10"
    >
      <div className="text-center mb-8">
        <div className="font-mono text-[10px] tracking-[0.4em] text-gold-300/70 mb-3">
          ◉ TRUY CẬP HỆ THỐNG
        </div>
        <h1 className="font-display text-4xl text-gradient-heritage">
          Đăng nhập
        </h1>
        <p className="mt-2 text-white/50 text-sm">
          Xác thực để chỉnh sửa nhánh phả hệ của bạn
        </p>
      </div>

      <div className="glass-strong rounded-2xl p-6 sm:p-8 grain relative">
        {err && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 rounded-lg bg-rose-base/15 border border-rose-base/30 text-rose-glow text-sm"
            >
              {err}
            </motion.div>
          )}

          <label className="block mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/70 uppercase block mb-2">
              EMAIL
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hung@example.com"
              autoComplete="email"
            />
          </label>
          <label className="block mb-6">
            <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/70 uppercase block mb-2">
              MẬT KHẨU
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </label>

          <button
            onClick={onSubmit}
            disabled={loading}
            data-cursor-hover
            className="magnetic-button w-full py-3 rounded-xl font-semibold text-white tracking-wider text-sm uppercase disabled:opacity-50 disabled:cursor-wait"
          >
            {loading ? "Đang xác thực…" : "Đăng nhập →"}
          </button>

          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 mb-3">
              ▸ TÀI KHOẢN MẪU (mật khẩu: <code className="text-gold-300">secret</code>)
            </div>
            <ul className="space-y-1 text-[12px] text-white/60">
              <SampleAcc email="hung@example.com" desc="sửa nhánh ông Hùng" />
              <SampleAcc email="lan@example.com" desc="sửa nhánh bà Lan" />
              <SampleAcc email="tai@example.com" desc="sửa nhánh anh Tài" />
            <SampleAcc email="admin@example.com" desc="admin — sửa tất cả" />
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function SampleAcc({ email, desc }: { email: string; desc: string }) {
  return (
    <li className="flex items-center justify-between gap-3 font-mono">
      <code className="text-cyan-glow">{email}</code>
      <span className="text-white/40 text-[11px]">{desc}</span>
    </li>
  );
}
