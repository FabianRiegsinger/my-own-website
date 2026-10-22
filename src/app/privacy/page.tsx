import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy", robots: { index: false } };

// Template only — not legal advice. Review and fill every [TO FILL] before going live (GDPR).
export default function Privacy() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <h2>Verantwortlicher</h2>
      <p>Fabian Riegsinger, [TO FILL: Anschrift], [TO FILL: E-Mail-Adresse]</p>
      <h2>Hosting</h2>
      <p>
        Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Aufruf
        verarbeitet Vercel technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit, aufgerufene Seite und
        Browser-Informationen in Server-Logfiles. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse am sicheren und stabilen Betrieb). [TO FILL: Hinweis auf Datenübermittlung in die USA /
        Angemessenheitsbeschluss bzw. Standardvertragsklauseln prüfen.]
      </p>
      <h2>Cookies und Tracking</h2>
      <p>
        Diese Website setzt keine Cookies. Zur Reichweitenmessung nutzt sie Vercel Web Analytics (Vercel Inc., Anschrift
        siehe oben). Dabei werden aufgerufene Seite, Referrer, Land, Browser, Betriebssystem und Gerätetyp erfasst. Es
        werden keine Cookies gesetzt; Besucher werden über einen täglich wechselnden Hash aus IP-Adresse und Anfrage
        unterschieden, der nach 24 Stunden verworfen wird, sodass keine seitenübergreifende Wiedererkennung möglich ist.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Auswertung der Nutzung der
        Website). [TO FILL: Angaben mit der aktuellen Vercel-Dokumentation zu Web Analytics abgleichen.]
      </p>
      <h2>Externe Inhalte</h2>
      <p>
        Die Projektliste wird serverseitig von der GitHub-API geladen; dabei werden keine Daten der Besucher an GitHub
        übermittelt. Schriftarten werden lokal ausgeliefert.
      </p>
      <h2>Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch und
        Datenübertragbarkeit sowie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.
      </p>
    </LegalPage>
  );
}
