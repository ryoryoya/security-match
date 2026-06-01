"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PREFECTURES } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  work_date: z.string().min(1, "日付は必須です"),
  start_time: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,2}:\d{2}$/.test(v), "HH:MM 形式で入力してください"),
  end_time: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,2}:\d{2}$/.test(v), "HH:MM 形式で入力してください"),
  prefecture: z.string().optional(),
  location: z.string().optional(),
  required_count: z.coerce.number().int().min(1, "1人以上"),
  unit_price: z.coerce.number().int().min(0),
  price_type: z.enum(["daily", "hourly"]),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function JobForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price_type: "daily", required_count: 1, unit_price: 15000 },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert({ ...values, company_id: companyId })
      .select("id")
      .single();
    if (error) {
      setServerError(error.message);
      return;
    }
    router.push(`/jobs/${data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
    >
      <Field label="タイトル" error={errors.title?.message} required>
        <input
          {...register("title")}
          placeholder="例: 交通誘導 札幌市中央区"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="作業日" error={errors.work_date?.message} required>
          <input
            type="date"
            {...register("work_date")}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label="開始時刻" error={errors.start_time?.message}>
          <input
            {...register("start_time")}
            placeholder="例: 09:00"
            inputMode="numeric"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label="終了時刻" error={errors.end_time?.message}>
          <input
            {...register("end_time")}
            placeholder="例: 18:00"
            inputMode="numeric"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="都道府県">
          <select
            {...register("prefecture")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">選択</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="場所・現場住所">
          <input
            {...register("location")}
            placeholder="例: 中央区大通西3丁目"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="必要人数"
          error={errors.required_count?.message}
          required
        >
          <input
            type="number"
            min={1}
            {...register("required_count")}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label="単価" error={errors.unit_price?.message} required>
          <input
            type="number"
            min={0}
            step={100}
            {...register("unit_price")}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label="単価種別">
          <select
            {...register("price_type")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="daily">日給</option>
            <option value="hourly">時給</option>
          </select>
        </Field>
      </div>

      <Field label="業務内容">
        <textarea
          {...register("description")}
          rows={4}
          placeholder={"例:\n集合場所: 札幌駅北口ロータリー\n集合時間: 08:30\n服装: 制服・安全靴\n持ち物: 誘導棒・ヘルメット"}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </Field>

      <Field label="備考">
        <textarea
          {...register("notes")}
          rows={3}
          placeholder={"例:\n4時間未満は人工保障\n雨天決行\n初回顔合わせあり"}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </Field>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {serverError}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2 rounded disabled:opacity-50"
        >
          {isSubmitting ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
