import type { CV } from "./types";

export const cvEn: CV = {
  profile: {
    name: "Fabian Riegsinger",
    headline: "System Integration & Software Engineer",
    location: "Ingolstadt, Germany",
    summary:
      "I'm a software development and integration engineer with more than eight years of experience in the automotive industry contributing to autonomous driving stacks. At ESAS Automotive, I built software for autonomous-driving cars in C++ and Python, while taking on project and team lead responsibilities. For Mobileye I work as a Forward Deployed Engineer at the customer's site on a Level 3 ADAS program, building and keeping a large fleet of development vehicles running. Coordinating critical issues between the OEM's engineers and Mobileye's R&D team, while developing agentic software that automates test vehicle maintenance workflows belong to my daily challenges.",
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
      location: "Ingolstadt, Germany",
      highlights: [
        "First escalation point on site for software and integration issues in the ADAS/AD stack on a large set of test vehicles.",
        "Triage sensor and perception issues from logs, CAN/Ethernet traces and vehicle telemetry; several field issues a day.",
        "Build Python tooling that speeds up software rollout and fleet upgrades - generally accelerating the project's agility.",
        "Coordinate EyeQ software integration with customer's vehicle platform: deep system debugging, collaboration with remote expert teams, handling software improvement processes.",
        "Maintaining customer's tooling ecosystem, software versions deployment and sensor calibration across the fleet.",
      ],
      tags: ["ADAS L3", "Embedded Hardware", "Python", "CAN", "Automotive Ethernet", "FlexRay"],
    },
    {
      company: "ESAS Automotive GmbH",
      role: "Software Development and Integration & Project Coordination",
      start: "2018-07",
      end: "2024-11",
      location: "Ingolstadt, Germany",
      highlights: [
        "Designed a React/Electron/Capacitor environment-visualization tool, now the standard visualization on AUDI's test fleet.",
        "Promoted from developer to coordinator of a 4-engineer team; screened applicants and ran technical interviews.",
        "Wrote C++ sensor-fusion modules (camera, LiDAR and radar detections) and C++ FlexRay/CAN/Ethernet protocol transformers, among others.",
        "Built cloud data-evaluation pipelines and several Python applications.",
      ],
      tags: ["C++", "Python", "Sensor fusion", "React", "Project Coordination", "Team lead"],
    },
  ],
  education: [
    {
      degree: "M.Sc. Information and Communication Engineering",
      school: "Technische Hochschule Mittelhessen, Friedberg",
      end: "2018-08",
      note: "Thesis with AUDI AG on trajectory-planning evaluation metrics",
    },
    {
      degree: "B.Eng. Information and Communication Engineering",
      school: "Technische Hochschule Mittelhessen, Friedberg",
      end: "2016-09",
      note: "Thesis with FAS GmbH on Kalman/particle-filter indoor localization",
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
      "I spent eight years developing, integrating and debugging software in cutting-edge hardware and software stacks in the automotive industry. In order to stay ahead of the curve in AI, I see the integration of it in every possible layer of my daily work routine as a must.",
    tools: ["Claude Code", "Cursor", "VS Code"],
    workUse:
      "I use Claude Code and Cursor every day, at work and on private side projects.",
  },
  next: {
    intro: "Eight years of software in test vehicles taught me how systems fail in the real world. Next, I want to work where AI is built at scale.",
    steps: [
      {
        label: "T-3",
        title: "Agents in production",
        body: "Taking agents from demos to systems people rely on: tool use, evaluations, guardrails, and cost at scale.",
      },
      {
        label: "T-2",
        title: "Physical AI",
        body: "Foundation models that perceive and act in cars and robots, where a wrong answer has physical consequences. That is where my years in test vehicles help most.",
      },
      {
        label: "T-1",
        title: "A frontier AI team",
        body: "Joining a big-tech AI team that builds models and the products that run on them.",
      },
    ],
    liftoff: "Building something in this space? Let's talk.",
  },
  additional: [{ title: "C++/OOP Tutor, Technische Hochschule Mittelhessen", year: "2017" }],
};
