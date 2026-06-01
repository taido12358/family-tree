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

  // Mặc định lấy người không có bố/mẹ và sinh sớm nhất làm gốc cây
  // (= ông tổ/bà tổ). Cây mọc xuống từ đó hiển thị toàn bộ con cháu.
  const rootless = data.members.filter((m) => !m.fatherId && !m.motherId);
  const oldestRootless = [...rootless].sort(
    (a, b) => (a.birthYear ?? 9999) - (b.birthYear ?? 9999)
  )[0];
  const defaultRoot = oldestRootless?.id ?? data.members[0]?.id;

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
