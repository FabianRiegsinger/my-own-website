import type { CV } from "./types";

export const cvDe: CV = {
  profile: {
    name: "Fabian Riegsinger",
    headline: "System-Integrations- & Softwareingenieur",
    location: "Ingolstadt, Deutschland",
    summary:
      "Ich bin Software- und Integrationsingenieur mit mehr als acht Jahren Erfahrung in der Automobilindustrie. Bei ESAS Automotive habe ich Software für autonome Fahrsysteme in C++ und Python entwickelt und zugleich Projektleitung übernommen. Bei Mobileye arbeite ich vor Ort beim Kunden an einem ADAS-Programm der Stufe 3 (Level 3): Ich baue und betreue eine große Flotte von Entwicklungsfahrzeugen und koordiniere kritische Probleme zwischen den Ingenieuren des OEM und dem R&D-Team von Mobileye. Zusätzlich entwickle ich agentische Software, die Wartungsabläufe für Testfahrzeuge automatisiert.",
    links: {
      github: "https://github.com/FabianRiegsinger",
      linkedin: "https://www.linkedin.com/in/fabian-riegsinger-736b78b7/",
      xing: "https://www.xing.com/profile/Fabian_Riegsinger",
      email: { user: "fabian.riegsinger", domain: "web.de" },
    },
  },
  experience: [
    {
      company: "Mobileye Germany GmbH",
      role: "Technical Support Resident (R&D), AUDI-Projekt",
      start: "2024-12",
      end: null,
      location: "Ingolstadt, Deutschland",
      highlights: [
        "Erste Eskalationsstelle bei AUDI für Software- und Integrationsprobleme im ADAS/AD-Stack auf rund 30 Testfahrzeugen.",
        "Sensor- und Wahrnehmungsprobleme aus Logs, CAN-/Ethernet-Mitschnitten und Fahrzeugtelemetrie analysieren; täglich mehrere Feldprobleme.",
        "Python-Werkzeuge entwickeln, die die Software-Auslieferung und Flottenupdates beschleunigen.",
        "Die Integration der EyeQ-Software in die Fahrzeugplattform von AUDI koordinieren: Fehlerberichte, Reproduktionsschritte, Verifikation der Fixes.",
        "Flashen, Softwareversionen und Kalibrierung über die gesamte Flotte pflegen.",
      ],
      tags: ["ADAS L3", "EyeQ", "Python", "CAN", "Automotive Ethernet"],
    },
    {
      company: "ESAS Automotive GmbH",
      role: "Softwareentwickler & Projektkoordinator",
      start: "2018-07",
      end: "2024-11",
      location: "Ingolstadt, Deutschland",
      highlights: [
        "Ein React/Electron/Capacitor-Werkzeug zur Umgebungsvisualisierung entwickelt, heute die Standardvisualisierung auf der Testflotte von AUDI.",
        "Vom Entwickler zum Koordinator eines Teams aus 4 Ingenieuren befördert; Bewerber vorausgewählt und technische Interviews geführt.",
        "C++-Module zur Sensorfusion entwickelt, die Kamera-, LiDAR- und Radar-Detektionen kombinieren.",
        "C++-Transformer für FlexRay-, CAN- und Ethernet-Protokolle zwischen Fremd- und Eigenkomponenten geschrieben.",
        "Cloud-Pipelines zur Datenauswertung und einen Route Evaluator in Python/React gebaut.",
      ],
      tags: ["C++", "Sensorfusion", "React", "FlexRay", "Teamleitung"],
    },
  ],
  education: [
    {
      degree: "M.Sc. Informations- und Kommunikationstechnik",
      school: "Technische Hochschule Mittelhessen, Friedberg",
      end: "2018-08",
      note: "Abschlussarbeit mit AUDI AG zu Bewertungsmetriken für die Bahnplanung",
    },
    {
      degree: "B.Eng. Informations- und Kommunikationstechnik",
      school: "Technische Hochschule Mittelhessen, Friedberg",
      end: "2016-09",
      note: "Abschlussarbeit mit FAS GmbH zur Innenraumlokalisierung mit Kalman- und Partikelfiltern",
    },
  ],
  skills: [
    {
      group: "Languages",
      items: [
        { name: "C++", level: 3 },
        { name: "Python", level: 4 },
        { name: "JavaScript/React", level: 3 },
        { name: "HTML/CSS", level: 2 },
      ],
    },
    {
      group: "Automotive",
      items: [
        { name: "ADAS/AD-Integration", level: 5 },
        { name: "FlexRay/CAN/Automotive Ethernet", level: 5 },
        { name: "Sensorfusion", level: 4 },
        { name: "Vector CANoe", level: 4 },
      ],
    },
    {
      group: "Tooling",
      items: [
        { name: "Git", level: 5 },
        { name: "Linux", level: 4 },
        { name: "CMake/Conan", level: 4 },
        { name: "Jenkins", level: 3 },
      ],
    },
    {
      group: "Leadership",
      items: [
        { name: "Schnittstelle zum OEM", level: 5 },
        { name: "Teamkoordination", level: 4 },
        { name: "Recruiting/Interviews", level: 3 },
        { name: "Jira/Confluence", level: 4 },
      ],
    },
    {
      group: "AI",
      items: [
        { name: "Claude Code", level: 4 },
        { name: "Cursor", level: 4 },
        { name: "Agentische Workflows", level: 3 },
      ],
    },
  ],
  agentic: {
    intro:
      "Ich habe acht Jahre damit verbracht, Software in Testfahrzeugen zu integrieren und zu debuggen. Heute nutze ich KI-Agenten für einen großen Teil meiner Programmierarbeit.",
    tools: ["Claude Code", "Cursor"],
    workUse:
      "Ich nutze Claude Code und Cursor täglich, bei der Arbeit und in privaten Nebenprojekten. Auch diese Website.",
  },
  next: {
    intro: "Acht Jahre Software in Testfahrzeugen haben mir gezeigt, wie Systeme in der realen Welt versagen. Als Nächstes möchte ich dort arbeiten, wo KI im großen Maßstab entsteht.",
    steps: [
      {
        label: "T-3",
        title: "Agenten im Produktivbetrieb",
        body: "Agenten von Demos zu Systemen machen, auf die sich Menschen verlassen: Tool-Nutzung, Evaluierungen, Leitplanken und Kosten im großen Maßstab.",
      },
      {
        label: "T-2",
        title: "Physische KI",
        body: "Foundation-Modelle, die in Autos und Robotern wahrnehmen und handeln, wo eine falsche Antwort physische Folgen hat. Hier helfen meine Jahre in Testfahrzeugen am meisten.",
      },
      {
        label: "T-1",
        title: "Ein KI-Team in der Weltspitze",
        body: "Der Einstieg in ein KI-Team eines Technologiekonzerns, das Modelle und die Produkte darauf entwickelt.",
      },
    ],
    liftoff: "Bauen Sie in diesem Bereich etwas auf? Lassen Sie uns sprechen.",
  },
  additional: [{ title: "C++/OOP-Tutor, Technische Hochschule Mittelhessen", year: "2017" }],
};
