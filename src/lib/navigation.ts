import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

/** Redirects to a path inside the active locale (e.g. "/tickets" -> "/ar/tickets"). */
export async function redirectTo(path: string): Promise<never> {
  let locale = "en";
  try {
    locale = await getLocale();
  } catch {
    // Fall back to the default locale when called outside a request context.
  }
  redirect(`/${locale}${path}`);
}
