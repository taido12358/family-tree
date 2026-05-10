import { redirect } from "next/navigation";
import { readFamily } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import NewMemberForm from "./NewMemberForm";

export default async function NewMemberPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
  const data = await readFamily();
  return <NewMemberForm allMembers={data.members} />;
}
