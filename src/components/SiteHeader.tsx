import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const c = await getTranslations("common");
  const n = await getTranslations("nav");
  const a = await getTranslations("auth");
  const isAgent = user?.role === "agent" || user?.role === "admin";
  const otherLocale = locale === "ar" ? "en" : "ar";

  return (
    <header className="border-b bg-white dark:bg-gray-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-bold">
          {c("brand")}
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/tickets/new" className="hover:underline">
            {n("newTicket")}
          </Link>
          <Link href="/tickets" className="hover:underline">
            {n("myTickets")}
          </Link>
          {isAgent && (
            <Link href="/agent" className="hover:underline">
              {n("agentDashboard")}
            </Link>
          )}
          <Link href="/" locale={otherLocale} className="hover:underline">
            {n("switchLang")}
          </Link>

          {user ? (
            <>
              <span className="text-gray-500">{user.companyName ?? user.email}</span>
              <form action={logoutAction}>
                <button type="submit" className="text-blue-600 hover:underline">
                  {a("signOut")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-blue-600 hover:underline">
                {a("signIn")}
              </Link>
              <Link href="/signup" className="text-blue-600 hover:underline">
                {a("signUp")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
