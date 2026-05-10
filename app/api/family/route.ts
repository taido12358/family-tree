import { NextResponse } from "next/server";
import { readFamily } from "@/lib/storage";

export async function GET() {
  const data = await readFamily();
  return NextResponse.json(data);
}
