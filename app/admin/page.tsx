import { redirect } from "next/navigation";
import { readFamily } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const data = await readFamily();
  return <AdminClient members={data.members} />;
}
