import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Seite nicht gefunden", robots: { index: false } };

export default function NotFoundDe() {
  return (
    <LegalPage title="Seite nicht gefunden" back={{ href: "/de", label: "← Zurück" }}>
      <p>
        Diese Seite gibt es nicht.{" "}
        <Link href="/de" className="text-accent underline-offset-4 hover:underline">
          Zur Startseite
        </Link>
        .
      </p>
    </LegalPage>
  );
}
