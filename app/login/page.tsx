"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          security-match
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          警備会社向け 人員マッチングネットワーク
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-md transition disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 text-sm text-slate-300 space-y-2">
          <p>
            初めてご利用の方は、既存メンバーから届いた
            <strong>招待リンク</strong>からサインアップしてください。
          </p>
          <p>
            まだネットワークに会社がない場合は{" "}
            <Link href="/signup" className="text-brand-300 hover:underline">
              初回会社登録
            </Link>
            から。
          </p>
        </div>
      </div>
    </main>
  );
}
