"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signUpAction, type FormState } from "@/app/actions/auth";

const initialState: FormState = {};

export default function SignupForm() {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const [state, action, pending] = useActionState(signUpAction, initialState);

  const fields = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
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
        <label htmlFor="companyName" className="block text-sm font-medium mb-1">
          {t("companyName")}
        </label>
        <input
          id="companyName"
          name="companyName"
          required
          className="w-full rounded-md border px-3 py-2"
        />
        {fields.companyName && (
          <p className="mt-1 text-xs text-red-600">{fields.companyName}</p>
        )}
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-1">
          {t("fullName")}
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          className="w-full rounded-md border px-3 py-2"
        />
        {fields.fullName && (
          <p className="mt-1 text-xs text-red-600">{fields.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border px-3 py-2"
        />
        {fields.email && <p className="mt-1 text-xs text-red-600">{fields.email}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            {t("confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>
      {fields.password && <p className="text-xs text-red-600">{fields.password}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? c("loading") : t("createAccount")}
      </button>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
