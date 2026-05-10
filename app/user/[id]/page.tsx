import { notFound } from "next/navigation";
import { readFamily } from "@/lib/storage";
import { findMember, canEdit as canEditFn } from "@/lib/family";
import { getSession } from "@/lib/auth";
import UserDetailView from "./UserDetailView";

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await readFamily();
  const member = findMember(data, params.id);
  if (!member) notFound();

  const session = await getSession();
  const editable = canEditFn(data, session, member.id);

  return (
    <UserDetailView
      member={member}
      members={data.members}
      editable={editable}
    />
  );
}
