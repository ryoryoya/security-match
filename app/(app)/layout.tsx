import { requireSession } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import RealtimeNotifier from "@/components/realtime-notifier";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar
        companyName={session.company.name}
        userName={session.profile.display_name ?? session.email ?? ""}
      />
      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
      <RealtimeNotifier myCompanyId={session.company.id} />
    </div>
  );
}
