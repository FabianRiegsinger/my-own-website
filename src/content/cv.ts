import type { CV } from "./types";

export const cv: CV = {
  profile: {
    name: "Fabian Riegsinger",
    headline: "System Integration & Software Engineer",
    location: "Ingolstadt, Germany",
    summary:
      "I'm a software engineer with over 8 years of experience in the automotive industry. At ESAS automotive, I have built software for autonomous-driving stacks in C++ and Python. For Mobileye, I work on site directly with the customers on the Level 3 ADAS program, where I mainly maintain a large fleet of development vehicles running, while coordinating mission critical tasks with the OEM's engineers and Mobileye's R&D team. Recently, I have been incorporating agentic workflows in my daily work to drastically improve efficiency.",
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
        "First escalation point at AUDI for software and integration issues in the ADAS/AD stack on ~30 test vehicles.",
        "Triage sensor and perception issues from logs, CAN/Ethernet traces and vehicle telemetry; several field issues a day.",
        "Build Python tooling that speeds up software rollout and fleet upgrades.",
        "Coordinate EyeQ software integration with AUDI's vehicle platform: bug reports, reproduction steps, fix verification.",
        "Maintain flashing, software versions and calibration across the fleet.",
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
        "Designed a React/Electron/Capacitor environment-visualization tool, now the standard visualization on AUDI's test fleet.",
        "Promoted from developer to coordinator of a 4-engineer team; screened applicants and ran technical interviews.",
        "Built C++ sensor-fusion modules combining camera, LiDAR and radar detections.",
        "Wrote C++ FlexRay/CAN/Ethernet protocol transformers between third-party and in-house components.",
        "Built cloud data-evaluation pipelines and a Route Evaluator in Python/React.",
      ],
      tags: ["C++", "Sensor fusion", "React", "FlexRay", "Team lead"],
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
      "I spent eight years integrating and debugging software in test vehicles. Now I use AI agents for a large part of my coding.",
    tools: ["Claude Code", "Cursor"],
    workUse:
      "I use Claude Code and Cursor every day, at work and on side projects. This website was built with Claude Code.",
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
        body: "Foundation models that perceive and act in cars and robots, where a wrong answer has physical consequences. My automotive years count here.",
      },
      {
        label: "T-1",
        title: "A frontier AI team",
        body: "Joining a big-tech AI team that builds the models, the infrastructure, and the products on top of them.",
      },
    ],
    liftoff: "Building something in this space? Let's talk.",
  },
  additional: [{ title: "C++/OOP Tutor, Technische Hochschule Mittelhessen", year: "2017" }],
};
