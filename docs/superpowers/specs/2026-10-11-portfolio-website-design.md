# Portfolio Website — Design Spec

Date: 2026-10-11
Status: Draft, awaiting review

## 1. Goal

A public personal website for Fabian Riegsinger that tells one story: an experienced automotive
system-integration and software engineer (8+ years, ADAS/AD) who is quickly adapting to the agentic
AI world. The CV is presented graphically as a scroll-driven 3D journey, with a smooth, faceless,
Apple-style 3D figure at the center.

### Success criteria

- A visitor understands within ~10 seconds: automotive engineer, 8+ years, now building with AI agents.
- All CV content is readable as real DOM text (crawlable, accessible), not only rendered in 3D.
- New GitHub projects appear on the site without a code change (tag repo with topic `portfolio`).
- Lighthouse SEO and Accessibility >= 90; first 3D frame < 3 s on a mid-range laptop.
- Site is online on Vercel with Impressum and privacy policy pages.

### Decisions made with the user

| Topic | Decision |
|---|---|
| Tech stack | Next.js (App Router) + React + TypeScript |
| 3D approach | Full 3D scroll world: one `<Canvas>` with drei `ScrollControls`, HTML in `<Scroll html>` |
| Figure | Smooth abstract matte mannequin (faceless, Apple product-video style), not a likeness |
| CV source | `curriculum-vitae-ats-nophoto.pdf` (Sept 2026), transcribed into `src/content/cv.ts` |
| Agentic evidence | Daily work with Claude Code and Cursor; side projects on GitHub (first: `snap-notes`) |
| Projects | Fetched from GitHub by topic `portfolio`, revalidated hourly |
| Look | Modern, clean, light theme |

## 2. Architecture

- **Framework:** Next.js App Router, TypeScript, Tailwind CSS, `next/font` (Inter).
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`.
- **Hosting:** Vercel; `main` deploys to production, PRs get preview deploys.
- **Single route:** `/`, plus `/impressum` and `/privacy`.

`app/page.tsx` is a server component. It loads `cv` and `getProjects()` and passes them to the
client. The 3D experience is loaded with `next/dynamic` (`ssr: false`) behind a minimal loader
(name + progress bar). Users without WebGL or with `prefers-reduced-motion` get `<StaticPage>`
instead, which renders the same section components with a still image of the figure.

### Scroll journey

One `<Canvas>`, `ScrollControls` with ~6 pages. Scroll offset 0..1 drives the camera spline, the
figure's animation clip, and the visible station. All mapping lives in `lib/scroll-map.ts`.

| Range | Station | Figure | 3D set piece | HTML content |
|---|---|---|---|---|
| 0.00–0.15 | Hero | idle | Reflective floor, soft studio light | Name, headline "Automotive engineer → agentic builder" |
| 0.15–0.30 | About | turns to visitor | Camera orbit | Summary: 8+ years, Ingolstadt, OEM ↔ engineering bridge |
| 0.30–0.60 | Career timeline | walk | Glowing path, low-poly unbranded car silhouette, floating milestones | Education, ESAS 2018–2024, Mobileye 2024–now |
| 0.60–0.75 | Skills | idle | Skill clusters orbiting the figure, size = level | Skill groups |
| 0.75–0.90 | Agentic shift | typing | Network of glowing nodes and lines | Claude Code, Cursor, how used at work; GitHub project cards |
| 0.90–1.00 | Contact | wave | Calm close-up | GitHub, LinkedIn, Xing, obfuscated email link |

## 3. Components

| File | Responsibility |
|---|---|
| `src/app/page.tsx` | Server: load `cv` + `getProjects()`, choose `Experience3D` or `StaticPage` |
| `src/app/layout.tsx` | Fonts, metadata, Open Graph, JSON-LD `Person` |
| `src/app/impressum/page.tsx`, `src/app/privacy/page.tsx` | Legal templates, details filled by the owner |
| `src/components/three/Experience3D.tsx` | Client: `<Canvas>`, `ScrollControls`, lights, environment, assembles stations |
| `src/components/three/Figure.tsx` | Loads `figure.glb`, cross-fades animation clips by scroll offset |
| `src/components/three/CameraRig.tsx` | Moves camera along a spline by scroll offset |
| `src/components/three/stations/Hero.tsx` | Hero set piece |
| `src/components/three/stations/Timeline.tsx` | Path, milestones, car silhouette |
| `src/components/three/stations/SkillOrbit.tsx` | Orbiting skill clusters |
| `src/components/three/stations/AgentNetwork.tsx` | Node/line network |
| `src/components/sections/*.tsx` | HTML text per section; used in `<Scroll html>` and in `StaticPage` |
| `src/components/StaticPage.tsx` | Fallback page: same sections + `public/fallback.webp` |
| `src/lib/scroll-map.ts` | Scroll ranges → station, clip, camera key |
| `src/lib/projects.ts` | GitHub fetch, filter, override merge |
| `src/content/cv.ts` | All CV content, typed |
| `src/content/project-overrides.ts` | Optional per-repo blurb/image/tagline |

## 4. Data model

### `src/content/cv.ts`

```ts
type Level = 1 | 2 | 3 | 4 | 5;

profile:    { name, headline, location, summary, links: { github, xing, linkedin, email } }
experience: { company, role, start, end: string | null, location, highlights: string[], tags: string[] }[]
education:  { degree, school, end, note }[]
skills:     { group: "Languages" | "Automotive" | "Tooling" | "Leadership" | "AI"; items: { name: string; level: Level }[] }[]
agentic:    { intro: string; tools: string[]; workUse: string }
```

### Content (from the CV, typos corrected)

- **Profile:** Fabian Riegsinger, M.Sc. — "Automotive System Integration & Software Engineer",
  Ingolstadt, Germany. No phone number on the site.
- **Links:** GitHub `https://github.com/FabianRiegsinger`, LinkedIn
  `https://www.linkedin.com/in/fabian-riegsinger-736b78b7/`, Xing
  `https://www.xing.com/profile/Fabian_Riegsinger`.
- **Experience:**
  - Mobileye Germany GmbH, Technical Support Resident (R&D), AUDI project, Dec 2024 – present:
    on-site resident for AUDI's ADAS Level 3 program, first-line escalation for a ~30-vehicle test
    fleet; sensor/perception triage from logs, CAN/Ethernet traces and telemetry; Python tooling for
    fleet rollout and upgrades; EyeQ software integration with the AUDI platform; fleet
    configuration, flashing, versioning, calibration.
  - ESAS Automotive GmbH, Software Developer & Project Coordinator, Jul 2018 – Nov 2024:
    React/Electron/Capacitor environment-visualization tool that became the standard across AUDI's
    test fleet; promoted to coordinator of a 4-engineer team incl. hiring and technical interviews;
    C++ sensor fusion (camera, LiDAR, radar); C++ FlexRay/CAN/Ethernet protocol transformers;
    cloud data-evaluation pipelines and a Route Evaluator (Python/React).
- **Education:** M.Sc. Information and Communication Engineering, THM Friedberg, Aug 2018 (thesis
  with AUDI AG on trajectory-planning evaluation metrics, 1.0). B.Eng. same field, THM, Sep 2016
  (thesis with FAS GmbH on Kalman/particle-filter indoor localization, 1.1).
- **Additional:** C++/OOP tutor at THM, 2017.
- **Agentic:** Uses Claude Code and Cursor daily, including building the Python fleet-rollout
  tooling. Side projects on GitHub.

### Skill levels (initial estimate, owner to adjust)

| Group | Items (level) |
|---|---|
| Languages | C++ (3), Python (4), JavaScript/React (3), HTML/CSS (2) |
| Automotive | ADAS/AD integration (5), FlexRay/CAN/Automotive Ethernet (5), Sensor fusion (4), Vector CANoe (4) |
| Tooling | Git (5), Linux (4), CMake/Conan (4), Jenkins (3) |
| Leadership | OEM stakeholder interface (5), Team coordination (4), Hiring/interviewing (3), Jira/Confluence (4) |
| AI | Claude Code (4), Cursor (4), Agentic workflows (3) |

### Projects (`src/lib/projects.ts`)

- `GET https://api.github.com/users/FabianRiegsinger/repos?per_page=100`, fetched server-side with
  `next: { revalidate: 3600 }`. No token.
- Keep repos where `!fork && !private && topics.includes("portfolio")`.
- Map to `{ name, description, language, stars, url, homepage, updatedAt }`, sorted by `updatedAt` desc.
- Merge `project-overrides.ts` by repo name (override wins per field).
- On fetch error or non-200: return projects built from the overrides list only, never throw.
  Next's ISR keeps serving the last good page between successful revalidations.
- Owner action: add topic `portfolio` to `snap-notes` (and future repos).

## 5. Visual style

> **2026-10-12 update (`style/apple-glass`, evolves the Apple style below):** figure centred on every screen (no desktop view offset); text in one liquid-glass panel per section (translucent white gradient, `backdrop-filter: blur(28px) saturate(180%)`, bright rim, radius 2rem), limited to the left 36vw from 1024px up and floating over the figure below that; inner cards as lighter glass. Page background is `#F5F5F7` with soft blue/violet/peach radial blobs; the 3D canvas is transparent (no floor plane, no fog, contact shadow only). Career pages (2026-10-12, evening): the ring-and-car walk is gone; each career page is its own scene with a per-page `yaw` and pose overlay. Education (after the graduation photo, 2026-10-13): a light grey wall set piece with a round niche and a bronze bell that swings when he tugs its handle, dark terrazzo floor slab, no university marks; `ring` overlay (right hand on the bell handle, left hand on the hip), grey polo + beige chinos (`polo` outfit). While the education page is read, the background blobs cross-fade (typed CSS colour properties, `data-page` set by ActivePage) to THM green #80BA24 plus a light and a dark grey. Likewise per brand: ESAS page coral #F25544, light grey #E2E2E2, faint near-black #1A1A1A (esas-automotive.com Elementor global colours); Mobileye page brand blue #1E2EB8, periwinkle #CACAE7, soft pink #F2CAD4 (mobileye.com CSS). Page order: "Now building with AI" comes before Skills. Skills also shows the word "Claude" big behind the figure: extruded Inter ExtraBold (six-glyph typeface JSON made by scripts/make-typeface.mjs, OFL), one glossy colour per letter starting with Claude orange #D97757, turned and tilted slightly, letters bobbing out of step. Landing entrance time advances by frame time capped at 50 ms, so a first-frame stall pauses the walk-in instead of skipping it; the figure model is preloaded with the HTML. ESAS: navy blazer over the shirt and beige chinos (`business` outfit), open unbadged laptop, four generic colleagues (rig copies in their own clothes, faceless) at his sides and behind him. Mobileye: tablet in hand, a customer in a dark suit, an unbadged white test fleet with roof sensor racks parked in two diagonal rows behind (no AUDI marks). Skills: the balls are replaced by the skill names (self-hosted Inter, troika text) drifting on slow orbits around the figure, tilting gently in 3D, size and blue by level, shrinking away over the text. Landing entrance at scrollY < 40px: walks in from the right (starts just past the right edge, x = 2.2, 1.8s), turns to face the viewer (0.6s), waves (3s), settles into hands on hips (0.6s); scrolling ends it early. Wave and hands-on-hips are procedural Mixamo arm-bone overlays (`arm-pose.ts`) on the idle clip: hips at every idle station, wave at contact. Timeline cars moved to the right of the path. Avatar: the placeholder mannequin is dressed as a Memoji-style Fabian (`avatar.ts`): per-vertex garment colours by dominant bone (light-blue shirt, dark trousers, brown shoes, skin hands) and a procedural head on the head bone (oval skull fitted to the mannequin head, short swept brown hair, thin round metal glasses, blue-grey eyes that blink, small smile); the mannequin head bone is shrunk to 0.6 inside it. Later the same day: career split into three pages (`education`, `esas`, `mobileye`), giving eight pages/stations; each career page walks past its own milestone gates (`careerTravel`). Pages snap (`scroll-snap-type: y proximity`), panels rise/fade in and drift out with a CSS view-timeline animation (`translate`/`opacity`), and glass panels tilt up to 4° toward the mouse (`perspective(1400px)`, mouse pointers only, off with reduced motion). On desktop (≥1024px) the figure stands midway between the glass panel's right edge (`PANEL_EDGE` 0.39 = 3vw + 36vw) and the screen edge on every page (shift ≈ 0.195, desktop view offset, first frame starts there), 0.32 on the agentic page. The agent network is a screen-filling sheet of ~170 instanced nodes facing the agentic camera 4 units behind the figure (sized for 21:9 plus the view shift), drifting slowly in its own plane. On the about page the figure takes a thinking/reading pose (`think` overlay: slight spine and neck lean, head tilt, right hand to chin, left forearm across the waist) turned 0.25 rad toward the text panel.

- Background `#F5F5F7`, text `#1D1D1F`, muted text `#6E6E73` (4.66:1).
- Accent: `#2563EB` for text and links (4.75:1 on background); `#2F7BF6` only for 3D glow and large
  decorative shapes (3.65:1, fails as text).
- Agentic section adds a cyan–violet glow (`#22d3ee` → `#8b5cf6`), 3D/decoration only, never text
  (1.66:1 and 3.89:1).
- Light theme only. Inter, large tight headlines, quiet body text.
- Figure: matte white/ceramic material, faceless. Studio lighting: environment map + one key light,
  subtle reflective floor, contact shadows.
- Automotive and agent elements: thin lines, low-poly, never photoreal, no brand logos.
- Motion: eased, slow camera moves; text fades/slides in per section. At most 1–2 animated elements
  per view (the figure plus one set piece); no other decorative animation.
- Interaction: visible focus rings on all links and buttons, `cursor-pointer` on clickable
  elements, touch targets >= 44×44 px.
- Icons: SVG only (Simple Icons for GitHub, LinkedIn, Xing); no emoji.

### Figure asset

- Rigged base mannequin (e.g. Mixamo "Y Bot") with clips idle, walk, typing, wave, combined into
  `public/models/figure.glb`, Draco-compressed, target < 3 MB.
- Mixamo license terms must be verified before launch. If they do not permit this use, swap in a
  CC0 rigged mannequin; `Figure.tsx` only depends on the four clip names.

## 6. Performance and fallbacks

- Budget: first 3D frame < 3 s mid-range laptop; initial JS < 1 MB; ~60 fps desktop, >= 30 fps mobile.
- DPR capped at `[1, 1.5]`; drei `<PerformanceMonitor>` drops shadows/effects when fps falls.
- Mobile: 3D with reduced effects. No WebGL or `prefers-reduced-motion`: `StaticPage`.

## 7. Testing

- **Vitest:** `getProjects()` filters by topic, excludes forks/private, merges overrides, survives
  GitHub error and empty response. `scroll-map` ranges are contiguous and cover 0..1. `cv.ts` data
  satisfies its types and has no empty required fields.
- **Playwright smoke:** page loads and canvas mounts; with reduced motion emulated, the static
  fallback renders; CV headings and company names are present in the DOM.
- No visual/snapshot tests of the 3D scene.

## 8. Deployment and launch checklist

- Vercel project connected to the GitHub repo. Default `*.vercel.app` domain until a custom domain
  is chosen.
- Metadata, Open Graph image, JSON-LD `Person`.
- `/impressum` (§5 DDG) and `/privacy` (GDPR; Vercel processes visitor IPs) as templates. The owner
  fills in and checks the legal details; this is not legal advice.
- Email shown only as an obfuscated mailto link; phone number never published.
- Lighthouse SEO and Accessibility >= 90.

## 9. Out of scope (v1)

Blog, CMS, contact form, analytics, multi-language (English only), dark mode.

## 10. Open items for the owner

- Confirm or adjust skill levels in section 4.
- Custom domain (optional).
- Impressum and privacy details.
