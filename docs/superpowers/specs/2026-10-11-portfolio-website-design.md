# Portfolio Website — Design Spec

Date: 2026-10-11 (revised 2026-10-13 to match the site as built on `style/apple-glass`, PR #7)
Status: Approved; in development

## 1. Goal

A public personal website for Fabian Riegsinger that tells one story: an experienced automotive
system-integration and software engineer (8+ years, ADAS/AD) who is quickly adapting to the agentic
AI world. The CV is presented as a scroll-driven 3D journey, with a Memoji-style 3D avatar of Fabian
acting out each chapter.

### Success criteria

- A visitor understands within ~10 seconds: automotive engineer, 8+ years, now building with AI agents.
- All CV content is readable as real DOM text (crawlable, accessible), not only rendered in 3D.
- New GitHub projects appear on the site without a code change (tag repo with topic `portfolio`).
- Lighthouse SEO and Accessibility >= 90; first 3D frame < 3 s on a mid-range laptop.
- Site is online on Vercel with Impressum and privacy policy pages.

### Decisions made with the user

| Topic | Decision |
|---|---|
| Tech stack | Next.js (App Router) + React + TypeScript, Tailwind CSS |
| 3D approach | One fixed full-screen `<Canvas>` behind natively scrolling HTML; scroll position drives the 3D |
| Figure | Memoji-style avatar of Fabian on a rigged mannequin (procedural head and clothes), not a photo likeness |
| Style | Apple-style light theme with liquid-glass text panels (chosen over brutalism, neon, swiss and bento prototypes) |
| CV source | `curriculum-vitae-ats-nophoto.pdf` (Sept 2026), transcribed into `src/content/cv.ts` |
| Agentic evidence | Daily work with Claude Code and Cursor; side projects on GitHub (first: `snap-notes`) |
| Projects | Fetched from GitHub by topic `portfolio`, refreshed hourly |
| Brands | Employer and university colours tint the page; no logos, badges or crests anywhere |
| Domain | `www.eng-fabian-riegsinger.de` at launch (apex redirects to www) |

## 2. Architecture

- **Framework:** Next.js App Router (`cacheComponents`), TypeScript, Tailwind CSS v4, `next/font` (Inter).
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`.
- **Hosting:** Vercel; `main` deploys to production, PRs get preview deploys. Production stays behind
  Vercel Authentication until launch.
- **Routes:** `/`, plus `/impressum` and `/privacy`.

`app/page.tsx` is a server component. It loads `cv` and the cached projects and renders
`<ExperienceGate>` around the server-rendered `<StaticPage>`. On the client, the gate upgrades to the
3D experience (`React.lazy`, with the static page as the Suspense fallback) only when WebGL is
available and `prefers-reduced-motion` is off. Any 3D error falls back to the static page. The
static page's still of the figure stays hidden until the page has settled on static
(`html[data-experience="static"]`), so it never flashes before the 3D figure walks in.

### Scroll journey

The canvas is fixed behind eight full-screen sections. `ScrollTracker` maps the viewport centre onto
a 0..1 station offset using the measured section rects, so 3D stays in sync with text of any height.
`lib/scroll-map.ts` holds one station per section: range, pose clip, camera, look-at target, screen
shift and figure yaw. The camera and yaw ease to the next station over the second half of each page.

| Station | Pose | 3D scene | HTML content |
|---|---|---|---|
| hero | walk-in, wave, hands on hips | figure only | Name, headline, "Automotive engineer → agentic builder" |
| about | thinking/reading, turned toward the text | figure only | Summary, location |
| education | rings the graduation bell | grey wall with round niche, bronze bell, terrazzo floor | B.Eng. and M.Sc. |
| esas | holds an open laptop | four colleagues around him | ESAS role, highlights, tags |
| mobileye | holds a tablet, gestures to the fleet | customer, unbadged test fleet | Mobileye role, highlights, tags |
| agentic | hands on hips | screen-filling network of nodes | Claude Code, Cursor, how used; GitHub project cards |
| skills | hands on hips | word cloud of the skill names | Skill groups with level dots |
| contact | wave | figure only | GitHub, LinkedIn, Xing, obfuscated email link |

**Landing entrance** (only when the page loads at the top): the figure walks in from just past the
right edge (1.8 s), turns to the viewer (0.6 s), waves (3 s) and settles into hands on hips (0.6 s).
Entrance time advances by frame time capped at 50 ms, so a first-frame shader-compile stall pauses
the walk instead of skipping it. Scrolling ends the entrance early.

**Figure position:** on desktop (>= 1024 px) the projection is shifted so the figure stands midway
between the glass panel's right edge (`PANEL_EDGE` = 0.39 of the width: 3vw gutter + 36vw panel) and
the screen edge. The agentic page shifts further (0.32) to make room for the network. Below 1024 px
the figure is centred behind the panels.

**Page transitions:** `scroll-snap-type: y proximity`; each glass panel rises and fades in, then
drifts out, through a CSS view-timeline animation (`translate`/`opacity`, off with reduced motion,
absent in browsers without view timelines).

## 3. Components

| File | Responsibility |
|---|---|
| `src/app/page.tsx` | Server: load `cv` + projects, render `ExperienceGate` around `StaticPage` |
| `src/app/layout.tsx` | Fonts, metadata, Open Graph, JSON-LD `Person`, preload of `figure.glb` |
| `src/app/impressum/page.tsx`, `src/app/privacy/page.tsx` | Legal templates, details filled by the owner |
| `src/components/ExperienceGate.tsx` | Capability check, lazy 3D upgrade, error fallback, `data-experience` |
| `src/components/StaticPage.tsx` | The eight sections (+ `ActivePage`); with the figure still when static |
| `src/components/ActivePage.tsx` | Sets `<html data-page>` to the section being read (drives page tints) |
| `src/components/sections/*.tsx` | HTML per section; `GlassPanel` (glass + mouse tilt), `Timeline` (three career sections) |
| `src/components/three/Experience3D.tsx` | Canvas, lights, environment, contact shadows, all scenes |
| `src/components/three/ScrollTracker.tsx`, `CameraRig.tsx` | Scroll → station offset; camera pose and screen shift |
| `src/components/three/Figure.tsx` | Avatar: clips, entrance, yaw, pose overlays, outfits, props |
| `src/components/three/arm-pose.ts` | Procedural arm and spine overlays on the playing clip |
| `src/components/three/avatar.ts` | Memoji head, per-vertex outfits, `stripAvatar` for rig copies |
| `src/components/three/props.ts` | Laptop and tablet |
| `src/components/three/Person.tsx` | Generic faceless person (rig copy in its own clothes) |
| `src/components/three/stations/*.tsx` | `Graduation`, `Team`, `Fleet`, `AgentNetwork`, `SkillCloud` |
| `src/lib/scroll-map.ts` | Stations, `stationAt`, `toStationOffset`, `stationWeight`, `heading` |
| `src/lib/entrance.ts` | Entrance timeline, `introStep`, `poseFor` |
| `src/lib/projects.ts`, `projects-cache.ts` | GitHub fetch, filter, override merge; hourly cache |
| `src/content/cv.ts`, `project-overrides.ts` | All CV content, typed; optional per-repo blurbs |
| `scripts/build-figure.mjs`, `scripts/make-typeface.mjs` | Rebuild `figure.glb`; convert a font to typeface JSON |

## 4. Data model

### `src/content/cv.ts`

```ts
type Level = 1 | 2 | 3 | 4 | 5;

profile:    { name, headline, location, summary, links: { github, xing, linkedin, email: { user, domain } } }
experience: { company, role, start, end: string | null, location, highlights: string[], tags: string[] }[]
education:  { degree, school, end, note }[]
skills:     { group: "Languages" | "Automotive" | "Tooling" | "Leadership" | "AI"; items: { name: string; level: Level }[] }[]
agentic:    { intro: string; tools: string[]; workUse: string }
additional: { title, year }[]
```

Each job maps to its own page, oldest first (`JOB_STATIONS` = `esas`, `mobileye`); a test fails if a
job is added without a page.

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
- **Agentic:** Uses Claude Code and Cursor every day, at work and on side projects; this website was
  built with Claude Code.

### Skill levels

| Group | Items (level) |
|---|---|
| Languages | C++ (3), Python (4), JavaScript/React (3), HTML/CSS (2) |
| Automotive | ADAS/AD integration (5), FlexRay/CAN/Automotive Ethernet (5), Sensor fusion (4), Vector CANoe (4) |
| Tooling | Git (5), Linux (4), CMake/Conan (4), Jenkins (3) |
| Leadership | OEM stakeholder interface (5), Team coordination (4), Hiring/interviewing (3), Jira/Confluence (4) |
| AI | Claude Code (4), Cursor (4), Agentic workflows (3) |

### Projects (`src/lib/projects.ts`)

- `GET https://api.github.com/users/FabianRiegsinger/repos?per_page=100`, server-side, cached for an
  hour (`"use cache"` + `cacheLife("hours")`). Optional `GITHUB_TOKEN` (Vercel env only, never in
  code) raises the rate limit.
- Keep repos where `!fork && !private && topics.includes("portfolio")`.
- Map to `{ name, description, language, stars, url, homepage, updatedAt }`, sorted by `updatedAt` desc.
- Merge `project-overrides.ts` by repo name (override wins per field).
- On fetch error, non-200 or an empty result: return projects built from the overrides list only,
  never throw.
- Owner action: add topic `portfolio` to `snap-notes` (and future repos).

## 5. Visual style

### Page

- Background `#F5F5F7` with three soft radial colour blobs (blue `#2F7BF6`, violet `#8B5CF6`, peach
  `#FFA878`), behind a transparent canvas (no floor plane, no fog; contact shadows only).
- **Per-page tints:** while a page is read, the blobs cross-fade (typed CSS colour properties,
  `data-page`) to that page's palette. Colours only, never logos.

  | Page | Blob colours | Source |
  |---|---|---|
  | education | THM green `#80BA24`, light grey, dark grey | THM brand green, the graduation photo |
  | esas | coral `#F25544`, light grey `#E2E2E2`, near-black `#1A1A1A` | esas-automotive.com theme |
  | mobileye | brand blue `#1E2EB8`, periwinkle `#CACAE7`, soft pink `#F2CAD4` | mobileye.com CSS |

- Text `#1D1D1F`, muted `#6E6E73` (4.66:1). Accent `#2563EB` for text and links (4.75:1);
  `#2F7BF6` only for 3D glow and large decorative shapes (fails as text).
- Inter, large tight headlines, quiet body text. Light theme only.

### Liquid-glass panels

- One panel per page: translucent white gradient, `backdrop-filter: blur(28px) saturate(180%)`,
  bright rim and top highlight, radius 2rem; inner cards as lighter glass.
- From 1024 px up the panel sits in the left 36vw (keep `GlassPanel` and `PANEL_EDGE` in sync);
  below that it spans the width and floats over the frosted figure.
- The panel's face tilts up to 4° toward the mouse (`perspective(1400px)`), mouse pointers only, off
  with reduced motion.

### Avatar

- Rig: placeholder mannequin `figure.glb` (Mixamo-derived Xbot; clips `idle`, `walk`).
- Head: Memoji-style, procedural, on the head bone and fitted to the mannequin head (which shrinks to
  0.6 inside it): oval skull, short swept brown hair, thin round metal glasses, blue-grey eyes that
  blink, small smile.
- Outfits are per-vertex colours by dominant bone, swapped per page: `casual` (light-blue shirt, dark
  trousers), `business` on ESAS (navy blazer over the shirt, beige chinos), `polo` on education (grey
  polo, beige chinos, after the graduation photo).
- Poses are procedural overlays on the idle clip (`arm-pose.ts`): `wave`, `hips`, `think` (spine
  and neck lean, hand to chin), `ring` (right hand on the bell handle, left on the hip), `laptop`,
  `tablet`. Hands on hips is the rest pose.
- Other people are copies of the rig with the avatar stripped: faceless, in their own clothes.

### Scenes

- **Education:** light grey wall set piece with a round niche; a bronze bell that swings when he tugs
  its handle; dark terrazzo floor slab. No university marks.
- **ESAS:** open unbadged laptop; four colleagues at his sides and behind him, never nearer the
  camera than him, idling out of step, one gesturing.
- **Mobileye:** tablet in hand; a customer in a dark suit facing him; an unbadged white test fleet
  with roof sensor racks in two diagonal rows behind (slightly under life size). No AUDI marks.
- **Agentic:** ~170 instanced nodes and links on a sheet facing the camera, 4 units behind the
  figure, sized for 21:9 plus the view shift, drifting slowly in its own plane (cyan → violet).
- **Skills:** the skill names as a static word cloud 1.6 m behind him: extruded, bevelled Inter Bold
  words facing the camera, inside a cartoon-cloud outline (flat base, five puffs) sized to the space
  beside the glass panel, with his silhouette kept free. Shuffled, mostly horizontal (only names
  under 10 characters may run vertically), sizes by level times a random factor, each word its own
  shade along the site palette (`#2563EB` → `#2F7BF6` → `#8B5CF6` → `#FFA878`).

### Motion and interaction

- Eased camera moves between stations; panel fades per page; the bell swings, nodes pulse, eyes
  blink. No other decorative animation.
- Visible focus rings on all links and buttons, `cursor-pointer` on clickable elements, touch
  targets >= 44×44 px.
- Icons: SVG only (Simple Icons for GitHub and Xing, the standard LinkedIn mark); no emoji.

### Assets and licences

- `figure.glb` is a placeholder (three.js `Xbot.glb`, Mixamo-derived; terms unverified for this use).
  Replace before launch; see `public/models/LICENSE.md`. The site needs the `idle` and `walk`
  clips; `typing` and `wave` clips are optional (poses are procedural).
- Word-cloud font: `public/fonts/inter-700.typeface.json` (Inter Bold, printable ASCII, made with
  `scripts/make-typeface.mjs`), SIL Open Font License (`public/fonts/LICENSE-Inter.txt`).

## 6. Performance and fallbacks

- Budget: first 3D frame < 3 s mid-range laptop; initial JS < 1 MB; ~60 fps desktop, >= 30 fps mobile.
- DPR capped at `[1, 1.5]`; drei `<PerformanceMonitor>` drops shadows when fps falls.
- `figure.glb` is preloaded with the HTML. Everything that loads inside the canvas (models, fonts)
  suspends inside it, so the page never falls back to the static version once 3D is up.
- Mobile: 3D with reduced effects. No WebGL or `prefers-reduced-motion`: static page.
- Watch on real phones: `backdrop-filter` over a live canvas, the rig copies, the fleet and the
  word cloud all cost GPU time.

## 7. Testing

- **Vitest (unit):** projects filter/merge/fallback; scroll-map stations, offsets, weights and yaw;
  entrance timeline and `introStep`; pose mapping; CV data and job pages; outfits and props; scene
  layouts (team, fleet, bell reach, network size, word-cloud packing and colours); tilt; active page.
- **Playwright (smoke):** page loads and canvas mounts; static page with reduced motion and on model
  failure; CV text, JSON-LD, metadata and legal pages; no phone number; 360 px without horizontal
  scroll; 44 px contact targets and focus rings; eight pages in order; glass panels, snap,
  view-timeline fade and tilt; per-page blob colours; no fallback-still flash and no static page
  flashing back after the 3D upgrade.
- No visual/snapshot tests of the 3D scene; scenes are checked by screenshot during development.

## 8. Deployment and launch checklist

- Vercel project connected to the GitHub repo; previews are protected by Vercel Authentication.
- Custom domain `www.eng-fabian-riegsinger.de` (apex redirects to www); set
  `NEXT_PUBLIC_SITE_URL=https://www.eng-fabian-riegsinger.de` for production.
- Metadata, Open Graph image, JSON-LD `Person`.
- `/impressum` (§5 DDG) and `/privacy` (GDPR; Vercel processes visitor IPs) as templates. The owner
  fills in and checks the legal details; this is not legal advice.
- Replace the placeholder `figure.glb`.
- Email shown only as an obfuscated mailto link; phone number never published.
- Turn off Vercel Authentication for production only after the steps above.
- Lighthouse SEO and Accessibility >= 90.

## 9. Out of scope (v1)

Blog, CMS, contact form, analytics, multi-language (English only), dark mode.

## 10. Open items for the owner

- Impressum and privacy details.
- A licensed replacement for `figure.glb` (Mixamo FBX Binary 7.4 export, or a CC0 rig).
- Register `eng-fabian-riegsinger.de` and set up DNS.
- Refresh `public/fallback.webp`: it still shows the bare grey mannequin, not the avatar.
