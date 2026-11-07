import { projectOverrides } from "@/content/project-overrides";

const USER = "FabianRiegsinger";

export interface Project {
  name: string;
  description: string;
  language: string | null;
  stars: number;
  url: string;
  homepage: string | null;
  updatedAt: string;
  image?: string;
  tagline?: string;
}

export type ProjectOverride = Partial<Omit<Project, "name">> & { name: string };

/** Subset of the GitHub REST repo object we read. */
export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  pushed_at: string;
  fork: boolean;
  private: boolean;
  archived?: boolean;
}

export function selectProjects(repos: GitHubRepo[], overrides: ProjectOverride[]): Project[] {
  const byName = new Map(overrides.map((o) => [o.name, o]));
  return repos
    // Every public repo you own; forks and archived repos are left out.
    .filter((r) => !r.fork && !r.private && !r.archived)
    .map((r) => ({
      name: r.name,
      description: r.description ?? "",
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      homepage: r.homepage || null,
      updatedAt: r.pushed_at,
      ...byName.get(r.name),
    }))
    // Most stars first; equal star counts in alphabetical order.
    .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

function fromOverrides(overrides: ProjectOverride[]): Project[] {
  return overrides.map((o) => ({
    description: "",
    language: null,
    stars: 0,
    url: `https://github.com/${USER}/${o.name}`,
    homepage: null,
    updatedAt: "",
    ...o,
  }));
}

/** Never throws: on any GitHub failure the overrides list keeps the section populated. */
export async function getProjects(
  fetchImpl: typeof fetch = fetch,
  token: string | undefined = process.env.GITHUB_TOKEN,
): Promise<Project[]> {
  try {
    const res = await fetchImpl(`https://api.github.com/users/${USER}/repos?type=owner&per_page=100`, {
      // Optional token: anonymous calls share Vercel's IPs and hit GitHub's 60/hour limit.
      headers: { Accept: "application/vnd.github+json", ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) return fromOverrides(projectOverrides);
    const projects = selectProjects((await res.json()) as GitHubRepo[], projectOverrides);
    return projects.length ? projects : fromOverrides(projectOverrides);
  } catch {
    return fromOverrides(projectOverrides);
  }
}
