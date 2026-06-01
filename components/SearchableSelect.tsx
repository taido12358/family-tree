"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import clsx from "clsx";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Thêm dòng "— không —" ở đầu để bỏ chọn (value = "") */
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

interface Row extends SelectOption {
  isEmpty?: boolean;
}

/**
 * Combobox có ô tìm kiếm — thay cho native <select> khi danh sách dài.
 * Thuần React (không thêm dependency), bám theo style input/select toàn cục,
 * hỗ trợ bàn phím (↑/↓/Enter/Esc) và ARIA combobox/listbox.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn…",
  allowEmpty = false,
  emptyLabel = "— không —",
  className,
  disabled,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [options, query]);

  const rows: Row[] = useMemo(() => {
    const base: Row[] = filtered.map((o) => ({ ...o }));
    // Dòng "bỏ chọn" chỉ hiện khi không gõ tìm kiếm
    if (allowEmpty && !query.trim()) {
      return [{ value: "", label: emptyLabel, isEmpty: true }, ...base];
    }
    return base;
  }, [filtered, allowEmpty, query, emptyLabel]);

  // Reset vị trí highlight mỗi khi mở lại hoặc đổi từ khoá
  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  // Focus ô tìm kiếm khi mở
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // Click ngoài → đóng
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Cuộn dòng đang highlight vào tầm nhìn
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`${listId}-opt-${highlight}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, listId]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  };

  const choose = (v: string) => {
    onChange(v);
    close();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(rows.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[highlight];
      if (row) choose(row.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const displayLabel = selected
    ? selected.label
    : allowEmpty && value === ""
    ? emptyLabel
    : placeholder;
  const isPlaceholder = !selected && !(allowEmpty && value === "");

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        data-cursor-hover
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={clsx(
          "w-full flex items-center justify-between gap-2 text-left",
          "rounded-[10px] px-[14px] py-[10px] text-sm transition",
          "bg-[rgba(10,1,24,0.6)] border border-white/[0.08] text-[#f4eefb]",
          "hover:border-violet-glow/40 focus:outline-none focus:border-violet-glow/70 focus:shadow-[0_0_0_3px_rgba(167,139,250,0.15)]",
          open && "border-violet-glow/70 shadow-[0_0_0_3px_rgba(167,139,250,0.15)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={clsx("truncate", isPlaceholder && "text-white/30")}>
          {displayLabel}
          {selected?.sublabel && (
            <span className="text-white/30"> — {selected.sublabel}</span>
          )}
        </span>
        <span
          className={clsx(
            "shrink-0 text-violet-glow/60 text-xs transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full glass-strong rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="🔍 Gõ để tìm tên…"
            className="!py-2 !text-sm mb-1.5"
            aria-label="Tìm kiếm"
            aria-controls={listId}
            aria-activedescendant={`${listId}-opt-${highlight}`}
          />
          <ul
            id={listId}
            role="listbox"
            className="max-h-64 overflow-y-auto space-y-0.5"
          >
            {rows.length === 0 && (
              <li className="px-3 py-2 text-sm text-white/40 italic">
                Không tìm thấy.
              </li>
            )}
            {rows.map((row, i) => {
              const isSel = row.value === value;
              const isHi = i === highlight;
              return (
                <li
                  key={row.value || "__empty__"}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => choose(row.value)}
                  data-cursor-hover
                  className={clsx(
                    "px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between gap-2 transition",
                    isHi && "bg-violet-base/25",
                    isSel && "text-violet-glow",
                    row.isEmpty && "text-white/40 italic"
                  )}
                >
                  <span className="truncate">{row.label}</span>
                  {row.sublabel && (
                    <span className="shrink-0 text-white/30 font-mono text-[11px]">
                      {row.sublabel}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
