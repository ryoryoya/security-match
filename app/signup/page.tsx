"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PREFECTURES } from "@/lib/types";

/**
 * Bootstrap the very first company in the network (only succeeds
 * if zero companies exist). Subsequent companies must use /invite/[token].
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [representative, setRepresentative] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // If email confirmation is required, session may be null.
    if (!signUpData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setLoading(false);
        setError(
          "サインアップ後のログインに失敗しました。メール確認が必要な場合は無効化してください。"
        );
        return;
      }
    }

    const { error: rpcError } = await supabase.rpc("bootstrap_first_company", {
      p_company_name: companyName,
      p_representative: representative,
      p_phone: phone,
      p_address: address,
      p_prefecture: prefecture,
      p_display_name: displayName,
    });

    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-8">
        <h1 className="text-2xl font-bold text-white mb-1">初回会社登録</h1>
        <p className="text-sm text-slate-400 mb-6">
          ネットワーク内の最初の1社として登録します。2社目以降は招待リンクから参加してください。
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Section title="アカウント">
            <Field
              label="メールアドレス"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="パスワード(8文字以上)"
              type="password"
              value={password}
              onChange={setPassword}
              required
              minLength={8}
            />
            <Field
              label="担当者氏名"
              value={displayName}
              onChange={setDisplayName}
              required
            />
          </Section>

          <Section title="会社情報">
            <Field
              label="会社名"
              value={companyName}
              onChange={setCompanyName}
              required
            />
            <Field
              label="代表者名"
              value={representative}
              onChange={setRepresentative}
            />
            <Field label="電話番号" value={phone} onChange={setPhone} />
            <Field label="住所" value={address} onChange={setAddress} />
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                都道府県
              </label>
              <select
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className="w-full rounded-md border border-slate-600 px-3 py-2 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </Section>

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
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-200 text-center">
          既にアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-brand-300 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-200 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full rounded-md border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
