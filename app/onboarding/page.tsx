"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md bg-white border border-amber-200 rounded-xl p-6 text-center">
        <h1 className="text-lg font-bold text-amber-700 mb-2">
          会社情報がまだありません
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          このアカウントには会社プロフィールが紐付いていません。既存メンバーから招待リンクを取得してサインアップしてください。
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded border border-slate-300 hover:bg-slate-50"
          >
            ログイン画面へ
          </Link>
          <button
            onClick={logout}
            className="text-sm px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    </main>
  );
}
