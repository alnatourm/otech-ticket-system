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
  const { data: created, error } = await supabase
    .from("tickets")
    .insert({
      title,
      description,
      category,
      priority,
      email: user.email,
      name: user.fullName,
      company_id: user.companyId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? t("uploadError") };
  }

  const isAgent = user.role === "agent" || user.role === "admin";
  const rawAttachments = String(formData.get("attachments") ?? "[]");
  let attachments: Array<{
    path: string;
    file_name: string;
    content_type: string;
    size_bytes: number;
  }> = [];
  try {
    const parsed: unknown = JSON.parse(rawAttachments);
    if (Array.isArray(parsed)) attachments = parsed as typeof attachments;
  } catch {
    return { error: t("uploadError") };
  }

  const ownFolder = isAgent ? "agents" : user.companyId;
  const valid = attachments.filter(
    (a) =>
      typeof a.path === "string" &&
      typeof a.file_name === "string" &&
      /^(agents|[0-9a-f-]{36})\/[0-9a-f-]{8,}\.[a-zA-Z0-9]+$/.test(a.path) &&
      (isAgent || a.path.startsWith(`${ownFolder}/`))
  );

  if (valid.length > 0) {
    const { error: attachmentError } = await supabase
      .from("ticket_attachments")
      .insert(
        valid.map((a) => ({
          ticket_id: created.id,
          file_path: a.path,
          file_name: a.file_name,
          content_type: a.content_type,
          size_bytes: a.size_bytes,
          uploaded_by: user.id,
        }))
      );
    if (attachmentError) {
      return { error: attachmentError.message };
    }
  }

  return { message: t("submitSuccess") };
}
