import { readFamily } from "@/lib/storage";
import KinshipClient from "./KinshipClient";

export default async function KinshipPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const data = await readFamily();
  return (
    <KinshipClient
      members={data.members}
      initialFrom={searchParams.from ?? data.members[0]?.id ?? ""}
      initialTo={searchParams.to ?? data.members[1]?.id ?? ""}
    />
  );
}
