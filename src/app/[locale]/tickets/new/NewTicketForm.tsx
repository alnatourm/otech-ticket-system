"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["technical", "billing", "general", "feature"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export default function NewTicketForm() {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("tickets").insert({
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      email: String(data.get("email") ?? ""),
      name: String(data.get("name") ?? ""),
      category: String(data.get("category") ?? "general"),
      priority: String(data.get("priority") ?? "medium"),
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    form.reset();
    setTimeout(() => router.push("/tickets"), 1500);
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-800">
        {t("submitSuccess")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{t("title")}</label>
        <input
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("description")}</label>
        <textarea
          name="description"
          required
          rows={5}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">{t("name")}</label>
          <input name="name" className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")}</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">{t("category")}</label>
          <select name="category" className="w-full rounded-md border px-3 py-2">
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categoryOptions.${cat}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("priority")}</label>
          <select name="priority" className="w-full rounded-md border px-3 py-2">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`priorityOptions.${p}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? c("loading") : c("submit")}
      </button>
    </form>
  );
}