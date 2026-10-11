type Env = Partial<Record<"NEXT_PUBLIC_SITE_URL" | "VERCEL_PROJECT_PRODUCTION_URL", string>>;

/** Explicit URL, else the production domain Vercel sets automatically, else local dev. */
export function siteUrl(env: Env): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = siteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});
