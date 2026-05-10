"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Member } from "@/lib/types";
import MemberCard from "./MemberCard";

interface TreeProps {
  members: Member[];
  rootId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface NodeProps {
  member: Member;
  members: Member[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth: number;
  initialExpanded: boolean;
  visited: ReadonlySet<string>;
}

function ConnectorLines({ both }: { both: boolean }) {
  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      style={{ height: 32 }}
      preserveAspectRatio="none"
      viewBox="0 0 100 32"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.85" />
        </linearGradient>
        <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.line
        x1="50"
        y1="0"
        x2="50"
        y2="14"
        stroke="url(#lineGrad)"
        strokeWidth="1.2"
        filter="url(#lineGlow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        vectorEffect="non-scaling-stroke"
      />

      {both && (
        <>
          <motion.line
            x1="25"
            y1="14"
            x2="75"
            y2="14"
            stroke="url(#lineGrad)"
            strokeWidth="1.2"
            filter="url(#lineGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            vectorEffect="non-scaling-stroke"
          />
          <motion.line
            x1="25"
            y1="14"
            x2="25"
            y2="32"
            stroke="url(#lineGrad)"
            strokeWidth="1.2"
            filter="url(#lineGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
            vectorEffect="non-scaling-stroke"
          />
          <motion.line
            x1="75"
            y1="14"
            x2="75"
            y2="32"
            stroke="url(#lineGrad)"
            strokeWidth="1.2"
            filter="url(#lineGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      {!both && (
        <motion.line
          x1="50"
          y1="14"
          x2="50"
          y2="32"
          stroke="url(#lineGrad)"
          strokeWidth="1.2"
          filter="url(#lineGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          vectorEffect="non-scaling-stroke"
        />
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
}: NodeProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const fatherId =
    member.fatherId && !visited.has(member.fatherId) ? member.fatherId : null;
  const motherId =
    member.motherId && !visited.has(member.motherId) ? member.motherId : null;
  const father = fatherId ? members.find((m) => m.id === fatherId) ?? null : null;
  const mother = motherId ? members.find((m) => m.id === motherId) ?? null : null;
  const hasParents = !!(father || mother);
  const both = !!(father && mother);

  const onClick = () => {
    onSelect(member.id);
    if (hasParents) setExpanded((e) => !e);
  };

  const newVisited = new Set(visited);
  newVisited.add(member.id);

  return (
    <motion.div
      className="flex flex-col items-center relative"
      initial={{ opacity: 0, y: 16 }}
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
        selected={selectedId === member.id}
        onClick={onClick}
        showExpandHint={hasParents}
        expanded={expanded}
        size={depth === 0 ? "md" : "sm"}
      />

      <AnimatePresence initial={false}>
        {expanded && hasParents && (
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
              className="relative flex justify-center pt-8 px-2"
              style={{ gap: both ? "clamp(20px, 4vw, 60px)" : 0 }}
            >
              <ConnectorLines both={both} />
              {father && (
                <TreeNode
                  member={father}
                  members={members}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  depth={depth + 1}
                  initialExpanded={false}
                  visited={newVisited}
                />
              )}
              {mother && (
                <TreeNode
                  member={mother}
                  members={members}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  depth={depth + 1}
                  initialExpanded={false}
                  visited={newVisited}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FamilyTree({
  members,
  rootId,
  selectedId,
  onSelect,
}: TreeProps) {
  const root = members.find((m) => m.id === rootId);
  if (!root)
    return (
      <p className="text-center text-violet-glow/70">
        Không tìm thấy thành viên gốc.
      </p>
    );

  return (
    <div
      className="flex flex-col items-center py-8 overflow-x-auto overflow-y-visible"
      style={{ minHeight: 240 }}
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
      />
    </div>
  );
}
