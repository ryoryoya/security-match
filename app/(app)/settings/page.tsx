import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CompanySettingsForm from "@/components/company-settings-form";
import ProfileSettingsForm from "@/components/profile-settings-form";
import InvitePanel from "@/components/invite-panel";
import type { Invitation } from "@/lib/types";

export default async function SettingsPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">設定</h1>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">
          通知メール
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          新規案件・応募の通知が届くメールアドレスです。ログイン用メールと別にできます。
        </p>
        <ProfileSettingsForm profile={session.profile} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">会社情報</h2>
        <CompanySettingsForm company={session.company} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">
          招待リンク
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          つながりのある警備会社に招待リンクを発行できます。有効期限は14日間です。
        </p>
        <InvitePanel invitations={(invitations ?? []) as Invitation[]} />
      </section>
    </div>
  );
}
