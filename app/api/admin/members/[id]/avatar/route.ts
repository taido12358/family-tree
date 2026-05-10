import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readFamily, writeFamily } from "@/lib/storage";
import { findMember } from "@/lib/family";
import { getSession } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatar");
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Xoá mọi file avatar cũ của memberId này (bất kể đuôi) */
async function removeExistingAvatar(memberId: string) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const files = await fs.readdir(UPLOAD_DIR);
    for (const f of files) {
      if (f.startsWith(`${memberId}.`)) {
        await fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => null);
      }
    }
  } catch {
    /* ignore */
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ admin mới upload được ảnh đại diện" },
      { status: 403 }
    );
  }

  const data = await readFamily();
  const member = findMember(data, params.id);
  if (!member) {
    return NextResponse.json(
      { error: "Không tìm thấy thành viên" },
      { status: 404 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Body không phải multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Thiếu trường 'file' trong form" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Kích thước tối đa ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB` },
      { status: 400 }
    );
  }

  const mime = file.type;
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    return NextResponse.json(
      { error: `Định dạng không hỗ trợ: ${mime}. Chỉ chấp nhận JPG/PNG/WEBP/GIF.` },
      { status: 400 }
    );
  }

  // Xoá file cũ (nếu có) để không tích tụ
  await removeExistingAvatar(params.id);

  // Ghi file mới
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${params.id}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  // Cập nhật member.avatarUrl với cache-busting
  const url = `/uploads/avatar/${filename}?v=${Date.now()}`;
  const idx = data.members.findIndex((m) => m.id === params.id);
  data.members[idx] = { ...data.members[idx], avatarUrl: url };
  await writeFamily(data);

  return NextResponse.json({
    avatarUrl: url,
    member: data.members[idx],
  });
}

/** Xoá ảnh đại diện (đặt avatarUrl về null + xoá file). */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ admin mới xoá được ảnh đại diện" },
      { status: 403 }
    );
  }

  const data = await readFamily();
  const idx = data.members.findIndex((m) => m.id === params.id);
  if (idx === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy thành viên" },
      { status: 404 }
    );
  }

  await removeExistingAvatar(params.id);
  data.members[idx] = { ...data.members[idx], avatarUrl: null };
  await writeFamily(data);

  return NextResponse.json({ ok: true, member: data.members[idx] });
}
