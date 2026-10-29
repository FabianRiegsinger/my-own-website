import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <LegalPage title="Page not found">
      <p>
        This page does not exist.{" "}
        <Link href="/" className="text-accent underline-offset-4 hover:underline">
          Go to the home page
        </Link>
        .
      </p>
    </LegalPage>
  );
}
