import { readFamily } from "@/lib/storage";
import { canEdit as canEditFn } from "@/lib/family";
import { getSession } from "@/lib/auth";
import HomeClient from "./HomeClient";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { root?: string; sel?: string };
}) {
  const data = await readFamily();
  const session = await getSession();

  const defaultRoot = session?.memberId
    ? data.members.find((m) => m.id === session.memberId)?.id ??
      data.members[0]?.id
    : data.members[0]?.id;

  const rootId = searchParams.root ?? defaultRoot ?? "";
  const selId = searchParams.sel ?? rootId;

  const editPermissions: Record<string, boolean> = {};
  for (const m of data.members) {
    editPermissions[m.id] = canEditFn(data, session, m.id);
  }

  return (
    <HomeClient
      members={data.members}
      initialRootId={rootId}
      initialSelectedId={selId}
      session={session}
      editPermissions={editPermissions}
    />
  );
}
