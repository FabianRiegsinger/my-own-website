import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Impressum", robots: { index: false } };

// Template only — not legal advice. Fill every [TO FILL] before going live (§ 5 DDG).
export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Fabian Riegsinger
        <br />
        [TO FILL: Straße und Hausnummer]
        <br />
        [TO FILL: PLZ] Ingolstadt
        <br />
        Deutschland
      </p>
      <h2>Kontakt</h2>
      <p>E-Mail: [TO FILL: E-Mail-Adresse]</p>
      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>Fabian Riegsinger, Anschrift wie oben</p>
    </LegalPage>
  );
}
