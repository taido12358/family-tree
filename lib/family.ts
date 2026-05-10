import type { FamilyData, Member } from "./types";

export function findMember(data: FamilyData, id: string): Member | undefined {
  return data.members.find((m) => m.id === id);
}

export function getChildren(data: FamilyData, parentId: string): Member[] {
  return data.members.filter(
    (m) => m.fatherId === parentId || m.motherId === parentId
  );
}

export function getSpouses(data: FamilyData, member: Member): Member[] {
  return member.spouseIds
    .map((id) => findMember(data, id))
    .filter((m): m is Member => m !== undefined);
}

export function getSiblings(data: FamilyData, member: Member): Member[] {
  if (!member.fatherId && !member.motherId) return [];
  return data.members.filter(
    (m) =>
      m.id !== member.id &&
      ((member.fatherId && m.fatherId === member.fatherId) ||
        (member.motherId && m.motherId === member.motherId))
  );
}

/**
 * Lấy tập tất cả tổ tiên (đi lên qua father/mother) của một thành viên.
 * Có cycle-protection bằng visited set, không bao gồm chính bản thân.
 */
export function getAncestorIds(data: FamilyData, id: string): Set<string> {
  const result = new Set<string>();
  const stack: string[] = [];
  const start = findMember(data, id);
  if (!start) return result;
  if (start.fatherId) stack.push(start.fatherId);
  if (start.motherId) stack.push(start.motherId);
  while (stack.length) {
    const cur = stack.pop()!;
    if (result.has(cur)) continue;
    result.add(cur);
    const m = findMember(data, cur);
    if (!m) continue;
    if (m.fatherId) stack.push(m.fatherId);
    if (m.motherId) stack.push(m.motherId);
  }
  return result;
}

/**
 * Lấy tập tất cả hậu duệ (con, cháu, chắt...) của một thành viên.
 */
export function getDescendantIds(data: FamilyData, id: string): Set<string> {
  const result = new Set<string>();
  const stack: string[] = [id];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const m of data.members) {
      if (m.fatherId === cur || m.motherId === cur) {
        if (m.id !== id && !result.has(m.id)) {
          result.add(m.id);
          stack.push(m.id);
        }
      }
    }
  }
  return result;
}

/**
 * Kiểm tra: nếu đặt newParentId làm bố/mẹ của memberId thì có tạo vòng lặp không?
 * Vòng lặp xảy ra khi newParentId chính là memberId (tự làm bố mình)
 * hoặc newParentId là hậu duệ của memberId (con/cháu lại trở thành bố mình).
 */
export function wouldCreateCycle(
  data: FamilyData,
  memberId: string,
  newParentId: string
): boolean {
  if (memberId === newParentId) return true;
  const descendants = getDescendantIds(data, memberId);
  return descendants.has(newParentId);
}

/**
 * Quy tắc phân quyền sửa:
 * - admin sửa được tất cả
 * - user thường: chính mình, vợ/chồng của mình, và các con
 *   (cha hoặc mẹ là chính mình).
 */
export function canEdit(
  data: FamilyData,
  session: { memberId: string | null; role: "admin" | "user" } | null,
  targetId: string
): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  if (!session.memberId) return false;
  if (session.memberId === targetId) return true;

  const target = findMember(data, targetId);
  if (!target) return false;

  if (target.fatherId === session.memberId) return true;
  if (target.motherId === session.memberId) return true;

  const me = findMember(data, session.memberId);
  if (me && me.spouseIds.includes(targetId)) return true;

  return false;
}

export function generateId(data: FamilyData): string {
  let max = 0;
  for (const m of data.members) {
    const n = parseInt(m.id.replace(/^u/, ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `u${max + 1}`;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate dữ liệu cập nhật trước khi ghi.
 * Trả về list lỗi (rỗng nếu hợp lệ).
 */
export function validateMemberUpdate(
  data: FamilyData,
  memberId: string,
  updates: {
    fatherId?: string | null;
    motherId?: string | null;
    spouseIds?: string[];
    birthYear?: number | null;
    deathYear?: number | null;
    gender?: string;
  }
): ValidationError[] {
  const errors: ValidationError[] = [];
  const currentYear = new Date().getFullYear();

  // fatherId
  if (updates.fatherId) {
    if (updates.fatherId === memberId) {
      errors.push({ field: "fatherId", message: "Không thể tự đặt mình làm bố." });
    } else if (wouldCreateCycle(data, memberId, updates.fatherId)) {
      errors.push({
        field: "fatherId",
        message:
          "Vòng lặp gia phả: người này là hậu duệ của bạn nên không thể là bố bạn.",
      });
    } else {
      const f = findMember(data, updates.fatherId);
      if (!f) errors.push({ field: "fatherId", message: "Không tìm thấy bố trong dữ liệu." });
    }
  }

  // motherId
  if (updates.motherId) {
    if (updates.motherId === memberId) {
      errors.push({ field: "motherId", message: "Không thể tự đặt mình làm mẹ." });
    } else if (wouldCreateCycle(data, memberId, updates.motherId)) {
      errors.push({
        field: "motherId",
        message:
          "Vòng lặp gia phả: người này là hậu duệ của bạn nên không thể là mẹ bạn.",
      });
    } else {
      const m = findMember(data, updates.motherId);
      if (!m) errors.push({ field: "motherId", message: "Không tìm thấy mẹ trong dữ liệu." });
    }
  }

  // Bố và mẹ trùng nhau
  if (
    updates.fatherId &&
    updates.motherId &&
    updates.fatherId === updates.motherId
  ) {
    errors.push({
      field: "motherId",
      message: "Bố và mẹ không thể là cùng một người.",
    });
  }

  // spouseIds
  if (updates.spouseIds) {
    if (updates.spouseIds.includes(memberId)) {
      errors.push({
        field: "spouseIds",
        message: "Không thể tự đặt mình là vợ/chồng của chính mình.",
      });
    }
    // Vợ/chồng không thể là tổ tiên hoặc hậu duệ trực tiếp
    const ancestors = getAncestorIds(data, memberId);
    const descendants = getDescendantIds(data, memberId);
    for (const sid of updates.spouseIds) {
      if (ancestors.has(sid)) {
        const a = findMember(data, sid);
        errors.push({
          field: "spouseIds",
          message: `Không thể kết hôn với tổ tiên (${a?.name ?? sid}).`,
        });
      }
      if (descendants.has(sid)) {
        const d = findMember(data, sid);
        errors.push({
          field: "spouseIds",
          message: `Không thể kết hôn với hậu duệ (${d?.name ?? sid}).`,
        });
      }
      const sp = findMember(data, sid);
      if (!sp) {
        errors.push({
          field: "spouseIds",
          message: `Không tìm thấy người ID="${sid}".`,
        });
      }
    }
    // trùng lặp
    const set = new Set(updates.spouseIds);
    if (set.size !== updates.spouseIds.length) {
      errors.push({
        field: "spouseIds",
        message: "Danh sách vợ/chồng có ID trùng lặp.",
      });
    }
  }

  // birthYear / deathYear
  const by = updates.birthYear;
  const dy = updates.deathYear;
  if (by != null && (by < 1000 || by > currentYear + 1)) {
    errors.push({
      field: "birthYear",
      message: `Năm sinh không hợp lệ (1000 – ${currentYear + 1}).`,
    });
  }
  if (dy != null && (dy < 1000 || dy > currentYear + 1)) {
    errors.push({
      field: "deathYear",
      message: `Năm mất không hợp lệ.`,
    });
  }
  if (by != null && dy != null && dy < by) {
    errors.push({
      field: "deathYear",
      message: "Năm mất phải bằng hoặc sau năm sinh.",
    });
  }

  return errors;
}

/**
 * Đồng bộ spouseIds hai chiều: nếu A có B trong spouseIds thì B cũng
 * phải có A. Hàm này áp dụng cho 1 thành viên đã được cập nhật.
 */
export function syncSpouseSymmetry(
  data: FamilyData,
  memberId: string,
  oldSpouseIds: string[],
  newSpouseIds: string[]
): void {
  const oldSet = new Set(oldSpouseIds);
  const newSet = new Set(newSpouseIds);

  // Bỏ memberId khỏi spouseIds của những người đã bị huỷ liên kết
  for (const id of oldSet) {
    if (!newSet.has(id)) {
      const other = findMember(data, id);
      if (other) {
        other.spouseIds = other.spouseIds.filter((x) => x !== memberId);
      }
    }
  }
  // Thêm memberId vào spouseIds của những người được liên kết mới
  for (const id of newSet) {
    if (!oldSet.has(id)) {
      const other = findMember(data, id);
      if (other && !other.spouseIds.includes(memberId)) {
        other.spouseIds.push(memberId);
      }
    }
  }
}

/**
 * Tạo thành viên mới với ID tự sinh. Không tự đồng bộ spouse symmetry —
 * gọi syncSpouseSymmetry sau nếu cần.
 */
export function createMember(
  data: FamilyData,
  partial: Partial<Omit<Member, "id">>
): Member {
  const newMember: Member = {
    id: generateId(data),
    name: partial.name?.trim() || "Người mới",
    gender: (partial.gender as Member["gender"]) ?? "other",
    birthYear: partial.birthYear ?? null,
    deathYear: partial.deathYear ?? null,
    birthPlace: partial.birthPlace ?? "",
    occupation: partial.occupation ?? "",
    biography: partial.biography ?? "",
    fatherId: partial.fatherId ?? null,
    motherId: partial.motherId ?? null,
    spouseIds: Array.isArray(partial.spouseIds) ? [...partial.spouseIds] : [],
    ownerEmail: partial.ownerEmail ?? null,
    avatarUrl: partial.avatarUrl ?? null,
  };
  data.members.push(newMember);
  return newMember;
}

export interface DeleteResult {
  success: boolean;
  affectedMembers: string[];
  error?: string;
}

/**
 * Xoá một thành viên VÀ dọn mọi tham chiếu tới id này:
 *  - Bất kỳ ai đang có fatherId/motherId === id → chuyển về null
 *  - Bất kỳ ai có id trong spouseIds → bỏ khỏi danh sách
 * Trả về danh sách ID những thành viên bị ảnh hưởng để hiển thị thông báo.
 */
export function deleteMember(data: FamilyData, id: string): DeleteResult {
  const idx = data.members.findIndex((m) => m.id === id);
  if (idx === -1) {
    return { success: false, affectedMembers: [], error: "Không tìm thấy" };
  }

  const affectedMembers: string[] = [];
  for (const m of data.members) {
    if (m.id === id) continue;
    let touched = false;
    if (m.fatherId === id) {
      m.fatherId = null;
      touched = true;
    }
    if (m.motherId === id) {
      m.motherId = null;
      touched = true;
    }
    if (m.spouseIds.includes(id)) {
      m.spouseIds = m.spouseIds.filter((x) => x !== id);
      touched = true;
    }
    if (touched) affectedMembers.push(m.id);
  }

  data.members.splice(idx, 1);
  return { success: true, affectedMembers };
}
