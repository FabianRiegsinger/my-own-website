import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 leading-relaxed sm:px-8">
      <a href="/" className="brutal brutal-press inline-flex min-h-11 items-center bg-signal px-4 font-mono text-sm font-bold uppercase">
        ← Back
      </a>
      <h1 className="mt-10 text-4xl font-bold uppercase tracking-tight sm:text-5xl">{title}</h1>
      <div className="mt-8 space-y-6 [&_h2]:mt-10 [&_h2]:font-mono [&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase">{children}</div>
    </main>
  );
}
