import { NextResponse } from "next/server";
import { readFamily, writeFamily } from "@/lib/storage";
import {
  findMember,
  createMember,
  syncSpouseSymmetry,
  validateMemberUpdate,
} from "@/lib/family";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ admin có quyền thêm thành viên" },
      { status: 403 }
    );
  }

  const data = await readFamily();
  const body = await req.json().catch(() => ({}));

  // Whitelist
  const allowed = [
    "name",
    "gender",
    "birthYear",
    "deathYear",
    "birthPlace",
    "occupation",
    "biography",
    "fatherId",
    "motherId",
    "spouseIds",
    "ownerEmail",
  ];
  const sanitized: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) sanitized[k] = body[k];
  }

  if (sanitized.fatherId === "") sanitized.fatherId = null;
  if (sanitized.motherId === "") sanitized.motherId = null;
  if (sanitized.ownerEmail === "") sanitized.ownerEmail = null;

  if (Array.isArray(sanitized.spouseIds)) {
    sanitized.spouseIds = Array.from(
      new Set((sanitized.spouseIds as string[]).filter(Boolean))
    );
  }

  // Validate cơ bản
  if (!(sanitized.name as string)?.trim()) {
    return NextResponse.json(
      { error: "Họ tên không được để trống" },
      { status: 400 }
    );
  }
  if (
    sanitized.fatherId &&
    sanitized.motherId &&
    sanitized.fatherId === sanitized.motherId
  ) {
    return NextResponse.json(
      { error: "Bố và mẹ không thể là cùng một người" },
      { status: 400 }
    );
  }
  // Tham chiếu tới người không tồn tại?
  for (const f of ["fatherId", "motherId"] as const) {
    if (sanitized[f] && !findMember(data, sanitized[f] as string)) {
      return NextResponse.json(
        { error: `Không tìm thấy ${f === "fatherId" ? "bố" : "mẹ"}` },
        { status: 400 }
      );
    }
  }
  if (Array.isArray(sanitized.spouseIds)) {
    for (const sid of sanitized.spouseIds as string[]) {
      if (!findMember(data, sid)) {
        return NextResponse.json(
          { error: `Không tìm thấy vợ/chồng có ID="${sid}"` },
          { status: 400 }
        );
      }
    }
  }
  // Năm sinh/mất
  const currentYear = new Date().getFullYear();
  const by = sanitized.birthYear as number | null | undefined;
  const dy = sanitized.deathYear as number | null | undefined;
  if (by != null && (by < 1000 || by > currentYear + 1)) {
    return NextResponse.json(
      { error: "Năm sinh không hợp lệ" },
      { status: 400 }
    );
  }
  if (dy != null && (dy < 1000 || dy > currentYear + 1)) {
    return NextResponse.json(
      { error: "Năm mất không hợp lệ" },
      { status: 400 }
    );
  }
  if (by != null && dy != null && dy < by) {
    return NextResponse.json(
      { error: "Năm mất phải bằng hoặc sau năm sinh" },
      { status: 400 }
    );
  }

  // Tạo thành viên
  const newMember = createMember(data, sanitized as Partial<typeof data.members[0]>);

  // Đồng bộ vợ/chồng hai chiều
  if (newMember.spouseIds.length > 0) {
    syncSpouseSymmetry(data, newMember.id, [], newMember.spouseIds);
  }

  // Validate sau khi tạo (kiểm tra cycle nếu có ai đó đã có cặp lệch)
  const errors = validateMemberUpdate(data, newMember.id, {
    fatherId: newMember.fatherId,
    motherId: newMember.motherId,
    spouseIds: newMember.spouseIds,
    birthYear: newMember.birthYear,
    deathYear: newMember.deathYear,
  });
  if (errors.length) {
    // Rollback
    data.members = data.members.filter((m) => m.id !== newMember.id);
    if (newMember.spouseIds.length > 0) {
      syncSpouseSymmetry(data, newMember.id, newMember.spouseIds, []);
    }
    return NextResponse.json(
      { error: errors.map((e) => e.message).join("\n") },
      { status: 400 }
    );
  }

  await writeFamily(data);
  return NextResponse.json({ member: newMember }, { status: 201 });
}
