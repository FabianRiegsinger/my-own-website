import { NextResponse, type NextRequest } from "next/server";
import { homeRedirect, LOCALE_COOKIE } from "@/lib/locale";

export function proxy(request: NextRequest) {
  const target = homeRedirect({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    country: request.headers.get("x-vercel-ip-country"),
  });
  if (!target) return NextResponse.next();
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(LOCALE_COOKIE, "de", { path: "/", maxAge: 31536000, sameSite: "lax" });
  return response;
}

export const config = { matcher: "/" };
