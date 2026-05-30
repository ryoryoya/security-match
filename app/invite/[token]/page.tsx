"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PREFECTURES } from "@/lib/types";

interface InvitationInfo {
  inviting_company_name: string;
  expires_at: string;
  valid: boolean;
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

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

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("lookup_invitation", {
        p_token: token,
      });
      if (error) {
        setLookupError(error.message);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setLookupError("招待リンクが見つかりません。");
        return;
      }
      setInfo(row);
    })();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      { email, password }
    );
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (!signUpData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setLoading(false);
        setError("サインアップ後のログインに失敗しました。");
        return;
      }
    }

    const { error: rpcError } = await supabase.rpc("accept_invitation", {
      p_token: token,
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

  if (lookupError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-red-200 rounded-xl p-6 text-center">
          <h1 className="text-lg font-bold text-red-600 mb-2">
            招待リンクが無効です
          </h1>
          <p className="text-sm text-slate-600">{lookupError}</p>
        </div>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">読み込み中...</p>
      </main>
    );
  }

  if (!info.valid) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-amber-200 rounded-xl p-6 text-center">
          <h1 className="text-lg font-bold text-amber-700 mb-2">
            この招待リンクは利用できません
          </h1>
          <p className="text-sm text-slate-600">
            期限切れまたは既に使用されています。招待元の会社にご連絡ください。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <p className="text-xs text-brand-600 font-medium mb-1">招待</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {info.inviting_company_name} からの招待
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          会社情報とアカウント情報を入力してサインアップしてください。
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              都道府県
            </label>
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-md transition disabled:opacity-50"
          >
            {loading ? "参加中..." : "ネットワークに参加"}
          </button>
        </form>
      </div>
    </main>
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
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
