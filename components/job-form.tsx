"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PREFECTURES } from "@/lib/types";

const UNDECIDED = "__undecided__";
const FREE = "__free__";

const optionalTime = z
  .string()
  .nullable()
  .optional()
  .refine(
    (v) => !v || /^\d{1,2}:\d{2}$/.test(v),
    "HH:MM 形式で入力してください"
  );

const schema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  work_date: z.string().nullable().optional(),
  start_time: optionalTime,
  end_time: optionalTime,
  prefecture: z.string().nullable().optional(),
  location: z.string().optional(),
  required_count: z
    .union([z.coerce.number().int().min(1, "1人以上"), z.null()])
    .optional(),
  unit_price: z.union([z.coerce.number().int().min(0), z.null()]).optional(),
  price_type: z.enum(["daily", "hourly"]).nullable().optional(),
  shift_type: z.enum(["day", "night", "business_trip"]).nullable().optional(),
  designated_route: z.boolean().nullable().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TIME_PRESETS = ["07:00", "08:00", "09:00", "10:00", "12:00", "13:00", "16:00", "17:00", "18:00", "20:00", "22:00"];
const COUNT_PRESETS = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20];
const PRICE_PRESETS = [10000, 12000, 13000, 15000, 18000, 20000, 25000, 30000];

export default function JobForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      price_type: "daily",
      required_count: 1,
      unit_price: 15000,
      prefecture: "北海道",
      designated_route: null,
      shift_type: null,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const payload = {
      ...values,
      work_date: values.work_date || null,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      prefecture: values.prefecture || null,
      required_count: values.required_count ?? null,
      unit_price: values.unit_price ?? null,
      price_type: values.price_type ?? null,
      shift_type: values.shift_type ?? null,
      company_id: companyId,
    };
    const { data, error } = await supabase
      .from("jobs")
      .insert(payload)
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
      className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4"
    >
      <Field label="タイトル" error={errors.title?.message} required>
        <input
          {...register("title")}
          placeholder="例: 交通誘導 札幌市中央区"
          className="w-full rounded-md border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 px-3 py-2"
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <Field label="勤務区分" width="w-32">
          <Controller
            name="shift_type"
            control={control}
            render={({ field }) => (
              <select
                value={field.value ?? UNDECIDED}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === UNDECIDED
                      ? null
                      : (e.target.value as "day" | "night" | "business_trip")
                  )
                }
                className="w-32 rounded-md border border-slate-600 px-3 py-2 bg-slate-800 text-white"
              >
                <option value="day">日勤</option>
                <option value="night">夜勤</option>
                <option value="business_trip">出張</option>
                <option value={UNDECIDED}>未定</option>
              </select>
            )}
          />
        </Field>
        <Field label="作業日" error={errors.work_date?.message} width="w-44">
          <Controller
            name="work_date"
            control={control}
            render={({ field }) => (
              <ComboInput
                value={field.value ?? ""}
                onChange={field.onChange}
                inputType="date"
                width="w-44"
              />
            )}
          />
        </Field>
        <Field label="開始時刻" error={errors.start_time?.message} width="w-36">
          <Controller
            name="start_time"
            control={control}
            render={({ field }) => (
              <ComboInput
                value={field.value ?? ""}
                onChange={field.onChange}
                presets={TIME_PRESETS}
                inputType="text"
                placeholder="HH:MM"
                width="w-36"
              />
            )}
          />
        </Field>
        <Field label="終了時刻" error={errors.end_time?.message} width="w-36">
          <Controller
            name="end_time"
            control={control}
            render={({ field }) => (
              <ComboInput
                value={field.value ?? ""}
                onChange={field.onChange}
                presets={TIME_PRESETS}
                inputType="text"
                placeholder="HH:MM"
                width="w-36"
              />
            )}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <Field label="都道府県" width="w-40">
          <Controller
            name="prefecture"
            control={control}
            render={({ field }) => (
              <SelectWithUndecided
                value={field.value ?? ""}
                onChange={field.onChange}
                options={PREFECTURES as readonly string[]}
                width="w-40"
              />
            )}
          />
        </Field>
        <Field label="場所・現場住所" width="flex-1 min-w-[16rem]">
          <input
            {...register("location")}
            placeholder="例: 中央区大通西3丁目"
            className="w-full rounded-md border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 px-3 py-2"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <Field
          label="必要人工"
          error={errors.required_count?.message}
          width="w-32"
        >
          <Controller
            name="required_count"
            control={control}
            render={({ field }) => (
              <ComboInput
                value={field.value == null ? "" : String(field.value)}
                onChange={(v) =>
                  field.onChange(v === "" ? null : Number(v))
                }
                presets={COUNT_PRESETS.map(String)}
                inputType="number"
                width="w-32"
                unit="名"
              />
            )}
          />
        </Field>
        <Field label="指定路線(資格者配置)" width="w-40">
          <Controller
            name="designated_route"
            control={control}
            render={({ field }) => (
              <select
                value={
                  field.value === true
                    ? "true"
                    : field.value === false
                      ? "false"
                      : UNDECIDED
                }
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(
                    v === "true" ? true : v === "false" ? false : null
                  );
                }}
                className="w-40 rounded-md border border-slate-600 px-3 py-2 bg-slate-800 text-white"
              >
                <option value="true">有</option>
                <option value="false">無</option>
                <option value={UNDECIDED}>未定</option>
              </select>
            )}
          />
        </Field>
        <Field label="単価" error={errors.unit_price?.message} width="w-40">
          <Controller
            name="unit_price"
            control={control}
            render={({ field }) => (
              <ComboInput
                value={field.value == null ? "" : String(field.value)}
                onChange={(v) =>
                  field.onChange(v === "" ? null : Number(v))
                }
                presets={PRICE_PRESETS.map(String)}
                inputType="number"
                width="w-40"
                unit="円"
              />
            )}
          />
        </Field>
        <Field label="単価種別" width="w-32">
          <Controller
            name="price_type"
            control={control}
            render={({ field }) => (
              <select
                value={field.value ?? UNDECIDED}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === UNDECIDED
                      ? null
                      : (e.target.value as "daily" | "hourly")
                  )
                }
                className="w-32 rounded-md border border-slate-600 px-3 py-2 bg-slate-800 text-white"
              >
                <option value="daily">日給</option>
                <option value="hourly">時給</option>
                <option value={UNDECIDED}>未定</option>
              </select>
            )}
          />
        </Field>
      </div>

      <Field label="業務内容">
        <textarea
          {...register("description")}
          rows={4}
          placeholder={"例:\n集合場所: 札幌駅北口ロータリー\n集合時間: 08:30\n服装: 制服・安全靴\n持ち物: 誘導棒・ヘルメット"}
          className="w-full rounded-md border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 px-3 py-2"
        />
      </Field>

      <Field label="備考">
        <textarea
          {...register("notes")}
          rows={3}
          placeholder={"例:\n4時間未満は人工保障\n雨天決行\n初回顔合わせあり"}
          className="w-full rounded-md border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 px-3 py-2"
        />
      </Field>

      {serverError && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-800 rounded px-3 py-2">
          {serverError}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded border border-slate-600 text-slate-200 hover:bg-slate-700"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2 rounded disabled:opacity-50"
        >
          {isSubmitting ? "送信中..." : "募集する"}
        </button>
      </div>
    </form>
  );
}

function ComboInput({
  value,
  onChange,
  presets,
  inputType,
  placeholder,
  width,
  unit,
}: {
  value: string;
  onChange: (v: string) => void;
  presets?: string[];
  inputType: "text" | "number" | "date";
  placeholder?: string;
  width: string;
  unit?: string;
}) {
  const presetList = presets ?? [];
  const isPreset = !!value && presetList.includes(value);
  const initialMode: "preset" | "free" | "undecided" =
    value === "" ? "undecided" : isPreset ? "preset" : "free";
  const [mode, setMode] = useState<"preset" | "free" | "undecided">(initialMode);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === UNDECIDED) {
      setMode("undecided");
      onChange("");
    } else if (v === FREE) {
      setMode("free");
      onChange("");
    } else {
      setMode("preset");
      onChange(v);
    }
  }

  const selectValue =
    mode === "undecided" ? UNDECIDED : mode === "free" ? FREE : value;

  return (
    <div className="flex flex-col gap-1">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        className={`${width} rounded-md border border-slate-600 px-3 py-2 bg-slate-800 text-white`}
      >
        {presetList.map((p) => (
          <option key={p} value={p}>
            {unit ? `${p} ${unit}` : p}
          </option>
        ))}
        <option value={FREE}>自由入力</option>
        <option value={UNDECIDED}>未定</option>
      </select>
      {mode === "free" && (
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputType === "text" ? "numeric" : undefined}
          className={`${width} rounded-md border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 px-3 py-2`}
        />
      )}
    </div>
  );
}

function SelectWithUndecided({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  width: string;
}) {
  return (
    <select
      value={value === "" ? UNDECIDED : value}
      onChange={(e) =>
        onChange(e.target.value === UNDECIDED ? "" : e.target.value)
      }
      className={`${width} rounded-md border border-slate-600 px-3 py-2 bg-slate-800 text-white`}
    >
      {options.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
      <option value={UNDECIDED}>未定</option>
    </select>
  );
}

function Field({
  label,
  error,
  required,
  width,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  width?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={width}>
      <label className="block text-sm font-medium text-slate-200 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
    </div>
  );
}
