import { notFound, redirect } from "next/navigation";
import { readFamily } from "@/lib/storage";
import { findMember, canEdit as canEditFn } from "@/lib/family";
import { getSession } from "@/lib/auth";
import EditForm from "./EditForm";

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await readFamily();
  const member = findMember(data, params.id);
  if (!member) notFound();

  const session = await getSession();
  if (!session) redirect(`/login`);
  if (!canEditFn(data, session, member.id)) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="glass-strong rounded-2xl p-6 grain border-rose-base/30 border">
          <div className="font-mono text-[10px] tracking-[0.3em] text-rose-glow/70 mb-2">
            ⚠ TRUY CẬP BỊ TỪ CHỐI
          </div>
          <h2 className="font-display text-2xl text-rose-glow mb-2">
            Không có quyền chỉnh sửa
          </h2>
          <p className="text-white/60 text-sm">
            Chỉ chủ tài khoản của chính người đó, vợ/chồng, hoặc bố/mẹ của
            người đó (admin sửa được tất cả) mới được phép chỉnh sửa hồ sơ này.
          </p>
        </div>
      </div>
    );
  }

  return <EditForm member={member} allMembers={data.members} />;
}
