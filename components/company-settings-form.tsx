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
  const [contactPerson, setContactPerson] = useState(
    company.contact_person ?? ""
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
      .update({
        name,
        representative,
        contact_person: contactPerson,
        phone,
        address,
        prefecture,
      })
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
      <Field label="会社名" value={name} onChange={setName} />
      <Field
        label="代表者名"
        value={representative}
        onChange={setRepresentative}
      />
      <Field
        label="管制員 / 担当者名"
        value={contactPerson}
        onChange={setContactPerson}
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
          className="w-full rounded-md border border-white px-3 py-2 bg-white text-slate-900"
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
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-800 rounded px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-800 rounded px-3 py-2">
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
      <label className="block text-sm font-medium text-slate-200 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2"
      />
    </div>
  );
}
