# Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A scroll-driven 3D portfolio site that presents Fabian Riegsinger's CV as a journey from automotive engineering to agentic AI, deployable to Vercel.

**Architecture:** Next.js App Router. The server always renders a complete static page (all CV text, SEO-safe). On the client, a gate checks WebGL and `prefers-reduced-motion` and, if capable, swaps in a full-screen R3F `<Canvas>` with drei `ScrollControls`; the same section components render inside `<Scroll html>`. Scroll offset is mapped to station/clip/camera by one pure table in `lib/scroll-map.ts`. Projects come from the GitHub API filtered by topic `portfolio`, revalidated hourly.

**Tech Stack:** Next.js (App Router, TypeScript), React 19, Tailwind CSS, `three`, `@react-three/fiber@^9`, `@react-three/drei@^10`, Vitest + Testing Library, Playwright, `@gltf-transform/cli`.

**Spec:** `docs/superpowers/specs/2026-10-11-portfolio-website-design.md`

## Global Constraints

- Colors: background `#F5F5F7`, text `#1D1D1F`, muted `#6E6E73`. Accent text/links `#2563EB`; `#2F7BF6` only for 3D glow and large shapes. Glow `#22d3ee` → `#8b5cf6` only in 3D/decoration, never text. Light theme only.
- Interaction: visible focus ring (`focus-visible:outline-2 outline-accent`) on every link/button, `cursor-pointer` on clickables, touch targets >= 44×44 px. Icons SVG only (Simple Icons), no emoji.
- Motion: at most 1–2 animated elements per view (figure + one set piece); text only fades in.
- Font: Inter via `next/font/google`.
- English only. No phone number anywhere in the repo's site code or content.
- Email is never present as a plain `user@domain` string in rendered HTML; assembled client-side on click.
- No brand logos (AUDI, Mobileye) in 3D or images; company names as text only.
- DPR capped `[1, 1.5]`. `figure.glb` + animation files total < 3 MB, Draco-compressed.
- GitHub user `FabianRiegsinger`; topic `portfolio`; `revalidate: 3600`; no API token.
- Links: GitHub `https://github.com/FabianRiegsinger`, LinkedIn `https://www.linkedin.com/in/fabian-riegsinger-736b78b7/`, Xing `https://www.xing.com/profile/Fabian_Riegsinger`.
- Skill levels exactly as in spec section 4 (Languages: C++ 3, Python 4, JavaScript/React 3, HTML/CSS 2).

## Review Focus

1. GitHub repo with `description: null`, missing `topics`, or `homepage: ""` → card renders without crash, no empty link. (Task 3 test)
2. GitHub returns 403 rate limit or network error → projects section still renders from overrides. (Task 3 test)
3. Scroll offset exactly `0` or `1` → `stationAt` returns Hero / Contact, never `undefined`. (Task 4 test)
4. `figure.glb` 404 or WebGL context lost → visitor sees the static page, not a blank canvas. (Task 7 test)
5. 360 px wide viewport → all section text readable, no horizontal scroll. (Task 5 Playwright test)

---

### Task 1: Scaffold project

**Files:**
- Create: Next.js app at repo root (`src/app/*`, `package.json`, `tsconfig.json`, `tailwind` config, `vitest.config.ts`, `playwright.config.ts`, `e2e/smoke.spec.ts`)
- Modify: `.gitignore` (add `/test-results`, `/playwright-report`)

**Interfaces:**
- Produces: `npm run dev|build|test|e2e`; Tailwind theme colors `bg` `#F5F5F7`, `ink` `#1D1D1F`, `muted` `#6E6E73`, `accent` `#2563EB`, `glow` `#2F7BF6`; path alias `@/*` → `src/*`.

- [ ] **Step 1:** Run `npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm` (keep existing `README.md`, `LICENSE`, `docs/`).
- [ ] **Step 2:** Install: `npm i three @react-three/fiber@^9 @react-three/drei@^10` and `npm i -D @types/three vitest @vitejs/plugin-react jsdom @testing-library/react @playwright/test @gltf-transform/cli`. Run `npx playwright install chromium`.
- [ ] **Step 3:** Add scripts `"test": "vitest run"`, `"e2e": "playwright test"`. Vitest env `jsdom`, alias `@`. Playwright `webServer: npm run build && npm run start`, port 3000.
- [ ] **Step 4:** `src/app/layout.tsx`: Inter font, `<body className="bg-bg text-ink">`. `src/app/page.tsx`: `<h1>Fabian Riegsinger</h1>` placeholder.
- [ ] **Step 5:** Write `e2e/smoke.spec.ts` → `test("home loads")`: `page.goto("/")`, expect heading "Fabian Riegsinger" visible.
- [ ] **Step 6:** Run `npm run build && npm run e2e`. Expected: build OK, 1 passed.
- [ ] **Step 7:** Commit `chore: scaffold Next.js app with Tailwind, Vitest, Playwright`.

### Task 2: CV content

**Files:**
- Create: `src/content/types.ts`, `src/content/cv.ts`
- Test: `src/content/cv.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Level = 1|2|3|4|5;
  type SkillGroupName = "Languages"|"Automotive"|"Tooling"|"Leadership"|"AI";
  interface Profile { name: string; headline: string; location: string; summary: string;
    links: { github: string; linkedin: string; xing: string; email: { user: string; domain: string } } }
  interface Experience { company: string; role: string; start: string; end: string|null; location: string; highlights: string[]; tags: string[] }
  interface Education { degree: string; school: string; end: string; note: string }
  interface SkillGroup { group: SkillGroupName; items: { name: string; level: Level }[] }
  interface Agentic { intro: string; tools: string[]; workUse: string }
  export const cv: { profile: Profile; experience: Experience[]; education: Education[]; skills: SkillGroup[]; agentic: Agentic; additional: { title: string; year: string }[] }
  ```
  Dates as `"YYYY-MM"` strings.

- [ ] **Step 1: Write failing tests** in `cv.test.ts`:
  - `experience is newest first`: `cv.experience[0].company === "Mobileye Germany GmbH"`, `end === null`; `cv.experience[1].start === "2018-07"`, `end === "2024-11"`.
  - `skill levels match spec`: Languages → `{C++:3, Python:4, "JavaScript/React":3, "HTML/CSS":2}`; Automotive "ADAS/AD integration" 5; AI "Claude Code" 4.
  - `no empty strings`: recursively walk `cv`, every string `.trim().length > 0`.
  - `no phone number`: `JSON.stringify(cv)` does not match `/\+?49[\s\d]{6,}/`.
  - `agentic tools`: `cv.agentic.tools` equals `["Claude Code", "Cursor"]`.
- [ ] **Step 2:** Run `npm test -- cv`. Expected: FAIL (module not found).
- [ ] **Step 3:** Write `types.ts` and `cv.ts` with all content from spec section 4 (typos corrected, highlights rewritten as short punchy lines, one per CV bullet). Headline: "Automotive System Integration & Software Engineer". Email `{ user: "fabian.riegsinger", domain: "web.de" }`.
- [ ] **Step 4:** Run `npm test -- cv`. Expected: 5 passed.
- [ ] **Step 5:** Commit `feat: add typed CV content`.

### Task 3: GitHub projects

**Files:**
- Create: `src/lib/projects.ts`, `src/content/project-overrides.ts`
- Test: `src/lib/projects.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface Project { name: string; description: string; language: string|null; stars: number; url: string; homepage: string|null; updatedAt: string; image?: string; tagline?: string }
  type ProjectOverride = Partial<Omit<Project,"name">> & { name: string };
  export const projectOverrides: ProjectOverride[];          // project-overrides.ts
  export function selectProjects(repos: GitHubRepo[], overrides: ProjectOverride[]): Project[];  // pure
  export async function getProjects(fetchImpl?: typeof fetch): Promise<Project[]>;
  ```
- Rules: keep `!fork && !private && topics?.includes("portfolio")`; sort `updatedAt` desc; `description` falls back to override, then `""`; `homepage: ""` → `null`; override fields win. `getProjects` calls `https://api.github.com/users/FabianRiegsinger/repos?per_page=100` with `next: { revalidate: 3600 }`; on throw or `!res.ok` returns overrides mapped to `Project` (defaults: `language: null, stars: 0, url: https://github.com/FabianRiegsinger/<name>, homepage: null, updatedAt: ""`).
- `projectOverrides` initially: `[{ name: "snap-notes", tagline: "Sticky notes as slim bars on your screen edge. Rust + iced, cross-platform." }]`.

- [ ] **Step 1: Write failing tests:**
  - `filters by portfolio topic, excludes forks and private` (fixtures: tagged, untagged, fork-tagged, private-tagged → only tagged).
  - `handles null description, missing topics, empty homepage` (Review Focus 1): no throw, `homepage === null`.
  - `override wins per field`.
  - `sorts newest first`.
  - `getProjects falls back to overrides on 403` and `on network error` (Review Focus 2): stub `fetchImpl`, result names `["snap-notes"]`.
- [ ] **Step 2:** Run `npm test -- projects`. Expected: FAIL.
- [ ] **Step 3:** Implement `projects.ts` and `project-overrides.ts`.
- [ ] **Step 4:** Run `npm test -- projects`. Expected: 6 passed.
- [ ] **Step 5:** Commit `feat: fetch portfolio projects from GitHub`.

### Task 4: Scroll map

**Files:**
- Create: `src/lib/scroll-map.ts`
- Test: `src/lib/scroll-map.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type StationId = "hero"|"about"|"timeline"|"skills"|"agentic"|"contact";
  type ClipName = "idle"|"walk"|"typing"|"wave";
  interface Station { id: StationId; start: number; end: number; clip: ClipName; camera: [number,number,number]; target: [number,number,number] }
  export const STATIONS: Station[];
  export const SCROLL_PAGES = 6;
  export function stationAt(offset: number): Station;               // clamps to [0,1], end of last station inclusive
  export function localProgress(offset: number): number;           // 0..1 within current station
  ```
- Ranges and clips exactly from spec table: hero 0–0.15 idle, about 0.15–0.30 idle, timeline 0.30–0.60 walk, skills 0.60–0.75 idle, agentic 0.75–0.90 typing, contact 0.90–1.00 wave. Camera/target values are tuning choices; keep figure at origin, timeline moves camera along -z.

- [ ] **Step 1: Write failing tests:** `ranges are contiguous and cover 0..1` (first start 0, last end 1, each `end === next.start`); `stationAt(0).id === "hero"`, `stationAt(1).id === "contact"`, `stationAt(-0.5)` hero, `stationAt(1.5)` contact (Review Focus 3); `stationAt(0.45).clip === "walk"`; `localProgress(0.45) ≈ 0.5`.
- [ ] **Step 2:** Run `npm test -- scroll-map`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: 4 passed.
- [ ] **Step 5:** Commit `feat: add scroll-to-station map`.

### Task 5: HTML sections and static page

**Files:**
- Create: `src/components/sections/{Hero,About,Timeline,Skills,Agentic,Contact}.tsx`, `src/components/EmailLink.tsx`, `src/components/StaticPage.tsx`, `public/fallback.webp` (temporary neutral placeholder until Task 7 renders the real still)
- Modify: `src/app/page.tsx`, `e2e/smoke.spec.ts`
- Test: `src/components/EmailLink.test.tsx`

**Interfaces:**
- Consumes: `cv` (Task 2), `getProjects`, `Project` (Task 3).
- Produces: each section `({ cv }: { cv: typeof cv }) => JSX`, except `Agentic({ cv, projects }: {...; projects: Project[]})`. Each section root is `<section id="<StationId>" className="min-h-screen ...">` so 3D and static layouts share it. `StaticPage({ cv, projects })`. `EmailLink({ user, domain, children })` client component: renders `<a href="#" ...>`; on click sets `location.href = "mailto:" + user + "@" + domain`.
- `page.tsx` (server): `const projects = await getProjects(); return <StaticPage cv={cv} projects={projects} />` (Task 7 wraps this in the gate).

- [ ] **Step 1: Write failing tests:** `EmailLink.test.tsx` → rendered HTML does not contain `"@web.de"`; click calls location assignment with `mailto:fabian.riegsinger@web.de` (stub `window.location`). Extend `e2e/smoke.spec.ts`: `cv text in DOM` (texts "Mobileye Germany GmbH", "ESAS Automotive GmbH", "Claude Code", "snap-notes" visible); `no phone number` (`page.content()` not matching `/\+49/`); `mobile 360px no horizontal scroll` (Review Focus 5: viewport 360×800, `document.documentElement.scrollWidth <= 360`); `contact links are 44px targets` (each contact link `boundingBox()` width and height >= 44); `focus ring visible` (Tab to first contact link, computed `outline-style` !== "none").
- [ ] **Step 2:** Run `npm test -- EmailLink` and `npm run e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement sections. Visual: large tight headlines, accent color for dates/tags, timeline as vertical line with entries, skills as group cards with 5-dot level bars, project cards (name, tagline or description, language, stars, link). Contact: GitHub, LinkedIn, Xing, EmailLink, each with an inline SVG icon from Simple Icons (`npm i simple-icons`, import `siGithub`, `siLinkedin`, `siXing`) plus a visible text label. Footer links `/impressum`, `/privacy`.
- [ ] **Step 4:** Run tests. Expected: all pass.
- [ ] **Step 5:** Commit `feat: add CV sections and static page`.

### Task 6: Figure asset

**Files:**
- Create: `public/models/figure.glb`, `public/models/anims/{idle,walk,typing,wave}.glb`, `scripts/build-figure.sh`, `public/models/LICENSE.md`

**Interfaces:**
- Produces: `figure.glb` containing one skinned mesh with a humanoid skeleton; each `anims/<clip>.glb` containing exactly one animation targeting the same bone names. Clip names normalized to `idle|walk|typing|wave`.

Note: this deviates from the spec's single-file `figure.glb` — clips ship as separate files and are merged at runtime (Task 7), because merging skinned FBX exports into one glTF needs Blender. Same total size budget.

- [ ] **Step 1 (owner, manual):** Verify Mixamo terms permit use on a public website. If yes: on mixamo.com download "Y Bot" (FBX, T-pose, with skin) and animations Idle, Walking (In Place), Typing, Waving (FBX, without skin, 30 fps), into `assets-src/` (git-ignored). If no: pick a CC0 rigged mannequin + CC0 clips with matching skeleton and record the source.
- [ ] **Step 2:** Write `scripts/build-figure.sh`: convert each FBX with `npx fbx2gltf` to GLB, rename the animation to its clip name, then `npx gltf-transform optimize <in> <out> --compress draco --texture-compress webp`. Strip mesh from anim files (`gltf-transform prune` after removing meshes).
- [ ] **Step 3:** Run script. Verify: `du -ch public/models/figure.glb public/models/anims/*.glb | tail -1` < 3 MB; `npx gltf-transform inspect public/models/anims/walk.glb` lists one animation named `walk`.
- [ ] **Step 4:** Write `public/models/LICENSE.md` with source and license of each asset. Add `assets-src/` to `.gitignore`.
- [ ] **Step 5:** Commit `feat: add mannequin figure and animation clips`.

### Task 7: 3D experience shell

**Files:**
- Create: `src/components/three/Experience3D.tsx`, `src/components/three/Figure.tsx`, `src/components/three/CameraRig.tsx`, `src/components/ExperienceGate.tsx`, `src/components/Loader.tsx`, `src/lib/capabilities.ts`
- Modify: `src/app/page.tsx`, `e2e/smoke.spec.ts`
- Test: `src/lib/capabilities.test.ts`, `src/components/ExperienceGate.test.tsx`

**Interfaces:**
- Consumes: `STATIONS`, `SCROLL_PAGES`, `stationAt`, `localProgress` (Task 4); section components (Task 5); model files (Task 6).
- Produces:
  ```ts
  export function canRender3D(env: { hasWebGL: boolean; reducedMotion: boolean }): boolean;  // capabilities.ts
  export function detectEnv(): { hasWebGL: boolean; reducedMotion: boolean; isMobile: boolean };
  ExperienceGate({ cv, projects, children }): children = server-rendered StaticPage;
    renders children until mounted && canRender3D, then dynamic(Experience3D, { ssr:false }) with <Loader/> while loading;
    wraps Experience3D in an error boundary that falls back to children; also falls back on `webglcontextlost`.
  Experience3D({ cv, projects, lowPower: boolean })
  Figure(): reads useScroll().offset, cross-fades to stationAt(offset).clip over 0.4 s
  CameraRig(): lerps camera position/target toward the current station's camera/target, blended by localProgress
  ```
- Canvas: `dpr={[1, 1.5]}`, `<PerformanceMonitor onDecline={() => setLowPower(true)}>`; `lowPower` (or `isMobile`) disables shadows and `MeshReflectorMaterial`. Figure material overridden to `MeshStandardMaterial({ color: "#f2f2f2", roughness: 0.6, metalness: 0 })`. Lights: drei `<Environment preset="studio">` + one directional key light; `<ContactShadows>`. Sections render inside `<Scroll html style={{ width: "100%" }}>`. `ScrollControls pages={SCROLL_PAGES} damping={0.2}`.
- Figure loads `figure.glb` and the four anim files with `useGLTF`, concatenates clips, binds via `useAnimations`.

- [ ] **Step 1: Write failing tests:** `canRender3D` → false when `!hasWebGL`, false when `reducedMotion`, true otherwise. `ExperienceGate.test.tsx`: with `canRender3D` mocked false, renders children; with a child Experience that throws, renders children (Review Focus 4). Playwright: `canvas mounts` (desktop, `page.locator("canvas")` visible within 10 s); `reduced motion shows static page` (`page.emulateMedia({ reducedMotion: "reduce" })`, no canvas, "Mobileye Germany GmbH" visible); `missing model falls back` (`page.route("**/figure.glb", r => r.abort())`, "Mobileye Germany GmbH" visible).
- [ ] **Step 2:** Run `npm test` and `npm run e2e`. Expected: new tests FAIL.
- [ ] **Step 3:** Implement. `page.tsx`: `<ExperienceGate cv={cv} projects={projects}><StaticPage .../></ExperienceGate>`.
- [ ] **Step 4:** Run tests. Expected: all pass. Manual: `npm run dev`, scroll top to bottom, figure goes idle → walk → idle → typing → wave; camera moves smoothly.
- [ ] **Step 5:** Render a still of the hero view (screenshot via Playwright at 1200×1200, crop) to `public/fallback.webp`, replacing the placeholder; `StaticPage` shows it in the Hero.
- [ ] **Step 6:** Commit `feat: add scroll-driven 3D experience with fallbacks`.

### Task 8: 3D stations

**Files:**
- Create: `src/components/three/stations/{Hero,Timeline,SkillOrbit,AgentNetwork}.tsx`
- Modify: `src/components/three/Experience3D.tsx`

**Interfaces:**
- Consumes: `cv` (Task 2), `STATIONS`, `localProgress` (Task 4).
- Produces: `Hero({ lowPower })` (reflective floor; plain matte floor if `lowPower`); `Timeline({ experience, education })` (glowing line along -z, one floating milestone card per entry via drei `<Text>`, low-poly car silhouette built from boxes/cylinders with `lineSegments` edges at the ESAS and Mobileye milestones); `SkillOrbit({ skills })` (one ring per group around the figure, sphere radius `0.05 + 0.03 * level`, labels billboarded); `AgentNetwork()` (~40 nodes, instanced spheres + `lineSegments`, cyan `#22d3ee` → violet `#8b5cf6` gradient, gentle pulse).
- Each station positioned at its `STATIONS` camera target; fades opacity in/out with distance from its range.

- [ ] **Step 1:** Implement the four stations and mount in `Experience3D`.
- [ ] **Step 2:** Run `npm test && npm run e2e`. Expected: all pass (no regressions).
- [ ] **Step 3:** Manual check at desktop and 390×844 (DevTools): each station visible in its range, text overlays do not cover the figure's face area, Chrome DevTools FPS meter ≥ 55 desktop.
- [ ] **Step 4:** Commit `feat: add timeline, skill orbit and agent network stations`.

### Task 9: SEO and legal pages

**Files:**
- Create: `src/app/impressum/page.tsx`, `src/app/privacy/page.tsx`, `src/app/opengraph-image.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`
- Modify: `src/app/layout.tsx`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `cv.profile`.
- Produces: `metadata` (title "Fabian Riegsinger — Automotive Engineer → Agentic Builder", description from `cv.profile.summary` first sentence); JSON-LD `Person` script with `name`, `jobTitle`, `address.addressLocality: "Ingolstadt"`, `sameAs: [github, linkedin, xing]` (no email, no phone). `SITE_URL` from `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`.
- Impressum/privacy: templates with clearly marked `[TO FILL: ...]` fields for name, postal address, contact; privacy mentions Vercel hosting and IP processing. Both `robots: { index: false }`.

- [ ] **Step 1: Write failing e2e:** `json-ld present` (parse `script[type="application/ld+json"]`, `@type === "Person"`, `sameAs` length 3); `legal pages load` (`/impressum`, `/privacy` return 200 and have an `h1`).
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm run e2e`. Expected: pass. Run Lighthouse (`npx lighthouse http://localhost:3000 --only-categories=seo,accessibility --chrome-flags="--headless"`) against `npm run start`. Expected: both ≥ 90.
- [ ] **Step 5:** Commit `feat: add metadata, JSON-LD and legal page templates`.

### Task 10: Deploy

**Files:**
- Modify: `README.md` (how to run, how to add a project: tag repo with `portfolio`, how to edit `cv.ts`)

- [ ] **Step 1:** Update `README.md`. Commit `docs: add README usage`.
- [ ] **Step 2 (owner):** Add topic `portfolio` to `snap-notes` on GitHub. Fill the Impressum/privacy `[TO FILL]` fields.
- [ ] **Step 3 (owner approval required):** Push branch, open PR, import repo in Vercel, set `NEXT_PUBLIC_SITE_URL`. Verify preview deploy: page loads, snap-notes card shows, `/impressum` filled.
- [ ] **Step 4 (owner approval required):** Merge to `main` → production deploy. Optional custom domain.
