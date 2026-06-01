"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Member } from "@/lib/types";
import MemberCard from "./MemberCard";

interface TreeProps {
  members: Member[];
  rootId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isAdmin?: boolean;
  onQuickAdd?: (anchor: Member) => void;
}

interface NodeProps {
  member: Member;
  members: Member[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth: number;
  initialExpanded: boolean;
  visited: ReadonlySet<string>;
  isAdmin?: boolean;
  onQuickAdd?: (anchor: Member) => void;
}

/**
 * SVG connectors từ thẻ bố/mẹ (trên) đi xuống các thẻ con (dưới).
 * Cây mọc theo chiều xuống — nên đường đi:
 *   1. Đường thẳng đứng từ bố/mẹ xuống tới ngang ở giữa (y=0 → y=14)
 *   2. Đường ngang nối từ tâm con đầu tiên tới tâm con cuối cùng (y=14)
 *   3. Đường thẳng đứng từ ngang xuống mỗi thẻ con (y=14 → y=32)
 *
 * Các thẻ con dùng grid với `repeat(N, 1fr)` để chia đều chiều ngang →
 * tâm thẻ con thứ i đúng tại (i + 0.5)/N * 100% của container.
 */
function ChildrenConnectors({ count }: { count: number }) {
  if (count === 0) return null;

  const centers: number[] = [];
  for (let i = 0; i < count; i++) {
    centers.push(((i + 0.5) / count) * 100);
  }

  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      style={{ height: 32 }}
      preserveAspectRatio="none"
      viewBox="0 0 100 32"
    >
      <defs>
        <linearGradient id="lineGradDown" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.85" />
        </linearGradient>
        <filter id="lineGlowDown" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Đường từ bố/mẹ đi xuống */}
      <motion.line
        x1="50"
        y1="0"
        x2="50"
        y2={count === 1 ? 32 : 14}
        stroke="url(#lineGradDown)"
        strokeWidth="1.2"
        filter="url(#lineGlowDown)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        vectorEffect="non-scaling-stroke"
      />

      {count >= 2 && (
        <>
          {/* 2. Đường ngang nối các con */}
          <motion.line
            x1={centers[0]}
            y1="14"
            x2={centers[centers.length - 1]}
            y2="14"
            stroke="url(#lineGradDown)"
            strokeWidth="1.2"
            filter="url(#lineGlowDown)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            vectorEffect="non-scaling-stroke"
          />
          {/* 3. Đường xuống mỗi con */}
          {centers.map((x, i) => (
            <motion.line
              key={i}
              x1={x}
              y1="14"
              x2={x}
              y2="32"
              stroke="url(#lineGradDown)"
              strokeWidth="1.2"
              filter="url(#lineGlowDown)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      )}
    </svg>
  );
}

function TreeNode({
  member,
  members,
  selectedId,
  onSelect,
  depth,
  initialExpanded,
  visited,
  isAdmin,
  onQuickAdd,
}: NodeProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  // Tìm các con: thành viên có fatherId hoặc motherId trỏ tới mình.
  // Chống vòng lặp bằng visited set (đã render trên đường đi từ root xuống).
  const children = members
    .filter(
      (m) =>
        (m.fatherId === member.id || m.motherId === member.id) &&
        !visited.has(m.id) &&
        m.id !== member.id
    )
    .sort((a, b) => (a.birthYear ?? 9999) - (b.birthYear ?? 9999));

  const hasChildren = children.length > 0;
  const isSelected = selectedId === member.id;

  const onClick = () => {
    onSelect(member.id);
    if (hasChildren) setExpanded((e) => !e);
  };

  const newVisited = new Set(visited);
  newVisited.add(member.id);

  return (
    <motion.div
      className="flex flex-col items-center relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(depth * 0.08, 0.4),
        type: "spring",
        stiffness: 100,
        damping: 18,
      }}
    >
      <MemberCard
        member={member}
        selected={isSelected}
        onClick={onClick}
        showExpandHint={hasChildren}
        expanded={expanded}
        size={depth === 0 ? "md" : "sm"}
      />

      {/* Quick-add toolbar — admin only, chỉ trên thẻ đang chọn */}
      {isAdmin && isSelected && onQuickAdd && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(member);
          }}
          data-cursor-hover
          className="mt-2 px-3 py-1.5 rounded-full bg-gold-400/15 hover:bg-gold-400/30 border border-gold-400/40 text-gold-300 hover:text-gold-200 text-[11px] font-semibold tracking-wide transition shadow-[0_0_12px_rgba(251,191,36,0.25)] hover:shadow-[0_0_18px_rgba(251,191,36,0.45)] flex items-center gap-1.5"
          title="Thêm thành viên liên kết với người này"
        >
          <span className="text-base leading-none">⊕</span>
          <span>Thêm liên kết</span>
        </motion.button>
      )}

      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-visible"
            style={{ width: "100%" }}
          >
            <div
              className="relative grid pt-8"
              style={{
                gridTemplateColumns: `repeat(${children.length}, minmax(min-content, 1fr))`,
              }}
            >
              <ChildrenConnectors count={children.length} />
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex justify-center px-3"
                >
                  <TreeNode
                    member={child}
                    members={members}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    depth={depth + 1}
                    initialExpanded={false}
                    visited={newVisited}
                    isAdmin={isAdmin}
                    onQuickAdd={onQuickAdd}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Sàn zoom đủ lớn để chữ/thẻ vẫn đọc được với cây nhiều người
// (cây lớn sẽ tràn khung và cuộn, thay vì bị thu nhỏ tới mức không đọc nổi).
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 1.15;

export default function FamilyTree({
  members,
  rootId,
  selectedId,
  onSelect,
  isAdmin,
  onQuickAdd,
}: TreeProps) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  // Refs giúp tránh stale closure trong ResizeObserver callback
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  // Khi user thao tác zoom thủ công → tạm dừng auto-fit
  const userOverrideRef = useRef(false);

  const root = members.find((m) => m.id === rootId);

  /**
   * Tính zoom để cây vừa khung container.
   * `offsetWidth/Height` của tree đã bị `zoom` CSS scale, nên chia ngược lại
   * để có kích thước "tự nhiên" (zoom = 1) trước khi tính tỉ lệ fit.
   * Cap tại 1 để không tự phóng to quá kích thước thật.
   */
  /**
   * Tính zoom để cây vừa khung container.
   * `tree.offsetWidth/Height` đã bao gồm padding của chính tree (p-6 sm:p-10),
   * và đã bị `zoom` CSS scale → chia ngược lại được kích thước "tự nhiên" (zoom=1).
   * Cap tại 1 để không tự phóng to vượt size thật, floor ở MIN_ZOOM.
   */
  const computeFit = useCallback((): number | null => {
    const container = containerRef.current;
    const tree = treeRef.current;
    if (!container || !tree) return null;

    // Trừ buffer nhỏ tránh sai số pixel của zoom CSS gây ra scrollbar không cần
    const cw = container.clientWidth - 4;
    const ch = container.clientHeight - 4;
    if (cw <= 0 || ch <= 0) return null;

    const z = zoomRef.current;
    const naturalW = tree.offsetWidth / z;
    const naturalH = tree.offsetHeight / z;
    if (naturalW < 10 || naturalH < 10) return null;

    // Fit theo CHIỀU NGANG (không ép cả chiều cao): cây mọc xuống nên cao là
    // chuyện thường — ta cho cuộn dọc thay vì thu nhỏ tới mức không đọc được.
    // Cap ở 1 (không phóng quá size thật), sàn ở MIN_ZOOM để luôn đọc được.
    const fit = Math.min(cw / naturalW, 1);
    return Math.max(MIN_ZOOM, fit);
  }, []);

  // ResizeObserver theo dõi cả tree (khi expand/collapse) và container (khi resize window)
  useLayoutEffect(() => {
    const container = containerRef.current;
    const tree = treeRef.current;
    if (!container || !tree) return;

    let raf = 0;
    const ro = new ResizeObserver(() => {
      // Throttle qua rAF để gộp các resize event liên tiếp
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (userOverrideRef.current) return;
        const newZoom = computeFit();
        if (newZoom == null) return;
        // Diff guard ngăn loop: setZoom → tree resize → callback fire → cùng fit value → skip
        if (Math.abs(newZoom - zoomRef.current) > 0.005) {
          setZoom(newZoom);
        }
      });
    });

    ro.observe(container);
    ro.observe(tree);

    // Fit ngay sau mount (ResizeObserver thường fire ngay lần đầu nhưng phòng hờ)
    const initial = computeFit();
    if (initial != null && Math.abs(initial - zoomRef.current) > 0.005) {
      setZoom(initial);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [computeFit]);

  // Khi đổi gốc cây → reset override + fit lại
  useEffect(() => {
    userOverrideRef.current = false;
    const t = setTimeout(() => {
      const f = computeFit();
      if (f != null) setZoom(f);
    }, 50);
    return () => clearTimeout(t);
  }, [rootId, computeFit]);

  const zoomIn = () => {
    userOverrideRef.current = true;
    setZoom((z) => Math.min(MAX_ZOOM, +(z * ZOOM_STEP).toFixed(2)));
  };
  const zoomOut = () => {
    userOverrideRef.current = true;
    setZoom((z) => Math.max(MIN_ZOOM, +(z / ZOOM_STEP).toFixed(2)));
  };
  const fitToScreen = () => {
    userOverrideRef.current = false;
    const f = computeFit();
    if (f != null) setZoom(f);
  };

  if (!root)
    return (
      <p className="text-center text-violet-glow/70">
        Không tìm thấy thành viên gốc.
      </p>
    );

  return (
    <div className="relative my-4">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 glass rounded-full p-1 text-xs font-mono shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM + 0.001}
          data-cursor-hover
          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-violet-glow/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Thu nhỏ"
          aria-label="Thu nhỏ cây phả hệ"
        >
          −
        </button>
        <span className="px-1.5 text-violet-glow/90 min-w-[44px] text-center text-[11px] tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM - 0.001}
          data-cursor-hover
          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-violet-glow/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Phóng to"
          aria-label="Phóng to cây phả hệ"
        >
          +
        </button>
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <button
          onClick={fitToScreen}
          data-cursor-hover
          className="px-2.5 h-7 rounded-full hover:bg-violet-base/20 hover:text-violet-glow flex items-center justify-center text-violet-glow/70 text-[10px] tracking-[0.15em] transition"
          title="Khít khung"
        >
          VỪA KHUNG
        </button>
      </div>

      {/* Bounded scroll viewport */}
      <div
        ref={containerRef}
        className="rounded-2xl glass overflow-auto relative"
        style={{
          maxHeight: "min(82vh, 900px)",
          minHeight: "320px",
          // Reserve không gian scrollbar để clientWidth không nhảy khi
          // scrollbar xuất hiện/biến mất (tránh feedback loop với auto-fit)
          scrollbarGutter: "stable",
        }}
      >
        {/*
          Layout cho scrollbar đúng khi cây tràn:
          - `width: max-content` → div vừa khít content (= chiều ngang cây thật sự)
          - `mx-auto` (margin auto) → khi content nhỏ hơn container, tự căn giữa
                                      khi content lớn hơn, margin = 0, content bám trái,
                                      scrollbar ngang trượt từ trái sang phải đúng cây
          - `zoom` áp ngay đây để layout sau zoom là cái container nhìn thấy
        */}
        <div
          ref={treeRef}
          style={{ zoom } as React.CSSProperties}
          className="w-max mx-auto p-6 sm:p-10 flex flex-col items-center"
        >
          <TreeNode
            key={rootId}
            member={root}
            members={members}
            selectedId={selectedId}
            onSelect={onSelect}
            depth={0}
            initialExpanded={true}
            visited={new Set()}
            isAdmin={isAdmin}
            onQuickAdd={onQuickAdd}
          />
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] font-mono tracking-[0.2em] text-violet-glow/40">
        ◂ ◂ TRƯỢT NGANG / DỌC ĐỂ XEM TOÀN BỘ CÂY ▸ ▸
      </p>
    </div>
  );
}
