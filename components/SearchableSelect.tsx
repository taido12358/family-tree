"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Tìm kiếm...",
  emptyLabel = "— không —",
}: {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const visible = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const pick = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 hover:border-violet-glow/40 transition-colors text-left"
      >
        <span className={value ? "text-white" : "text-white/40"}>
          {selected?.label ?? emptyLabel}
        </span>
        <span className="text-white/30 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden"
          style={{
            background: "rgba(8,4,25,0.98)",
            border: "1px solid rgba(167,139,250,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-white/30 text-xs shrink-0">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  setQuery("");
                }
                if (e.key === "Enter" && visible.length === 1)
                  pick(visible[0].value);
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-white/30 hover:text-white/60 text-xs transition shrink-0"
              >
                ✕
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => pick("")}
              className={`w-full text-left px-3 py-2.5 text-sm transition hover:bg-white/5 ${
                !value ? "text-violet-glow" : "text-white/40"
              }`}
            >
              {emptyLabel}
            </button>
            {visible.length === 0 ? (
              <div className="px-3 py-3 text-sm text-white/30 italic text-center">
                Không tìm thấy kết quả
              </div>
            ) : (
              visible.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pick(o.value)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition hover:bg-white/5 ${
                    value === o.value
                      ? "text-violet-glow bg-violet-base/10"
                      : "text-white/80"
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
