# Agent guide

## Project

Static portfolio for Berlin-based UX designer Lizaveta Kukharava. Astro generates
HTML/CSS with no client-side application framework, backend, or production Node
server. Case studies link to Behance. The initial migration preserves the
original layout and content; redesign and animation work is separate.

## Structure

- `src/pages/{index,about,work,impressum}.astro`: page content.
- `src/layouts/BaseLayout.astro`: shared document, metadata, stylesheet order.
- `src/components/`: header, footer, and work project card markup.
- `src/data/projects.ts`: project copy, destinations, and image references.
- `public/style.css`: shared colors, header/navigation, footer, accessibility.
- `public/css/<page>.css`: page-specific layouts; loaded after shared CSS.
- `public/`: original images, decorative SVG in `assets/`, and `helvetica_font/`.
  Font files are retained but not loaded via `@font-face`. Public files are copied
  unchanged to preserve rendering and asset URLs during migration.
- `astro.config.mjs`: static output with file-format `.html` routes; loopback
  development/preview on port 3000, rejecting port conflicts.
- `.github/workflows/deploy.yml`: single-job GitHub Pages deployment from `master`,
  using Node.js/npm and the configured Pages origin/base path. Custom domain:
  `lizavetakuk.com` (configured in GitHub Pages settings, not in local dev).
- `dist/`: generated deployable site, ignored along with `.astro/`.
- `tests/site.test.mjs`: generated HTML/content and CSS regression checks.
- `tests/migration.test.mjs`: pre-migration body/asset fingerprints and static
  output checks, backed by `tests/fixtures/pre-migration.json`.
- `tests/dev-server.test.mjs`: HTTP integration checks for Astro development and
  production preview on temporary loopback ports; closes servers afterward.
- `tests/pages-workflow.test.mjs`: deployment trigger, validation, artifact, and
  security contract checks. `tests/pages-build.test.mjs` exercises the deployment
  build flags and page/asset URLs at both a custom-domain root and a repo subpath.

## Commands

Requires Node.js 22.23.4+ and npm 9.6.5+. Run from the project root.

```sh
npm ci
npm run dev     # http://127.0.0.1:3000; Ctrl+C to stop
npm run check
npm test        # builds first, then runs all tests
npm run build   # publish only dist/ to a static host
npm run preview # local verification of the generated site, not production hosting
```

Override a busy port with `npm run dev -- --port 3001` (also works for preview).
The servers deliberately bind to loopback and exit on port conflicts rather than
silently changing URLs. Static hosting must retain normal file/404 behavior, not
an SPA fallback. There is no server adapter or production runtime.

For narrower output-only checks after building:
`node --test tests/site.test.mjs tests/migration.test.mjs`.

Optional HTML validation after building:

```sh
npx --yes html-validate@11.17.0 --preset standard,a11y dist/index.html dist/about.html dist/work.html dist/impressum.html
```

## Change guidelines

- Keep static output and minimal dependencies. Prefer Astro components, CSS, and
  selective vanilla JavaScript over introducing a client framework or router.
- Preserve wording, images, layout, and link destinations unless the task changes
  them. Fingerprints and image lists intentionally protect the original content.
  Update only relevant baselines for intentional changes; do not remove checks
  just to make tests pass.
- Reuse the shared layout/components and project data. Keep navigation links
  consistent with static `aria-current="page"` markers; no navigation script is
  needed. Preserve the published `.html` URLs unless a task plans their migration.
- Put shared rules in `public/style.css`, not duplicated page styles. Preserve
  stylesheet order, semantic landmarks/headings, image alternatives, focus
  styles, and reduced-motion support.
- Keep assets local; do not embed credentials or introduce third-party image URLs.
- Add regression tests for behavior changes. Run `npm run check` and `npm test`
  before finishing. HTTP/source checks do not prove visual or screen-reader
  behavior—state what remains unverified. Keep the lockfile in sync when changing
  dependencies.
