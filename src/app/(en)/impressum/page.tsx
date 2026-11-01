import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { alternatesFor } from "@/lib/locale";

export const metadata: Metadata = { title: "Impressum", robots: { index: false }, alternates: { languages: alternatesFor("/impressum") } };

export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Fabian Riegsinger
        <br />
        c/o Online-Impressum 12540
        <br />
        Europaring 90
        <br />
        53757 Sankt Augustin
        <br />
        Deutschland
      </p>
      <h2>Kontakt</h2>
      {/* Shown as text on purpose: § 5 DDG requires the address to be readable, unlike the click-only EmailLink. */}
      <p>
        E-Mail: friegsinger@mail.online-impressum.de
      </p>
      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>Fabian Riegsinger, Anschrift wie oben</p>
    </LegalPage>
  );
}
