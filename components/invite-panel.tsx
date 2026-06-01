"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Invitation } from "@/lib/types";

export default function InvitePanel({
  invitations,
}: {
  invitations: Invitation[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function issue() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("create_invitation", {
      p_email: email || null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="相手の連絡先メール (任意)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500 px-3 py-2"
        />
        <button
          onClick={issue}
          disabled={loading}
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "発行中..." : "招待リンク発行"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-800 rounded px-3 py-2">
          {error}
        </p>
      )}

      {invitations.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg divide-y divide-slate-700">
          {invitations.map((inv) => {
            const used = !!inv.used_at;
            const expired = new Date(inv.expires_at) < new Date();
            return (
              <div key={inv.id} className="p-4 text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-400 truncate">
                      /invite/{inv.token.slice(0, 10)}...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {inv.email && <>送信先: {inv.email} ・ </>}
                      期限: {new Date(inv.expires_at).toLocaleDateString("ja-JP")}
                      {used && " ・ 使用済み"}
                      {!used && expired && " ・ 期限切れ"}
                    </p>
                  </div>
                  {!used && !expired && (
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="text-xs border border-slate-600 px-3 py-1 rounded hover:bg-slate-700"
                    >
                      {copied === inv.token ? "コピー済" : "URLコピー"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-6 text-center text-sm text-slate-400">
          まだ招待は発行されていません。
        </div>
      )}
    </div>
  );
}
