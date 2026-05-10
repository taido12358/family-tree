import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readFamily, writeFamily } from "@/lib/storage";
import {
  findMember,
  canEdit,
  validateMemberUpdate,
  syncSpouseSymmetry,
  deleteMember,
} from "@/lib/family";
import { getSession } from "@/lib/auth";

const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatar");

async function removeAvatarFiles(memberId: string) {
  try {
    const files = await fs.readdir(AVATAR_DIR);
    for (const f of files) {
      if (f.startsWith(`${memberId}.`)) {
        await fs.unlink(path.join(AVATAR_DIR, f)).catch(() => null);
      }
    }
  } catch {
    /* directory may not exist yet */
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const data = await readFamily();
  const m = findMember(data, params.id);
  if (!m) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ member: m });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const data = await readFamily();

  if (!canEdit(data, session, params.id)) {
    return NextResponse.json(
      { error: "Bạn không có quyền chỉnh sửa thành viên này" },
      { status: 403 }
    );
  }

  const idx = data.members.findIndex((m) => m.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  }

  const updates = await req.json();

  // Whitelist các field được phép sửa
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
  ];
  const sanitized: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in updates) sanitized[k] = updates[k];
  }

  // Chuẩn hoá: chuỗi rỗng -> null cho fatherId/motherId
  if (sanitized.fatherId === "") sanitized.fatherId = null;
  if (sanitized.motherId === "") sanitized.motherId = null;

  // Lọc spouseIds: bỏ rỗng, bỏ trùng
  if (Array.isArray(sanitized.spouseIds)) {
    sanitized.spouseIds = Array.from(
      new Set((sanitized.spouseIds as string[]).filter(Boolean))
    );
  }

  // Validate
  const errors = validateMemberUpdate(data, params.id, sanitized as any);
  if (errors.length) {
    return NextResponse.json(
      { error: errors.map((e) => e.message).join("\n"), details: errors },
      { status: 400 }
    );
  }

  // Áp dụng cập nhật
  const old = data.members[idx];
  const oldSpouseIds = [...old.spouseIds];
  data.members[idx] = { ...old, ...sanitized } as typeof old;

  // Đồng bộ vợ/chồng hai chiều
  if (Array.isArray(sanitized.spouseIds)) {
    syncSpouseSymmetry(
      data,
      params.id,
      oldSpouseIds,
      sanitized.spouseIds as string[]
    );
  }

  await writeFamily(data);
  return NextResponse.json({ member: data.members[idx] });
}

/**
 * DELETE: chỉ admin xoá được thành viên. Tự dọn mọi tham chiếu
 * (fatherId/motherId/spouseIds) trong các thành viên còn lại.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ admin có quyền xoá thành viên" },
      { status: 403 }
    );
  }

  const data = await readFamily();
  const result = deleteMember(data, params.id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Xoá thất bại" },
      { status: 404 }
    );
  }

  // Xoá file ảnh đại diện kèm theo
  await removeAvatarFiles(params.id);

  await writeFamily(data);
  return NextResponse.json({
    deleted: params.id,
    affectedMembers: result.affectedMembers,
  });
}
