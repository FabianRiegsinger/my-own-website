import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { cv } from "@/content/cv";

const email = `${cv.profile.links.email.user}@${cv.profile.links.email.domain}`;

export const metadata: Metadata = { title: "Privacy", robots: { index: false } };

// Template only — not legal advice. Review and fill every [TO FILL] before going live (GDPR).
export default function Privacy() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p>
        <a href="#en" lang="en" className="text-accent underline-offset-4 hover:underline">
          English version below
        </a>
      </p>
      <h2>Verantwortlicher</h2>
      <p>Fabian Riegsinger, [TO FILL: Anschrift], {email}</p>
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

      {/* Translation of the German text above; keep the two in step. */}
      <div lang="en" className="space-y-6 border-t border-ink/15 pt-10">
        <h2 id="en" className="scroll-mt-24">
          Privacy policy (English)
        </h2>
        <p>This translation is provided for convenience. The German version above is the binding one.</p>
        <h2>Controller</h2>
        <p>Fabian Riegsinger, [TO FILL: address], {email}</p>
        <h2>Hosting</h2>
        <p>
          This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you visit it,
          Vercel processes technically necessary data such as your IP address, the date and time, the page requested and
          browser information in server log files. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in running
          the site securely and reliably). [TO FILL: note on data transfer to the USA / check adequacy decision or
          standard contractual clauses.]
        </p>
        <h2>Cookies and tracking</h2>
        <p>
          This website does not set cookies. It uses Vercel Web Analytics (Vercel Inc., address above) to measure
          visits. Analytics records the page visited, the referrer, country, browser, operating system and device type.
          No cookies are set; visitors are told apart by a hash of the IP address and the request that changes daily and
          is discarded after 24 hours, so visitors cannot be recognised across sites. The legal basis is Art. 6(1)(f)
          GDPR (legitimate interest in understanding how the website is used). [TO FILL: check these details against
          Vercel&apos;s current Web Analytics documentation.]
        </p>
        <h2>External content</h2>
        <p>
          The list of projects is loaded from the GitHub API on the server; no visitor data is sent to GitHub. Fonts are
          served from this website itself.
        </p>
        <h2>Your rights</h2>
        <p>
          You have the right to access, rectification, erasure, restriction of processing, objection and data
          portability, and the right to lodge a complaint with a data protection supervisory authority.
        </p>
      </div>
    </LegalPage>
  );
}
