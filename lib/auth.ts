import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Company, Profile } from "@/lib/types";

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile;
  company: Company;
}

/**
 * Fetches the authenticated user, their profile, and their company.
 * Redirects to /login (no user) or /onboarding (user without profile).
 * Use in Server Components inside the (app) layout group.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile as Profile,
    company: company as Company,
  };
}
