"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PREFECTURES } from "@/lib/types";

const UNDECIDED = "__undecided__";
const FREE = "__free__";
const NOT_SELECTED = "__not_selected__";

const timeField = (label: string) =>
  z
    .string({
      required_error: `${label}を入力するか未定を選択してください`,
      invalid_type_error: `${label}を入力するか未定を選択してください`,
    })
    .nullable()
    .refine(
      (v) => v === null || /^\d{1,2}:\d{2}$/.test(v),
      "HH:MM 形式で入力してください"
    );

const schema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  work_date: z
    .string({
      required_error: "作業日を選択してください",
      invalid_type_error: "作業日を選択してください",
    })
    .min(1, "作業日を選択してください"),
  start_time: timeField("開始時刻"),
  end_time: timeField("終了時刻"),
  prefecture: z
    .string({
      required_error: "都道府県を選択してください",
      invalid_type_error: "都道府県を選択してください",
    })
    .nullable()
    .refine(
      (v) => v === null || v.length > 0,
      "都道府県を選択してください"
    ),
  location: z.string().optional(),
  required_count: z
    .number({
      required_error: "必要人工を選択してください",
      invalid_type_error: "必要人工を選択してください",
    })
    .int()
    .min(1, "1人以上")
    .nullable(),
  unit_price: z
    .number({
      required_error: "単価を選択してください",
      invalid_type_error: "単価を選択してください",
    })
    .int()
    .min(0)
    .nullable(),
  price_type: z
    .enum(["daily", "hourly"], {
      required_error: "単価種別を選択してください",
      invalid_type_error: "単価種別を選択してください",
    })
    .nullable(),
  shift_type: z
    .enum(["day", "night", "business_trip"], {
      required_error: "勤務区分を選択してください",
      invalid_type_error: "勤務区分を選択してください",
    })
    .nullable(),
  designated_route: z
    .boolean({
      required_error: "指定路線を選択してください",
      invalid_type_error: "指定路線を選択してください",
    })
    .nullable(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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
      prefecture: "北海道",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const payload = {
      ...values,
      work_date: values.work_date,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      prefecture: values.prefecture || null,
      required_count: values.required_count ?? null,
      unit_price: values.unit_price ?? null,
      price_type: values.price_type ?? null,
      shift_type: values.shift_type ?? null,
      designated_route: values.designated_route ?? null,
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
          className="w-full rounded-md border border-white bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2"
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <Field label="勤務区分" error={errors.shift_type?.message} width="w-32">
          <Controller
            name="shift_type"
            control={control}
            render={({ field }) => (
              <select
                value={
                  field.value === undefined
                    ? ""
                    : field.value === null
                      ? UNDECIDED
                      : field.value
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") field.onChange(undefined);
                  else if (v === UNDECIDED) field.onChange(null);
                  else
                    field.onChange(
                      v as "day" | "night" | "business_trip"
                    );
                }}
                className="w-32 rounded-md border border-white px-3 py-2 bg-white text-slate-900"
              >
                <option value="" disabled>
                  選択してください
                </option>
                <option value="day">日勤</option>
                <option value="night">夜勤</option>
                <option value="business_trip">出張</option>
                <option value={UNDECIDED}>未定</option>
              </select>
            )}
          />
        </Field>
        <Field label="作業日" error={errors.work_date?.message} required>
          <Controller
            name="work_date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={(field.value as string | undefined) ?? ""}
                onChange={field.onChange}
                width="w-44"
              />
            )}
          />
        </Field>
        <Field label="開始時刻" error={errors.start_time?.message}>
          <Controller
            name="start_time"
            control={control}
            render={({ field }) => (
              <InputWithUndecided
                value={field.value as string | null | undefined}
                onChange={field.onChange}
                inputType="text"
                placeholder="例: 09:00"
                width="w-28"
              />
            )}
          />
        </Field>
        <Field label="終了時刻" error={errors.end_time?.message}>
          <Controller
            name="end_time"
            control={control}
            render={({ field }) => (
              <InputWithUndecided
                value={field.value as string | null | undefined}
                onChange={field.onChange}
                inputType="text"
                placeholder="例: 18:00"
                width="w-28"
              />
            )}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <Field label="都道府県" error={errors.prefecture?.message} width="w-40">
          <Controller
            name="prefecture"
            control={control}
            render={({ field }) => (
              <SelectWithUndecided
                value={field.value as string | null | undefined}
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
            className="w-full rounded-md border border-white bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2"
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
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                presets={COUNT_PRESETS}
                inputType="number"
                width="w-32"
                unit="名"
              />
            )}
          />
        </Field>
        <Field
          label="指定路線(資格者配置)"
          error={errors.designated_route?.message}
          width="w-40"
        >
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
                      : field.value === null
                        ? UNDECIDED
                        : ""
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") field.onChange(undefined);
                  else if (v === UNDECIDED) field.onChange(null);
                  else field.onChange(v === "true");
                }}
                className="w-40 rounded-md border border-white px-3 py-2 bg-white text-slate-900"
              >
                <option value="" disabled>
                  選択してください
                </option>
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
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                presets={PRICE_PRESETS}
                inputType="number"
                width="w-40"
                unit="円"
              />
            )}
          />
        </Field>
        <Field label="単価種別" error={errors.price_type?.message} width="w-32">
          <Controller
            name="price_type"
            control={control}
            render={({ field }) => (
              <select
                value={
                  field.value === undefined
                    ? ""
                    : field.value === null
                      ? UNDECIDED
                      : field.value
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") field.onChange(undefined);
                  else if (v === UNDECIDED) field.onChange(null);
                  else field.onChange(v as "daily" | "hourly");
                }}
                className="w-32 rounded-md border border-white px-3 py-2 bg-white text-slate-900"
              >
                <option value="" disabled>
                  選択してください
                </option>
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
          className="w-full rounded-md border border-white bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2"
        />
      </Field>

      <Field label="備考">
        <textarea
          {...register("notes")}
          rows={3}
          placeholder={"例:\n4時間未満は人工保障\n雨天決行\n初回顔合わせあり"}
          className="w-full rounded-md border border-white bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2"
        />
      </Field>

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-800 rounded px-3 py-2">
          入力に不備があります。赤字の項目をご確認ください。
        </p>
      )}

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
          {isSubmitting ? "送信中..." : "投稿する"}
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
  value: number | null | undefined;
  onChange: (v: number | null | undefined) => void;
  presets?: number[];
  inputType: "text" | "number" | "date";
  placeholder?: string;
  width: string;
  unit?: string;
}) {
  const presetList = presets ?? [];
  const isPreset =
    typeof value === "number" && presetList.includes(value);
  const initialMode: "preset" | "free" | "undecided" | "unset" =
    value === undefined
      ? "unset"
      : value === null
        ? "undecided"
        : isPreset
          ? "preset"
          : "free";
  const [mode, setMode] = useState<
    "preset" | "free" | "undecided" | "unset"
  >(initialMode);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === NOT_SELECTED) {
      setMode("unset");
      onChange(undefined);
    } else if (v === UNDECIDED) {
      setMode("undecided");
      onChange(null);
    } else if (v === FREE) {
      setMode("free");
      onChange(null);
    } else {
      setMode("preset");
      onChange(Number(v));
    }
  }

  const selectValue =
    mode === "unset"
      ? NOT_SELECTED
      : mode === "undecided"
        ? UNDECIDED
        : mode === "free"
          ? FREE
          : value == null
            ? NOT_SELECTED
            : String(value);

  return (
    <div className="flex flex-col gap-1">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        className={`${width} rounded-md border border-white px-3 py-2 bg-white text-slate-900`}
      >
        <option value={NOT_SELECTED} disabled>
          選択してください
        </option>
        {presetList.map((p) => (
          <option key={p} value={String(p)}>
            {unit ? `${p} ${unit}` : String(p)}
          </option>
        ))}
        <option value={FREE}>自由入力</option>
        <option value={UNDECIDED}>未定</option>
      </select>
      {mode === "free" && (
        <input
          type={inputType}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
          placeholder={placeholder}
          inputMode={inputType === "text" ? "numeric" : undefined}
          className={`${width} rounded-md border border-white bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2`}
        />
      )}
    </div>
  );
}

function DateInput({
  value,
  onChange,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  width: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = ref.current;
    if (!el) return;
    const anyEl = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof anyEl.showPicker === "function") {
      try {
        anyEl.showPicker();
        return;
      } catch {
        // フォールバックへ
      }
    }
    el.focus();
    el.click();
  }

  return (
    <div className={`relative ${width}`}>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white bg-white text-slate-900 px-3 py-2 pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label="カレンダーを開く"
        className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-600 hover:text-brand-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>
  );
}

function InputWithUndecided({
  value,
  onChange,
  inputType,
  placeholder,
  width,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  inputType: "text" | "number" | "date";
  placeholder?: string;
  width: string;
}) {
  const undecided = value === null;

  function toggleUndecided() {
    onChange(undecided ? "" : null);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type={inputType}
        value={value ?? ""}
        disabled={undecided}
        onChange={(e) => onChange(e.target.value)}
        placeholder={undecided ? "未定" : placeholder}
        className={`${width} rounded-md border border-white bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 disabled:opacity-60`}
      />
      <button
        type="button"
        onClick={toggleUndecided}
        className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${
          undecided
            ? "bg-brand-500/20 border-brand-500 text-brand-200"
            : "border-slate-600 text-slate-300 hover:bg-slate-700"
        }`}
      >
        未定
      </button>
    </div>
  );
}

function SelectWithUndecided({
  value,
  onChange,
  options,
  width,
}: {
  value: string | null | undefined;
  onChange: (v: string | null | undefined) => void;
  options: readonly string[];
  width: string;
}) {
  const selectValue =
    value === undefined || value === ""
      ? NOT_SELECTED
      : value === null
        ? UNDECIDED
        : value;
  return (
    <select
      value={selectValue}
      onChange={(e) => {
        const v = e.target.value;
        if (v === NOT_SELECTED) onChange(undefined);
        else if (v === UNDECIDED) onChange(null);
        else onChange(v);
      }}
      className={`${width} rounded-md border border-white px-3 py-2 bg-white text-slate-900`}
    >
      <option value={NOT_SELECTED} disabled>
        選択してください
      </option>
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
