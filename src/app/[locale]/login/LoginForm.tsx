"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction, type FormState } from "@/app/actions/auth";

const initialState: FormState = {};

export default function LoginForm() {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
          {state.error}
        </p>
      )}

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
          className="input"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? c("loading") : t("signIn")}
      </button>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("noAccount")}{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          {t("signUp")}
        </Link>
      </p>
    </form>
  );
}
