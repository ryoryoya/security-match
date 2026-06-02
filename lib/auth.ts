import { cache } from "react";
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
 *
 * Wrapped in React `cache()` so that calling it from both the (app) layout
 * and a page within the same request only triggers one round-trip to
 * Supabase Auth / DB instead of two.
 */
export const requireSession = cache(async (): Promise<SessionContext> => {
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
});
