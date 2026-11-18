"use server";

import { getTranslations } from "next-intl/server";
import { redirectTo } from "@/lib/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: {
    companyName?: string;
    fullName?: string;
    email?: string;
    password?: string;
    title?: string;
    description?: string;
  };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("auth");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return { error: t("invalidCredentials") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: t("invalidCredentials") };
  }

  return await redirectTo("/tickets");
}

export async function signUpAction(_state: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("auth");
  const companyName = String(formData.get("companyName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: FormState["fieldErrors"] = {};
  if (companyName.length < 2) fieldErrors.companyName = t("companyNameError");
  if (fullName.length < 2) fieldErrors.fullName = t("fullNameError");
  if (!EMAIL_RE.test(email)) fieldErrors.email = t("emailError");
  if (password.length < 8) fieldErrors.password = t("passwordError");
  if (password !== confirmPassword) fieldErrors.password = t("passwordMismatch");

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: t("fixFields") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        full_name: fullName,
        role: "company",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { message: t("checkEmail") };
  }

  return await redirectTo("/tickets");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return await redirectTo("/login");
}

export async function submitTicketAction(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("ticket");
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "general");
  const priority = String(formData.get("priority") ?? "medium");

  const fieldErrors: FormState["fieldErrors"] = {};
  if (title.length < 3) fieldErrors.title = t("titleError");
  if (description.length < 10) fieldErrors.description = t("descriptionError");

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: t("fixFields") };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tickets").insert({
    title,
    description,
    category,
    priority,
    email: user.email,
    name: user.fullName,
    company_id: user.companyId,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  return { message: t("submitSuccess") };
}
