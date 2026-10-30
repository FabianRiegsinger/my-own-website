import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, localePath, parseLocale, safeSwitchPage } from "@/lib/locale";

export function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("to")) ?? "en";
  const page = safeSwitchPage(request.nextUrl.searchParams.get("page"));
  const response = NextResponse.redirect(new URL(localePath(locale, page), request.url));
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return response;
}
