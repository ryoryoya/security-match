"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

type IconName =
  | "dashboard"
  | "jobs"
  | "archive"
  | "new-job"
  | "applications"
  | "my-jobs"
  | "settings";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "ダッシュボード", icon: "dashboard" },
  { href: "/jobs", label: "案件一覧", icon: "jobs" },
  { href: "/jobs/archive", label: "終了案件", icon: "archive" },
  { href: "/jobs/new", label: "案件を募集", icon: "new-job" },
  { href: "/my-applications", label: "応募履歴", icon: "applications" },
  { href: "/my-jobs", label: "自社案件", icon: "my-jobs" },
  { href: "/settings", label: "会社設定", icon: "settings" },
];

function NavIcon({ name }: { name: IconName }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-5 h-5 shrink-0",
    "aria-hidden": true,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M3 12 12 3l9 9" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "jobs":
      return (
        <svg {...common}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1.2" />
          <circle cx="4" cy="12" r="1.2" />
          <circle cx="4" cy="18" r="1.2" />
        </svg>
      );
    case "new-job":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case "archive":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
          <line x1="10" y1="13" x2="14" y2="13" />
        </svg>
      );
    case "applications":
      return (
        <svg {...common}>
          <path d="M22 6l-10 7L2 6" />
          <rect x="2" y="5" width="20" height="14" rx="2" />
        </svg>
      );
    case "my-jobs":
      return (
        <svg {...common}>
          <path d="M3 21V8l9-5 9 5v13" />
          <path d="M9 21v-7h6v7" />
          <line x1="3" y1="21" x2="21" y2="21" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}

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
        <Link
          href="/"
          className="text-white text-4xl tracking-tight"
          style={{ fontFamily: "var(--font-manrope)", fontWeight: 800 }}
        >
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
          <p
            className="text-white text-4xl tracking-tight"
            style={{ fontFamily: "var(--font-manrope)", fontWeight: 800 }}
          >
            Sytac
          </p>
          <p className="text-xs text-slate-400 mt-1 truncate">{companyName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {(() => {
            // 最も長く一致する href のみをアクティブにする
            // (例: /jobs/archive のとき /jobs はアクティブにしない)
            const matched = NAV.filter((item) =>
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/")
            ).sort((a, b) => b.href.length - a.href.length)[0];
            const activeHref = matched?.href;
            return NAV.map((item) => {
              const active = item.href === activeHref;
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
                  <NavIcon name={item.icon} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            });
          })()}
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
