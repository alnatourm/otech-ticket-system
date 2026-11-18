import { cache } from "react";
import { redirectTo } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "company" | "agent" | "admin";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, company_id, companies(name)")
    .eq("id", user.id)
    .maybeSingle();

  const company = profile?.companies as unknown as { name: string } | null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: (profile?.role as UserRole) ?? "company",
    companyId: profile?.company_id ?? null,
    companyName: company?.name ?? null,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) return await redirectTo("/login");
  return user;
}

export async function requireAgent(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "agent" && user.role !== "admin") {
    return await redirectTo("/tickets");
  }
  return user;
}
