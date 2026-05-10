import { NextResponse } from "next/server";
import { verifyPassword, createSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Thiếu email hoặc mật khẩu" },
        { status: 400 }
      );
    }
    const session = await verifyPassword(email, password);
    if (!session) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }
    await createSessionCookie(session);
    return NextResponse.json({ ok: true, session });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
