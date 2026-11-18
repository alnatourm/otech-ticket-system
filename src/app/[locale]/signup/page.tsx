import { getTranslations } from "next-intl/server";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const t = await getTranslations("auth");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">{t("signUpTitle")}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
          {t("signUpSubtitle")}
        </p>
        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-800">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
