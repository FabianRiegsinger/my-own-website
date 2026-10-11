# my-own-website

Personal portfolio of Fabian Riegsinger: a scroll-driven 3D journey from automotive engineering to agentic AI.
Next.js (App Router) + React Three Fiber, deployed on Vercel.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (Vitest)
npm run e2e        # browser tests (Playwright, builds first)
```

## Edit content

- **CV:** everything the site says lives in `src/content/cv.ts`.
- **Projects:** add the topic `portfolio` to a public GitHub repo. It appears on the site within an hour, no
  code change needed. Optional per-repo text/image overrides: `src/content/project-overrides.ts`.
- **Legal pages:** fill every `[TO FILL]` in `src/app/impressum/page.tsx` and `src/app/privacy/page.tsx`.

## 3D figure

`public/models/figure.glb` holds the mannequin and its animation clips (`idle`, `walk`, `typing`, `wave`;
missing clips fall back to `idle`). Rebuild from a GLB with:

```bash
node scripts/build-figure.mjs <in.glb> public/models/figure.glb idle=idle walk=walk
```

Sources and licenses: `public/models/LICENSE.md`. The current figure is a placeholder; replace it before launch.

## Deploy

Vercel. Optional env vars:

- `NEXT_PUBLIC_SITE_URL`: custom domain for metadata, sitemap and structured data (defaults to the Vercel
  production domain).
- `GITHUB_TOKEN`: a fine-grained token with no permissions; avoids GitHub's anonymous rate limit on shared IPs.
