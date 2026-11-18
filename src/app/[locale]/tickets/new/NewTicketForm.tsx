"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { submitTicketAction, type FormState } from "@/app/actions/auth";

const CATEGORIES = ["technical", "billing", "general", "feature"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const initialState: FormState = {};

export default function NewTicketForm() {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const [state, action, pending] = useActionState(submitTicketAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const fields = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  return (
    <form ref={formRef} action={action} className="space-y-5">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-md border px-3 py-2"
        />
        {fields.title && <p className="mt-1 text-xs text-red-600">{fields.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-md border px-3 py-2"
        />
        {fields.description && (
          <p className="mt-1 text-xs text-red-600">{fields.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            {t("category")}
          </label>
          <select id="category" name="category" className="w-full rounded-md border px-3 py-2">
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categoryOptions.${cat}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            {t("priority")}
          </label>
          <select id="priority" name="priority" className="w-full rounded-md border px-3 py-2">
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
        disabled={pending}
        className="rounded-md bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? c("loading") : c("submit")}
      </button>
    </form>
  );
}
