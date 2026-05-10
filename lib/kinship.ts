import { findMember } from "./family";
import type { FamilyData, Member } from "./types";

interface AncestorInfo {
  depth: number;
  /** Đường đi mỗi bước lên: 'F' = qua bố, 'M' = qua mẹ. Độ dài = depth. */
  path: ("F" | "M")[];
}

/**
 * BFS lên trên: trả về map id ancestor -> {depth, path}.
 * Bao gồm cả chính bản thân ở depth 0. Có cycle-protection.
 */
function getAncestorPaths(
  data: FamilyData,
  startId: string
): Map<string, AncestorInfo> {
  const result = new Map<string, AncestorInfo>();
  const queue: Array<{ id: string; depth: number; path: ("F" | "M")[] }> = [
    { id: startId, depth: 0, path: [] },
  ];
  while (queue.length) {
    const { id, depth, path } = queue.shift()!;
    if (result.has(id)) continue;
    result.set(id, { depth, path });
    const m = findMember(data, id);
    if (!m) continue;
    if (m.fatherId)
      queue.push({ id: m.fatherId, depth: depth + 1, path: [...path, "F"] });
    if (m.motherId)
      queue.push({ id: m.motherId, depth: depth + 1, path: [...path, "M"] });
  }
  return result;
}

function ancestorTerm(
  depth: number,
  firstStep: "F" | "M" | undefined,
  gender: string
): string {
  if (depth === 1) return gender === "male" ? "bố" : "mẹ";
  if (depth === 2) {
    const side = firstStep === "F" ? "nội" : "ngoại";
    return gender === "male" ? `ông ${side}` : `bà ${side}`;
  }
  if (depth === 3) {
    const side = firstStep === "F" ? "nội" : "ngoại";
    return gender === "male" ? `cụ ông (bên ${side})` : `cụ bà (bên ${side})`;
  }
  if (depth === 4) return gender === "male" ? "kỵ ông" : "kỵ bà";
  return `tổ tiên đời thứ ${depth}`;
}

function descendantTerm(depth: number, gender: string): string {
  if (depth === 1) return gender === "male" ? "con trai" : "con gái";
  if (depth === 2) return gender === "male" ? "cháu trai" : "cháu gái";
  if (depth === 3) return "chắt";
  if (depth === 4) return "chút";
  return `hậu duệ đời thứ ${depth}`;
}

function siblingTerm(from: Member, to: Member): string {
  const f = from.birthYear ?? 0;
  const t = to.birthYear ?? 0;
  if (t < f) return to.gender === "male" ? "anh trai" : "chị gái";
  if (t > f) return to.gender === "male" ? "em trai" : "em gái";
  return to.gender === "male" ? "anh/em trai" : "chị/em gái";
}

function cousinTerm(from: Member, to: Member, suffix: string): string {
  const f = from.birthYear ?? 0;
  const t = to.birthYear ?? 0;
  if (t < f) return to.gender === "male" ? `anh ${suffix}` : `chị ${suffix}`;
  if (t > f)
    return to.gender === "male" ? `em trai ${suffix}` : `em gái ${suffix}`;
  return `anh/chị/em ${suffix}`;
}

function uncleAuntTerm(
  side: "F" | "M",
  toGender: string,
  parentBirthYear: number | null,
  toBirthYear: number | null
): string {
  let older: boolean | null = null;
  if (parentBirthYear != null && toBirthYear != null) {
    older = toBirthYear < parentBirthYear;
  }

  if (side === "F") {
    if (toGender === "male") {
      if (older === true) return "bác (anh trai bố)";
      if (older === false) return "chú";
      return "bác/chú";
    } else {
      if (older === true) return "bác (chị gái bố)";
      if (older === false) return "cô";
      return "bác/cô";
    }
  } else {
    if (toGender === "male") return "cậu";
    if (older === true) return "bác (chị gái mẹ)";
    if (older === false) return "dì";
    return "bác/dì";
  }
}

/**
 * Quan hệ vợ/chồng của một huyết thống của A.
 * Vd: vợ chú = thím, chồng cô = chú/dượng.
 */
function spouseOfBloodRelativeTerm(
  bloodRelation: string,
  spouseGender: string
): string {
  if (bloodRelation === "bố")
    return spouseGender === "female" ? "mẹ kế" : "bố";
  if (bloodRelation === "mẹ")
    return spouseGender === "male" ? "bố dượng" : "mẹ";
  if (bloodRelation.startsWith("ông"))
    return bloodRelation.replace(/^ông/, "bà");
  if (bloodRelation.startsWith("bà"))
    return bloodRelation.replace(/^bà/, "ông");
  if (bloodRelation.startsWith("bác (anh"))
    return spouseGender === "female" ? "bác gái (vợ bác)" : "bác trai";
  if (bloodRelation.startsWith("bác (chị"))
    return spouseGender === "male" ? "bác trai (chồng bác)" : "bác gái";
  if (bloodRelation === "chú") return "thím";
  if (bloodRelation === "cô") return "chú (dượng)";
  if (bloodRelation === "cậu") return "mợ";
  if (bloodRelation === "dì") return "chú (dượng)";
  if (bloodRelation === "anh trai")
    return spouseGender === "female" ? "chị dâu" : "anh rể";
  if (bloodRelation === "em trai")
    return spouseGender === "female" ? "em dâu" : "em rể";
  if (bloodRelation === "chị gái")
    return spouseGender === "male" ? "anh rể" : "chị dâu";
  if (bloodRelation === "em gái")
    return spouseGender === "male" ? "em rể" : "em dâu";
  if (bloodRelation === "con trai")
    return spouseGender === "female" ? "con dâu" : "con rể";
  if (bloodRelation === "con gái")
    return spouseGender === "male" ? "con rể" : "con dâu";
  if (bloodRelation === "cháu trai")
    return spouseGender === "female" ? "cháu dâu" : "cháu rể";
  if (bloodRelation === "cháu gái")
    return spouseGender === "male" ? "cháu rể" : "cháu dâu";
  return `vợ/chồng của ${bloodRelation}`;
}

/**
 * Quan hệ qua HUYẾT THỐNG thuần tuý (không đi qua hôn nhân).
 * Trả về null nếu không có quan hệ huyết thống.
 */
function bloodRelation(
  data: FamilyData,
  fromId: string,
  toId: string
): string | null {
  if (fromId === toId) return "chính bản thân";
  const from = findMember(data, fromId);
  const to = findMember(data, toId);
  if (!from || !to) return null;

  const ancFrom = getAncestorPaths(data, fromId);
  const ancTo = getAncestorPaths(data, toId);

  // B là tổ tiên trực tiếp của A
  if (ancFrom.has(toId)) {
    const info = ancFrom.get(toId)!;
    if (info.depth === 0) return "chính bản thân";
    return ancestorTerm(info.depth, info.path[0], to.gender);
  }

  // B là hậu duệ trực tiếp của A
  if (ancTo.has(fromId)) {
    const info = ancTo.get(fromId)!;
    return descendantTerm(info.depth, to.gender);
  }

  // Tìm tổ tiên chung gần nhất (LCA)
  let lcaFromDepth = Infinity;
  let lcaToDepth = Infinity;
  let lcaFromPath: ("F" | "M")[] = [];
  let lcaFound = false;
  let minTotal = Infinity;
  for (const [id, infoFrom] of ancFrom) {
    if (ancTo.has(id)) {
      const infoTo = ancTo.get(id)!;
      const total = infoFrom.depth + infoTo.depth;
      if (total < minTotal) {
        minTotal = total;
        lcaFromDepth = infoFrom.depth;
        lcaToDepth = infoTo.depth;
        lcaFromPath = infoFrom.path;
        lcaFound = true;
      }
    }
  }

  if (!lcaFound) return null;

  const aD = lcaFromDepth;
  const bD = lcaToDepth;

  if (aD === bD) {
    if (aD === 1) return siblingTerm(from, to);
    if (aD === 2) return cousinTerm(from, to, "họ");
    return cousinTerm(from, to, "họ xa");
  }

  if (aD > bD) {
    const gap = aD - bD;
    if (gap === 1) {
      const parentSide = lcaFromPath[0];
      const myParent =
        parentSide === "F"
          ? from.fatherId
            ? findMember(data, from.fatherId)
            : null
          : from.motherId
          ? findMember(data, from.motherId)
          : null;
      return uncleAuntTerm(
        parentSide,
        to.gender,
        myParent?.birthYear ?? null,
        to.birthYear
      );
    }
    if (gap === 2) {
      const side = lcaFromPath[0] === "F" ? "nội" : "ngoại";
      // Nếu LCA chính là tổ tiên gần nhất của B (depth=1, B là con trực tiếp
      // của LCA), thì B là anh/em ruột của ông/bà; ngược lại là anh/em họ.
      const sibling = bD === 1;
      const qualifier = sibling ? "ruột" : "họ";
      return to.gender === "male"
        ? `ông ${side} (anh/em ${qualifier} của ông)`
        : `bà ${side} (chị/em ${qualifier} của bà)`;
    }
    return `bậc trên ${gap} đời (họ hàng)`;
  }

  // bD > aD
  const gap = bD - aD;
  if (aD === 1) {
    if (gap === 1) return to.gender === "male" ? "cháu trai" : "cháu gái";
    if (gap === 2) return "chắt";
  }
  if (gap === 1) return to.gender === "male" ? "cháu trai (họ)" : "cháu gái (họ)";
  return `cháu họ (đời ${gap})`;
}

/**
 * Hàm chính: A gọi B là gì.
 * Logic: thử trực tiếp (vợ/chồng) → huyết thống → vợ/chồng của huyết thống của A
 * → huyết thống của vợ/chồng A. Không có đệ quy mutual nên không có nguy cơ overflow.
 */
export function calculateRelation(
  data: FamilyData,
  fromId: string,
  toId: string
): string {
  if (fromId === toId) return "chính bản thân";
  const from = findMember(data, fromId);
  const to = findMember(data, toId);
  if (!from || !to) return "không tìm thấy thành viên";

  // Vợ/chồng trực tiếp
  if (from.spouseIds.includes(toId)) {
    return to.gender === "male" ? "chồng" : "vợ";
  }

  // Huyết thống thuần tuý
  const blood = bloodRelation(data, fromId, toId);
  if (blood && blood !== "chính bản thân") return blood;

  // B là vợ/chồng của một người có huyết thống với A
  for (const member of data.members) {
    if (member.id === fromId || member.id === toId) continue;
    if (!member.spouseIds.includes(toId)) continue;
    const inner = bloodRelation(data, fromId, member.id);
    if (inner && inner !== "chính bản thân") {
      return spouseOfBloodRelativeTerm(inner, to.gender);
    }
  }

  // B là người có huyết thống với vợ/chồng của A
  for (const spouseId of from.spouseIds) {
    const inner = bloodRelation(data, spouseId, toId);
    if (!inner || inner === "chính bản thân") continue;
    const isMale = from.gender === "male";
    if (inner === "bố") return isMale ? "bố vợ" : "bố chồng";
    if (inner === "mẹ") return isMale ? "mẹ vợ" : "mẹ chồng";
    if (inner === "anh trai") return isMale ? "anh vợ" : "anh chồng";
    if (inner === "em trai") return isMale ? "em vợ (trai)" : "em chồng (trai)";
    if (inner === "chị gái") return isMale ? "chị vợ" : "chị chồng";
    if (inner === "em gái") return isMale ? "em vợ (gái)" : "em chồng (gái)";
    if (inner === "con trai" || inner === "con gái") {
      // con riêng của vợ/chồng
      return inner + " riêng (con của vợ/chồng)";
    }
    return `${inner} của ${isMale ? "vợ" : "chồng"}`;
  }

  return "không có quan hệ huyết thống / không xác định";
}
