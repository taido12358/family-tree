"use client";

import "@xyflow/react/dist/style.css";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import MemberNode, { type MemberNodeData } from "@/components/MemberNode";
import QuickAddPanel from "@/components/QuickAddPanel";
import type { Member, Gender } from "@/lib/types";

type FlowNode = Node<MemberNodeData>;

const COL_W = 230;
const ROW_H = 175;

/* ---------- Tính tầng (thế hệ) theo đường dài nhất từ gốc không cha mẹ ---------- */
function computeTiers(members: Member[]): Map<string, number> {
  const byId = new Map(members.map((m) => [m.id, m]));
  const tiers = new Map<string, number>();
  const visiting = new Set<string>();

  const tierOf = (id: string): number => {
    const cached = tiers.get(id);
    if (cached != null) return cached;
    const m = byId.get(id);
    if (!m) return 0;
    if (visiting.has(id)) return 0; // chống chu trình
    visiting.add(id);

    const parents = [m.fatherId, m.motherId].filter(
      (p): p is string => !!p && byId.has(p)
    );
    let t = 0;
    if (parents.length > 0) {
      t = 1 + Math.max(...parents.map((p) => tierOf(p)));
    }
    visiting.delete(id);
    tiers.set(id, t);
    return t;
  };

  for (const m of members) tierOf(m.id);
  return tiers;
}

function buildNodes(
  members: Member[],
  onDelete: (m: Member) => void
): FlowNode[] {
  const tiers = computeTiers(members);
  const groups = new Map<number, Member[]>();
  for (const m of members) {
    const t = tiers.get(m.id) ?? 0;
    const arr = groups.get(t);
    if (arr) arr.push(m);
    else groups.set(t, [m]);
  }

  const nodes: FlowNode[] = [];
  for (const t of [...groups.keys()].sort((a, b) => a - b)) {
    const arr = groups
      .get(t)!
      .sort(
        (a, b) =>
          (a.birthYear ?? 9999) - (b.birthYear ?? 9999) ||
          a.name.localeCompare(b.name)
      );
    arr.forEach((m, i) => {
      nodes.push({
        id: m.id,
        type: "member",
        position: { x: i * COL_W, y: t * ROW_H },
        data: { member: m, onDelete },
      });
    });
  }
  return nodes;
}

function buildEdges(members: Member[]): Edge[] {
  const ids = new Set(members.map((m) => m.id));
  const edges: Edge[] = [];

  for (const m of members) {
    if (m.fatherId && ids.has(m.fatherId)) {
      edges.push({
        id: `p-father-${m.fatherId}-${m.id}`,
        source: m.fatherId,
        sourceHandle: "child",
        target: m.id,
        targetHandle: "parent",
        data: { kind: "father", childId: m.id },
        style: { stroke: "#a78bfa", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a78bfa" },
      });
    }
    if (m.motherId && ids.has(m.motherId)) {
      edges.push({
        id: `p-mother-${m.motherId}-${m.id}`,
        source: m.motherId,
        sourceHandle: "child",
        target: m.id,
        targetHandle: "parent",
        data: { kind: "mother", childId: m.id },
        style: { stroke: "#c4b5fd", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#c4b5fd" },
      });
    }
  }

  const seen = new Set<string>();
  for (const m of members) {
    for (const sid of m.spouseIds) {
      if (!ids.has(sid)) continue;
      const key = [m.id, sid].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        id: `s-${[m.id, sid].sort().join("-")}`,
        source: m.id,
        sourceHandle: "spouse",
        target: sid,
        targetHandle: "spouse",
        data: { kind: "spouse", aId: m.id, bId: sid },
        animated: true,
        style: { stroke: "#f472b6", strokeWidth: 2 },
      });
    }
  }
  return edges;
}

export default function BuilderClient({
  members: initialMembers,
}: {
  members: Member[];
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const membersRef = useRef(members);
  membersRef.current = members;

  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const showToast = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [selected, setSelected] = useState<Member | null>(null);
  const [quickAddAnchor, setQuickAddAnchor] = useState<Member | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingParent, setPendingParent] = useState<{
    parent: Member;
    childId: string;
  } | null>(null);
  const [pendingNodeDelete, setPendingNodeDelete] = useState<Member | null>(null);
  const [pendingEdgeDelete, setPendingEdgeDelete] = useState<Edge | null>(null);

  const nodeTypes = useMemo(() => ({ member: MemberNode }), []);

  /* ---------- Hàng đợi ghi tuần tự (tránh đè family.json) ---------- */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const p = queueRef.current.then(fn, fn);
    queueRef.current = p.then(
      () => undefined,
      () => undefined
    );
    return p as Promise<T>;
  }, []);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/family", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setMembers(d.members as Member[]);
    }
  }, []);

  const handleNodeDelete = useCallback((m: Member) => {
    setPendingNodeDelete(m);
  }, []);

  // Dựng lại nodes/edges mỗi khi members đổi (relayout theo tầng)
  useEffect(() => {
    setNodes(buildNodes(members, handleNodeDelete));
    setEdges(buildEdges(members));
  }, [members, handleNodeDelete, setNodes, setEdges]);

  /* ---------- Các thao tác lưu tức thì ---------- */
  const patch = (id: string, body: Record<string, unknown>) =>
    fetch(`/api/user/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const applyParentLink = useCallback(
    (childId: string, parentId: string, slot: "fatherId" | "motherId") => {
      enqueue(async () => {
        const res = await patch(childId, { [slot]: parentId });
        if (res.ok) showToast("ok", "✓ Đã nối quan hệ cha/mẹ – con");
        else {
          const d = await res.json().catch(() => ({}));
          showToast("err", d.error ?? "Không nối được");
        }
        await refetch();
      });
    },
    [enqueue, refetch, showToast]
  );

  const applySpouse = useCallback(
    (aId: string, bId: string) => {
      enqueue(async () => {
        const a = membersRef.current.find((m) => m.id === aId);
        const next = Array.from(new Set([...(a?.spouseIds ?? []), bId]));
        const res = await patch(aId, { spouseIds: next });
        if (res.ok) showToast("ok", "✓ Đã nối quan hệ vợ/chồng");
        else {
          const d = await res.json().catch(() => ({}));
          showToast("err", d.error ?? "Không nối được");
        }
        await refetch();
      });
    },
    [enqueue, refetch, showToast]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      // Vợ/chồng
      if (c.sourceHandle === "spouse" && c.targetHandle === "spouse") {
        applySpouse(c.source, c.target);
        return;
      }
      // Cha/mẹ – con: source là cha/mẹ, target là con
      if (c.sourceHandle === "child" && c.targetHandle === "parent") {
        const parent = membersRef.current.find((m) => m.id === c.source);
        if (!parent) return;
        if (parent.gender === "male")
          applyParentLink(c.target, parent.id, "fatherId");
        else if (parent.gender === "female")
          applyParentLink(c.target, parent.id, "motherId");
        else setPendingParent({ parent, childId: c.target });
      }
    },
    [applySpouse, applyParentLink]
  );

  const isValidConnection = useCallback((c: Connection | Edge) => {
    if (!c.source || !c.target || c.source === c.target) return false;
    if (c.sourceHandle === "child" && c.targetHandle === "parent") return true;
    if (c.sourceHandle === "spouse" && c.targetHandle === "spouse") return true;
    return false;
  }, []);

  const doDeleteEdge = useCallback(
    (edge: Edge) => {
      const data = edge.data as
        | { kind: "father" | "mother"; childId: string }
        | { kind: "spouse"; aId: string; bId: string };
      enqueue(async () => {
        let res: Response;
        if (data.kind === "spouse") {
          const a = membersRef.current.find((m) => m.id === data.aId);
          const next = (a?.spouseIds ?? []).filter((x) => x !== data.bId);
          res = await patch(data.aId, { spouseIds: next });
        } else {
          const slot = data.kind === "father" ? "fatherId" : "motherId";
          res = await patch(data.childId, { [slot]: null });
        }
        if (res.ok) showToast("ok", "✓ Đã gỡ liên kết");
        else {
          const d = await res.json().catch(() => ({}));
          showToast("err", d.error ?? "Không gỡ được");
        }
        await refetch();
      });
    },
    [enqueue, refetch, showToast]
  );

  const doDeleteNode = useCallback(
    (m: Member) => {
      enqueue(async () => {
        const res = await fetch(`/api/user/${m.id}`, { method: "DELETE" });
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          const n = d.affectedMembers?.length ?? 0;
          showToast(
            "ok",
            `✓ Đã xoá "${m.name}"${
              n ? ` · ${n} liên kết khác đã được dọn` : ""
            }`
          );
        } else {
          const d = await res.json().catch(() => ({}));
          showToast("err", d.error ?? "Xoá thất bại");
        }
        await refetch();
      });
      setSelected((s) => (s?.id === m.id ? null : s));
    },
    [enqueue, refetch, showToast]
  );

  const doCreateRootless = useCallback(
    (name: string, gender: Gender) => {
      enqueue(async () => {
        const res = await fetch("/api/admin/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, gender }),
        });
        if (res.ok) showToast("ok", `✓ Đã thêm "${name}" — kéo dây để nối`);
        else {
          const d = await res.json().catch(() => ({}));
          showToast("err", d.error ?? "Tạo thất bại");
        }
        await refetch();
      });
    },
    [enqueue, refetch, showToast]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] tracking-[0.4em] text-gold-300/70 mb-2">
            ⊹ TRÌNH DỰNG CÂY TRỰC QUAN
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-gradient-heritage">
            Kéo – thả nối quan hệ
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setShowCreate(true)}
            data-cursor-hover
            className="magnetic-button px-4 py-2.5 rounded-full text-sm font-semibold text-white tracking-wide whitespace-nowrap"
          >
            ＋ Người mới
          </button>
          <button
            onClick={() => selected && setQuickAddAnchor(selected)}
            disabled={!selected}
            data-cursor-hover
            className="px-4 py-2.5 rounded-full glass text-sm hover:bg-white/10 transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              selected
                ? `Thêm người liên kết với ${selected.name}`
                : "Chọn một node trước"
            }
          >
            ⊕ Thêm liên kết
          </button>
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-full glass text-sm hover:bg-white/10 transition whitespace-nowrap"
          >
            ← Quản trị
          </Link>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="glass rounded-xl px-4 py-3 mb-3 text-[11px] text-white/50 font-mono leading-relaxed flex flex-wrap gap-x-5 gap-y-1">
        <span>
          <span className="text-violet-glow">●</span> Kéo chấm{" "}
          <span className="text-violet-glow">đáy</span> (con) → chấm{" "}
          <span className="text-gold-300">đỉnh</span> (cha/mẹ) của người khác để
          nối cha/mẹ – con
        </span>
        <span>
          <span className="text-rose-glow">●</span> Kéo chấm{" "}
          <span className="text-rose-glow">phải</span> → trái người khác để nối
          vợ/chồng
        </span>
        <span>▸ Bấm vào sợi dây để gỡ · chọn node để xoá</span>
        <span className="text-white/30">
          (Vị trí node tự xếp theo thế hệ — không lưu)
        </span>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-3 p-3 rounded-lg border text-sm ${
              toast.type === "ok"
                ? "bg-cyan-base/10 border-cyan-base/30 text-cyan-glow"
                : "bg-rose-base/10 border-rose-base/30 text-rose-glow"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="tree-builder rounded-2xl glass overflow-hidden h-[74vh] min-h-[460px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            const m = membersRef.current.find((x) => x.id === node.id);
            setSelected(m ?? null);
          }}
          onEdgeClick={(_, edge) => setPendingEdgeDelete(edge)}
          onPaneClick={() => setSelected(null)}
          deleteKeyCode={null}
          fitView
          minZoom={0.2}
          proOptions={{ hideAttribution: false }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#2a1b4d" />
          <Controls />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const g = (n.data as MemberNodeData)?.member?.gender;
              return g === "male" ? "#22d3ee" : g === "female" ? "#f9a8d4" : "#a78bfa";
            }}
            maskColor="rgba(5,0,16,0.7)"
          />
        </ReactFlow>
      </div>

      {/* QuickAddPanel — thêm người liên kết với node đang chọn */}
      <QuickAddPanel
        open={!!quickAddAnchor}
        anchor={quickAddAnchor}
        members={members}
        onClose={() => setQuickAddAnchor(null)}
        onCreated={() => refetch()}
      />

      {/* Modal: tạo người trống */}
      <AnimatePresence>
        {showCreate && (
          <CreateRootlessModal
            onClose={() => setShowCreate(false)}
            onCreate={(name, gender) => {
              doCreateRootless(name, gender);
              setShowCreate(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal: chọn Bố/Mẹ khi giới tính "khác" */}
      <AnimatePresence>
        {pendingParent && (
          <ConfirmModal
            title="Là Bố hay Mẹ?"
            body={
              <>
                <strong className="text-gold-300">{pendingParent.parent.name}</strong>{" "}
                có giới tính &ldquo;khác&rdquo;. Chọn vai trò với người con:
              </>
            }
            actions={
              <>
                <button
                  onClick={() => {
                    applyParentLink(
                      pendingParent.childId,
                      pendingParent.parent.id,
                      "fatherId"
                    );
                    setPendingParent(null);
                  }}
                  className="px-4 py-2 rounded-full bg-cyan-base/20 border border-cyan-glow/40 text-cyan-glow text-sm font-semibold hover:bg-cyan-base/30 transition"
                >
                  ♂ Bố
                </button>
                <button
                  onClick={() => {
                    applyParentLink(
                      pendingParent.childId,
                      pendingParent.parent.id,
                      "motherId"
                    );
                    setPendingParent(null);
                  }}
                  className="px-4 py-2 rounded-full bg-rose-base/20 border border-rose-glow/40 text-rose-glow text-sm font-semibold hover:bg-rose-base/30 transition"
                >
                  ♀ Mẹ
                </button>
              </>
            }
            onClose={() => setPendingParent(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal: xoá node */}
      <AnimatePresence>
        {pendingNodeDelete && (
          <ConfirmModal
            danger
            title={`Xoá "${pendingNodeDelete.name}"?`}
            body="Hành động này KHÔNG THỂ HOÀN TÁC. Mọi tham chiếu (con cái, vợ/chồng) sẽ tự được dọn."
            actions={
              <>
                <button
                  onClick={() => setPendingNodeDelete(null)}
                  className="px-4 py-2 rounded-full glass text-sm hover:bg-white/10 transition"
                >
                  Huỷ
                </button>
                <button
                  onClick={() => {
                    doDeleteNode(pendingNodeDelete);
                    setPendingNodeDelete(null);
                  }}
                  className="px-4 py-2 rounded-full bg-rose-base/30 border border-rose-base/50 text-rose-glow text-sm font-semibold hover:bg-rose-base/50 transition"
                >
                  Xoá vĩnh viễn
                </button>
              </>
            }
            onClose={() => setPendingNodeDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal: gỡ liên kết (edge) */}
      <AnimatePresence>
        {pendingEdgeDelete && (
          <ConfirmModal
            danger
            title="Gỡ liên kết này?"
            body={
              (pendingEdgeDelete.data as { kind?: string })?.kind === "spouse"
                ? "Gỡ quan hệ vợ/chồng giữa hai người (đồng bộ cả hai phía)."
                : "Gỡ quan hệ cha/mẹ – con (xoá tham chiếu bố hoặc mẹ của người con)."
            }
            actions={
              <>
                <button
                  onClick={() => setPendingEdgeDelete(null)}
                  className="px-4 py-2 rounded-full glass text-sm hover:bg-white/10 transition"
                >
                  Huỷ
                </button>
                <button
                  onClick={() => {
                    doDeleteEdge(pendingEdgeDelete);
                    setPendingEdgeDelete(null);
                  }}
                  className="px-4 py-2 rounded-full bg-rose-base/30 border border-rose-base/50 text-rose-glow text-sm font-semibold hover:bg-rose-base/50 transition"
                >
                  Gỡ liên kết
                </button>
              </>
            }
            onClose={() => setPendingEdgeDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Modal phụ ---------- */
function ConfirmModal({
  title,
  body,
  actions,
  onClose,
  danger,
}: {
  title: string;
  body: React.ReactNode;
  actions: React.ReactNode;
  onClose: () => void;
  danger?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050010]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass-strong rounded-2xl p-6 max-w-md w-full grain relative ${
          danger ? "border-rose-base/30" : "border-violet-glow/30"
        }`}
        style={{ borderWidth: 1 }}
      >
        <h3
          className={`font-display text-2xl mb-3 ${
            danger ? "text-rose-glow" : "text-gradient-heritage"
          }`}
        >
          {title}
        </h3>
        <div className="text-sm text-white/70 mb-5">{body}</div>
        <div className="flex gap-2 justify-end flex-wrap">{actions}</div>
      </motion.div>
    </motion.div>
  );
}

function CreateRootlessModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, gender: Gender) => void;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [onClose]);

  const submit = () => {
    if (!name.trim()) {
      inputRef.current?.focus();
      return;
    }
    onCreate(name.trim(), gender);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050010]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Thêm người mới"
        className="glass-strong rounded-2xl p-6 max-w-sm w-full grain relative"
      >
        <div className="font-mono text-[10px] tracking-[0.3em] text-gold-300/70 mb-3">
          ＋ THÊM NGƯỜI MỚI (TẦNG GỐC)
        </div>
        <label className="block mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
            Họ tên *
          </span>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Nguyễn Văn A"
          />
        </label>
        <label className="block mb-5">
          <span className="font-mono text-[10px] tracking-[0.2em] text-violet-glow/60 uppercase block mb-1">
            Giới tính
          </span>
          <div className="flex gap-1.5">
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
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${
                  gender === v
                    ? "bg-cyan-base/20 border-cyan-glow/50 text-cyan-glow"
                    : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </label>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full glass text-sm hover:bg-white/10 transition"
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            data-cursor-hover
            className="magnetic-button px-5 py-2 rounded-full text-sm font-semibold text-white tracking-wide"
          >
            ✦ Tạo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
