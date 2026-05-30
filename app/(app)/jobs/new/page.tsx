import { requireSession } from "@/lib/auth";
import JobForm from "@/components/job-form";

export default async function NewJobPage() {
  const session = await requireSession();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">案件を投稿</h1>
      <p className="text-sm text-slate-500 mb-6">
        不足している日時・場所・人数・単価を入力してください。ネットワーク内の他社から応募が届きます。
      </p>
      <JobForm companyId={session.company.id} />
    </div>
  );
}
