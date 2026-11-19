"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  Globe,
  LayoutDashboard,
  LogOut,
  Search,
  Settings2,
  ShieldCheck,
  Ticket,
  TicketPlus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { logoutAction } from "@/app/actions/auth";

export type ShellUser = {
  name: string | null;
  email: string;
  company: string | null;
  role: string;
};

type Props = {
  user: ShellUser | null;
  locale: string;
  children: ReactNode;
};

export default function AppShell({ user, locale, children }: Props) {
  const pathname = usePathname() || "/";
  const clean = pathname.replace(/^\/(en|ar)/, "") || "/";
  const isAuthPage = clean === "/login" || clean === "/signup";
  const t = useTranslations("nav");
  const d = useTranslations("dashboard");
  const a = useTranslations("auth");
  const isAgent = user?.role === "agent" || user?.role === "admin";
  const otherLocale = locale === "ar" ? "en" : "ar";
  const displayName = user?.name || user?.company || user?.email || "";

  const links = [
    { href: "/", label: t("home"), icon: LayoutDashboard, match: "/" },
    { href: "/tickets/new", label: t("newTicket"), icon: TicketPlus, match: "/tickets/new" },
    { href: "/tickets", label: t("myTickets"), icon: Ticket, match: "/tickets" },
    ...(isAgent
      ? [{ href: "/agent", label: t("agentDashboard"), icon: ShieldCheck, match: "/agent" }]
      : []),
  ];

  if (isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1600px] gap-5">
        <aside className="glass-side sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 flex-col p-4 lg:flex">
          <Link href="/" className="mb-8 flex items-center gap-3 px-2 pt-2">
            <Image
              src="/logo.jpg"
              alt="OTECH"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover shadow-md shadow-indigo-300/50"
              priority
            />
            <span className="leading-tight">
              <span className="block text-sm font-bold text-slate-800">OTECH</span>
              <span className="block text-[11px] font-medium tracking-wide text-indigo-500">
                SUPPORT
              </span>
            </span>
          </Link>

          <nav className="flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon, match }) => {
              const active = match === "/" ? clean === "/" : clean.startsWith(match);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${active ? "nav-link-active" : ""}`}
                >
                  <Icon size={18} className="nav-icon" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1">
            <Link href="/" locale={otherLocale} className="nav-link">
              <Globe size={18} className="nav-icon" />
              <span>{t("switchLang")}</span>
            </Link>
            <div className="nav-link cursor-default">
              <Settings2 size={18} className="nav-icon" />
              <span className="min-w-0 truncate">{d("yourWorkspace")}</span>
            </div>
            <div className="my-3 border-t border-white/70" />
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 px-2">
                  <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-800">
                      {displayName}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {user.email}
                    </span>
                  </span>
                </div>
                <form action={logoutAction}>
                  <button type="submit" className="nav-link w-full text-start text-rose-600">
                    <LogOut size={18} />
                    <span>{a("signOut")}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Link href="/login" className="nav-link">
                  <ShieldCheck size={18} className="nav-icon" />
                  <span>{a("signIn")}</span>
                </Link>
                <Link href="/signup" className="nav-link">
                  <TicketPlus size={18} className="nav-icon" />
                  <span>{a("signUp")}</span>
                </Link>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="glass mb-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="lg:hidden">
                <Image src="/logo.jpg" alt="OTECH" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-500">
                  {d("workspace")}
                </p>
                <h2 className="text-sm font-semibold text-slate-800">
                  {d("welcome")}{user ? `, ${displayName.split(" ")[0]}` : ""}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search size={15} className="absolute inset-y-0 start-3 my-auto text-slate-400" />
                <input
                  className="input w-48 ps-9 md:w-64"
                  placeholder={d("searchPlaceholder")}
                  aria-label={d("searchPlaceholder")}
                  readOnly
                />
              </div>
              <Link
                href="/"
                locale={otherLocale}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-indigo-600 lg:hidden"
                aria-label={t("switchLang")}
              >
                <Globe size={17} />
              </Link>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-slate-500">
                <Bell size={17} />
                <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
            </div>
          </header>

          <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
            {links.map(({ href, label, match }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link bg-white/60 ${match === clean || (match !== "/" && clean.startsWith(match)) ? "nav-link-active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
