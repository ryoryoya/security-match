// Domain types (hand-written for MVP; swap to generated types via
// `supabase gen types typescript` once the schema stabilises).

export type CompanyRole = "owner" | "member";
export type JobStatus = "open" | "filled" | "closed";
export type PriceType = "daily" | "hourly";
export type ShiftType = "day" | "night" | "business_trip";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export const SHIFT_LABEL: Record<ShiftType, string> = {
  day: "日勤",
  night: "夜勤",
  business_trip: "出張",
};

export interface Company {
  id: string;
  name: string;
  representative: string | null;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  prefecture: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  display_name: string | null;
  role: CompanyRole;
  notification_email: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  work_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  prefecture: string | null;
  required_count: number | null;
  unit_price: number | null;
  price_type: PriceType | null;
  shift_type: ShiftType | null;
  designated_route: boolean | null;
  description: string | null;
  notes: string | null;
  status: JobStatus;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_company_id: string;
  offered_count: number;
  note: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface MessageThread {
  id: string;
  job_id: string;
  company_a_id: string;
  company_b_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_company_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  token: string;
  invited_by_company_id: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;
