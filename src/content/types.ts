export type Level = 1 | 2 | 3 | 4 | 5;
export type SkillGroupName = "Languages" | "Automotive" | "Tooling" | "Leadership" | "AI";

export interface Profile {
  name: string;
  headline: string;
  location: string;
  summary: string;
  /** Short facts for the bento stat tiles; each value must appear in `summary`. */
  stats: { value: string; label: string }[];
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

export interface CV {
  profile: Profile;
  experience: Experience[];
  education: Education[];
  skills: SkillGroup[];
  agentic: Agentic;
  additional: { title: string; year: string }[];
}
