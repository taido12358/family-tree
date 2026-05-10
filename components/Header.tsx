"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { SessionPayload } from "@/lib/types";

export default function Header({ session }: { session: SessionPayload | null }) {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-40 backdrop-blur-xl bg-[#050010]/60 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-400 via-violet-glow to-cyan-glow opacity-90" />
            <div className="absolute inset-[1px] rounded-lg bg-[#050010]" />
            <span className="relative font-display text-lg font-bold text-gradient-heritage">
              ✧
            </span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-base sm:text-lg font-semibold tracking-wide text-gradient-heritage">
              GIA PHẢ
            </div>
            <div className="font-mono text-[9px] tracking-[0.25em] text-violet-glow/60 uppercase">
              KẾT NỐI THẾ HỆ
            </div>
          </div>
        </Link>

        <nav className="flex gap-1 items-center text-sm flex-wrap">
          <NavLink href="/">Cây phả hệ</NavLink>
          <NavLink href="/kinship">Tìm quan hệ</NavLink>
          {session?.role === "admin" && (
            <NavLink href="/admin">
              <span className="text-gold-300">◆</span> Admin
            </NavLink>
          )}

          {session ? (
            <>
              <span className="ml-2 px-3 py-1.5 glass rounded-full font-mono text-[11px] text-violet-glow/90 hidden sm:flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-pulse" />
                {session.email}
              </span>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-glow/90 hover:text-rose-glow hover:bg-rose-base/10 transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-2 magnetic-button px-4 py-1.5 rounded-full text-xs font-semibold text-white tracking-wide"
              data-cursor-hover
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </motion.header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative px-3 py-1.5 rounded-lg text-[13px] font-medium text-white/70 hover:text-white transition-colors group"
    >
      {children}
      <span className="absolute bottom-0.5 left-3 right-3 h-px bg-gradient-to-r from-transparent via-violet-glow to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
