import { getTranslations } from "next-intl/server";
import { LifeBuoy } from "lucide-react";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-md p-6 sm:p-8">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-400/30">
          <LifeBuoy size={22} />
        </span>
        <h1 className="gradient-text text-2xl font-bold">{t("signInTitle")}</h1>
        <p className="muted mt-2">{t("signInSubtitle")}</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
