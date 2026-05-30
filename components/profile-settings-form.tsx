"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [notificationEmail, setNotificationEmail] = useState(
    profile.notification_email ?? ""
  );
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        notification_email: notificationEmail || null,
        display_name: displayName || null,
      })
      .eq("id", profile.id);
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
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          担当者氏名
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          通知先メールアドレス
        </label>
        <input
          type="email"
          value={notificationEmail}
          onChange={(e) => setNotificationEmail(e.target.value)}
          placeholder="例: info@example.com"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <p className="text-xs text-slate-500 mt-1">
          空欄にすると通知メールは送信されません。
        </p>
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
