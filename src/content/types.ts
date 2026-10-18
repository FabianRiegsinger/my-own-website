export type Level = 1 | 2 | 3 | 4 | 5;
export type SkillGroupName = "Languages" | "Automotive" | "Tooling" | "Leadership" | "AI";

export interface Profile {
  name: string;
  headline: string;
  location: string;
  summary: string;
  links: { github: string; linkedin: string; xing: string; email: { user: string; domain: string } };
}

export interface Experience {
  company: string;
  role: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", null = present */
  end: string | null;
  location: string;
  highlights: string[];
  tags: string[];
}

export interface Education {
  degree: string;
  school: string;
  end: string;
  note: string;
}

export interface SkillGroup {
  group: SkillGroupName;
  items: { name: string; level: Level }[];
}

export interface Agentic {
  intro: string;
  tools: string[];
  workUse: string;
}

/** "What comes next": a countdown of the challenges he is heading for, last step hands over to contact. */
export interface Next {
  intro: string;
  steps: { label: string; title: string; body: string }[];
  liftoff: string;
}

export interface CV {
  profile: Profile;
  experience: Experience[];
  education: Education[];
  skills: SkillGroup[];
  agentic: Agentic;
  next: Next;
  additional: { title: string; year: string }[];
}
