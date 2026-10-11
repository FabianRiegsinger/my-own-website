import type { CV } from "./types";

export const cv: CV = {
  profile: {
    name: "Fabian Riegsinger",
    headline: "Automotive System Integration & Software Engineer",
    location: "Ingolstadt, Germany",
    summary:
      "Software engineer with 8+ years in the automotive industry, combining C++ and Python with deep knowledge of autonomous-driving architectures. Today I am the on-site resident for AUDI in Mobileye's ADAS Level 3 program, keeping a fleet of about 30 development vehicles running. I bridge engineering teams and OEM stakeholders, and I build with AI agents every day.",
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
      role: "Technical Support Resident (R&D), AUDI project",
      start: "2024-12",
      end: null,
      location: "Ingolstadt, Germany",
      highlights: [
        "On-site resident inside AUDI's development environment and first escalation point for the ADAS/AD stack across ~30 test vehicles.",
        "Triage sensor and perception issues by correlating logs, CAN/Ethernet traces and vehicle telemetry, resolving field issues daily.",
        "Build Python tooling that speeds up software rollout and fleet upgrades.",
        "Coordinate integration of EyeQ-based software with AUDI's vehicle platform, from bug report to verified fix.",
        "Keep fleet flashing, versioning and calibration consistent.",
      ],
      tags: ["ADAS L3", "EyeQ", "Python", "CAN", "Automotive Ethernet"],
    },
    {
      company: "ESAS Automotive GmbH",
      role: "Software Developer & Project Coordinator",
      start: "2018-07",
      end: "2024-11",
      location: "Ingolstadt, Germany",
      highlights: [
        "Designed a React/Electron/Capacitor environment-visualization tool that became the standard across AUDI's test fleet.",
        "Promoted from developer to coordinator of a 4-engineer team, including hiring and technical interviews.",
        "Built C++ sensor-fusion modules combining camera, LiDAR and radar detections.",
        "Wrote C++ FlexRay/CAN/Ethernet protocol transformers bridging third-party and in-house components.",
        "Created cloud data-evaluation pipelines and a Route Evaluator in Python/React.",
      ],
      tags: ["C++", "Sensor fusion", "React", "FlexRay", "Team lead"],
    },
  ],
  education: [
    {
      degree: "M.Sc. Information and Communication Engineering",
      school: "Technische Hochschule Mittelhessen, Friedberg",
      end: "2018-08",
      note: "Thesis with AUDI AG on trajectory-planning evaluation metrics (1.0)",
    },
    {
      degree: "B.Eng. Information and Communication Engineering",
      school: "Technische Hochschule Mittelhessen, Friedberg",
      end: "2016-09",
      note: "Thesis with FAS GmbH on Kalman/particle-filter indoor localization (1.1)",
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
        { name: "ADAS/AD integration", level: 5 },
        { name: "FlexRay/CAN/Automotive Ethernet", level: 5 },
        { name: "Sensor fusion", level: 4 },
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
        { name: "OEM stakeholder interface", level: 5 },
        { name: "Team coordination", level: 4 },
        { name: "Hiring/interviewing", level: 3 },
        { name: "Jira/Confluence", level: 4 },
      ],
    },
    {
      group: "AI",
      items: [
        { name: "Claude Code", level: 4 },
        { name: "Cursor", level: 4 },
        { name: "Agentic workflows", level: 3 },
      ],
    },
  ],
  agentic: {
    intro:
      "Eight years of shipping software into real cars taught me integration, debugging under pressure and clear interfaces. Now I bring that discipline to building with AI agents.",
    tools: ["Claude Code", "Cursor"],
    workUse:
      "I use Claude Code and Cursor daily, from building the Python tooling for fleet rollouts to shipping side projects like this website.",
  },
  additional: [{ title: "C++/OOP Tutor, Technische Hochschule Mittelhessen", year: "2017" }],
};
