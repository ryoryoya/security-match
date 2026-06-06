import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";
import RealtimeNotifier from "@/components/realtime-notifier";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const supabase = await createClient();

  // Pending applications across our own jobs — drives the sidebar badge.
  const { count: pendingApplicationsCount } = await supabase
    .from("applications")
    .select("id, jobs!inner(company_id)", { count: "exact", head: true })
    .eq("jobs.company_id", session.company.id)
    .eq("status", "pending");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar
        companyName={session.company.name}
        userName={session.profile.display_name ?? session.email ?? ""}
        pendingApplicationsCount={pendingApplicationsCount ?? 0}
      />
      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
      <RealtimeNotifier myCompanyId={session.company.id} />
    </div>
  );
}
