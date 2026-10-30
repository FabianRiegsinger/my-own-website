import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
  back = { href: "/", label: "← Back" },
}: {
  title: string;
  children: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 leading-relaxed sm:px-8">
      <Link href={back.href} className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent">
        {back.label}
      </Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-8 space-y-6 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold">{children}</div>
    </main>
  );
}
