"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

const NAV = [
  { href: "/", label: "ダッシュボード", icon: "🏠" },
  { href: "/jobs", label: "案件一覧", icon: "📋" },
  { href: "/jobs/new", label: "案件を募集", icon: "➕" },
  { href: "/my-applications", label: "応募履歴", icon: "📨" },
  { href: "/my-jobs", label: "自社案件", icon: "🏢" },
  { href: "/settings", label: "会社設定", icon: "⚙️" },
];

export default function Sidebar({
  companyName,
  userName,
}: {
  companyName: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden bg-slate-800 border-b border-slate-700 px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-white text-4xl">
          Sytac
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-slate-100 p-3 rounded-md hover:bg-slate-700 active:bg-slate-600 text-3xl leading-none w-12 h-12 flex items-center justify-center"
          aria-label="menu"
        >
          ☰
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-slate-800 border-r border-slate-700 md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen flex flex-col",
          open ? "block" : "hidden md:flex"
        )}
      >
        <div className="hidden md:block p-6 border-b border-slate-700">
          <p className="font-bold text-white text-4xl">Sytac</p>
          <p className="text-xs text-slate-400 mt-1 truncate">{companyName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                  active
                    ? "bg-sky-500/15 text-brand-300 font-medium"
                    : "text-slate-200 hover:bg-slate-700"
                )}
              >
                <span>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700 text-xs text-slate-400">
          <p className="px-3 py-1 truncate">{userName}</p>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-slate-200"
          >
            ログアウト
          </button>
        </div>
      </aside>
    </>
  );
}
