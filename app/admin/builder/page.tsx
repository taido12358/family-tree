import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { readFamily } from "@/lib/storage";
import BuilderClient from "./BuilderClient";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
  const data = await readFamily();
  return <BuilderClient members={data.members} />;
}
