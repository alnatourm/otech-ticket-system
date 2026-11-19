import Image from "next/image";
import { getTranslations } from "next-intl/server";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const t = await getTranslations("auth");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-xl p-6 sm:p-8">
        <Image
          src="/logo.jpg"
          alt="OTECH"
          width={56}
          height={56}
          className="mb-5 h-14 w-14 rounded-full object-cover shadow-lg shadow-indigo-300/50"
          priority
        />
        <h1 className="gradient-text text-2xl font-bold">{t("signUpTitle")}</h1>
        <p className="muted mt-2">{t("signUpSubtitle")}</p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
