"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReopenJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reopen() {
    if (
      !confirm(
        "この案件を再募集しますか？\nマッチング済みの応募はすべて『破談』に切り替わります。"
      )
    ) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("reopen_job", { p_job_id: jobId });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={reopen}
      disabled={loading}
      className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-50"
    >
      {loading ? "処理中..." : "再募集する"}
    </button>
  );
}
