"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";
import { PREFECTURES } from "@/lib/types";

export default function CompanySettingsForm({ company }: { company: Company }) {
  const router = useRouter();
  const [name, setName] = useState(company.name);
  const [representative, setRepresentative] = useState(
    company.representative ?? ""
  );
  const [phone, setPhone] = useState(company.phone ?? "");
  const [address, setAddress] = useState(company.address ?? "");
  const [prefecture, setPrefecture] = useState(company.prefecture ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("companies")
      .update({ name, representative, phone, address, prefecture })
      .eq("id", company.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("保存しました");
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
      <Field label="会社名" value={name} onChange={setName} />
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
        >
          <option value="">選択</option>
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
      {message && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {message}
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={loading}
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
      />
    </div>
  );
}
