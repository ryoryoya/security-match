"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

const NAV = [
  { href: "/", label: "ダッシュボード", icon: "🏠" },
  { href: "/jobs", label: "案件一覧", icon: "📋" },
  { href: "/jobs/new", label: "案件を投稿", icon: "➕" },
  { href: "/my-jobs", label: "自社案件", icon: "🏢" },
  { href: "/messages", label: "メッセージ", icon: "💬" },
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
      <header className="md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-slate-900">
          security-match
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-slate-700 p-2"
          aria-label="menu"
        >
          ☰
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-white border-r border-slate-200 md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen flex flex-col",
          open ? "block" : "hidden md:flex"
        )}
      >
        <div className="hidden md:block p-6 border-b border-slate-200">
          <p className="font-bold text-slate-900">security-match</p>
          <p className="text-xs text-slate-500 mt-1 truncate">{companyName}</p>
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
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
          <p className="px-3 py-1 truncate">{userName}</p>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 text-slate-700"
          >
            ログアウト
          </button>
        </div>
      </aside>
    </>
  );
}
