import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 leading-relaxed sm:px-8">
      <a href="/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent">
        ← Back
      </a>
      <h1 className="mt-8 text-5xl font-extrabold tracking-[-0.04em]">{title}</h1>
      <div className="mt-8 space-y-6 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold">{children}</div>
    </main>
  );
}
