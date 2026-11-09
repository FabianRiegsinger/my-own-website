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
- **Projects:** every public, non-fork, non-archived GitHub repo is shown automatically. A new repo appears on
  the site within an hour, no code change needed. Optional per-repo text/image overrides: `src/content/project-overrides.ts`.
- **Legal pages:** fill every `[TO FILL]` in `src/app/impressum/page.tsx` and `src/app/privacy/page.tsx`.

## 3D figure

`public/models/me.glb` is the figure (`src/components/three/GenMe.tsx`): rigged, without animation clips; he is
posed and animated in code. The ESAS colleagues (`public/models/colleague-*.glb`) are built from it with:

```bash
node scripts/build-colleagues.mjs public/models/me.glb public/models
```

Sources and licenses: `public/models/LICENSE.md`.

## Deploy

Vercel. Optional env vars:

- `NEXT_PUBLIC_SITE_URL`: custom domain for metadata, sitemap and structured data (defaults to the Vercel
  production domain).
- `GOOGLE_SITE_VERIFICATION`: the `content` value of the `google-site-verification` meta tag that Google Search Console
  shows when you add the site (URL-prefix property, "HTML tag" method). Without it, no tag is rendered.
- `GITHUB_TOKEN`: a fine-grained token with no permissions; avoids GitHub's anonymous rate limit on shared IPs.

## Getting found on Google

The pages already ship what Google needs: a title and description per language, canonical and `hreflang` links
(with `x-default`), a sitemap at `/sitemap.xml`, `robots.txt`, and schema.org data (website, person and, on the two
homepages, a profile page). The legal pages are `noindex`. What no code can do is make Google aware of the site:

1. Add the site in [Google Search Console](https://search.google.com/search-console) and verify it (see
   `GOOGLE_SITE_VERIFICATION` above, or verify a custom domain through DNS).
2. Submit `<site>/sitemap.xml` and use "Request indexing" on the homepage and on `/de`.
3. Link to the site from places Google already crawls: the GitHub profile and repository "Website" field, LinkedIn, Xing.
4. Check the page source of the live site: `<link rel="canonical">` must show the real address, not `http://localhost:3000`
   (set `NEXT_PUBLIC_SITE_URL` if it does).
