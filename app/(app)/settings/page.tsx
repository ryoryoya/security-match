import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CompanySettingsForm from "@/components/company-settings-form";
import ProfileSettingsForm from "@/components/profile-settings-form";
import InvitePanel from "@/components/invite-panel";
import { INVITER_EMAILS } from "@/lib/access";
import type { CompanyContact, Invitation } from "@/lib/types";

export default async function SettingsPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const canInvite = INVITER_EMAILS.includes(
    (session.email ?? "").toLowerCase()
  );

  const { data: contact } = await supabase
    .from("company_contacts")
    .select("*")
    .eq("company_id", session.company.id)
    .maybeSingle();

  const { data: invitations } = canInvite
    ? await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false })
    : { data: [] as Invitation[] };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">設定</h1>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          通知先
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          新規案件・応募の通知が届く宛先です。
        </p>
        <ProfileSettingsForm profile={session.profile} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">会社情報</h2>
        <CompanySettingsForm
          company={session.company}
          contact={(contact as CompanyContact | null) ?? null}
        />
      </section>

      {canInvite && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            招待リンク
          </h2>
          <p className="text-sm text-slate-400 mb-3">
            つながりのある警備会社に招待リンクを発行できます。有効期限は14日間です。
          </p>
          <InvitePanel invitations={(invitations ?? []) as Invitation[]} />
        </section>
      )}
    </div>
  );
}
