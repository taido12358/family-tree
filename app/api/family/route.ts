import { NextResponse } from "next/server";
import { readFamily } from "@/lib/storage";

// Luôn đọc file mới nhất (trình dựng cây fetch lại sau mỗi thao tác lưu)
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readFamily();
  return NextResponse.json(data);
}
