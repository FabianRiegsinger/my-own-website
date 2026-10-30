import type { CV } from "./types";

export const cvDe: CV = {
  profile: {
    name: "Fabian Riegsinger",
    headline: "System-Integrations- & Softwareingenieur",
    location: "Ingolstadt, Deutschland",
    summary:
      "Ich bin Software- und Integrationsingenieur und arbeite seit mehr als acht Jahren in der Automobilindustrie in Ingolstadt. Dort arbeite ich an Software-Stacks für das autonome Fahren eines namhaften OEM. Bei ESAS Automotive habe ich in C++ und Python Software für das Ökosystem rund um das autonome Fahrzeug entwickelt und die Projektleitung übernommen. Heute arbeite ich für Mobileye als Forward Deployed Engineer direkt beim Kunden an einem Level-3-Programm für automatisiertes Fahren. Dort baue ich eine große Flotte von Entwicklungsfahrzeugen mit auf und halte sie einsatzbereit und auf dem neusten Stand. Zu meinen alltäglichen Aufgaben gehört die Koordination der Lösung kritischer Probleme zwischen den Ingenieuren des OEM und entsprechenden Teams von Mobileye. Außerdem entwickle ich mit Hilfe von cutting-edge KI-Lösungen Software, die sämtliche Abläufe rund um das Testfahrzeug automatisiert.",
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
      role: "Forward Deployed Engineer (R&D)",
      start: "2024-12",
      end: null,
      location: "Ingolstadt, Deutschland",
      highlights: [
        "Erste Eskalationsstelle vor Ort für Software- und Integrationsprobleme im ADAS/AD-Stack einer großen Testfahrzeugflotte.",
        "Sensor- und Wahrnehmungsprobleme aus Logs, CAN-/Ethernet-Mitschnitten und Fahrzeugtelemetrie analysieren; täglich mehrere Feldprobleme.",
        "Python-Werkzeuge entwickeln, die Software-Auslieferung und Flottenupdates beschleunigen und das Projekt insgesamt agiler machen.",
        "Die Integration der EyeQ-Software in die Fahrzeugplattform des Kunden koordinieren: tiefgehendes System-Debugging, Zusammenarbeit mit Expertenteams an anderen Standorten, Steuerung von Softwareverbesserungsprozessen.",
        "Das Tooling-Ökosystem des Kunden, die Verteilung von Softwareversionen und die Sensorkalibrierung über die gesamte Flotte pflegen.",
      ],
      tags: ["ADAS L3", "Embedded-Hardware", "Python", "CAN", "Automotive Ethernet", "FlexRay"],
    },
    {
      company: "ESAS Automotive GmbH",
      role: "Softwareentwicklung und -integration & Projektkoordination",
      start: "2018-07",
      end: "2024-11",
      location: "Ingolstadt, Deutschland",
      highlights: [
        "Ich entwickelte ein React/Electron/Capacitor-Tool zur Umgebungsvisualisierung im Fahrzeug, heute die Standardvisualisierung in der Testflotte.",
        "Vom Entwickler zum Koordinator eines Teams aus vier Ingenieuren befördert; ich traf bei Bewerbern eine Vorauswahl und führte technische Interviews.",
        "Ich schrieb unter anderem C++-Module zur Sensorfusion (Kamera-, LiDAR- und Radar-Detektionen) und C++-Transformer für FlexRay-, CAN- und Ethernet-Protokolle.",
        "Python nutzte ich zum Beispiel für alles von Skripting-Lösungen bis zu Cloud-Pipelines zur Datenauswertung.",
      ],
      tags: ["C++", "Python", "Sensorfusion", "React", "Projektkoordination", "Teamleitung"],
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
      "Ich habe acht Jahre lang Software in hochmodernen Hardware- und Software-Stacks der Automobilindustrie entwickelt, integriert und debuggt. Um bei KI vorne mitzuhalten, halte ich es für unverzichtbar, sie in jede mögliche Ebene meiner täglichen Arbeit zu integrieren.",
    tools: ["Claude Code", "Cursor", "VS Code"],
    workUse:
      "Ich nutze Claude Code und Cursor täglich, bei der Arbeit und in privaten Nebenprojekten.",
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
