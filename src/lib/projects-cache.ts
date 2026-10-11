import { cacheLife } from "next/cache";
import { getProjects } from "./projects";

/** GitHub projects, refreshed hourly (spec: revalidate 3600). */
export async function loadProjects() {
  "use cache";
  cacheLife("hours");
  return getProjects();
}
