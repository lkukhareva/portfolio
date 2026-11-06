# Agent guide

## Project

Static portfolio for Berlin-based UX designer Lizaveta Kukharava. Astro generates
HTML/CSS with no client-side application framework, backend, or production Node
server. Case studies link to Behance. Home, About, and Work are sections of one
scrolling page. Impressum stays separate. Animation work is separate.

## Structure

- `src/pages/index.astro`: scrolling portfolio (`#home`, `#about`, `#work`).
- `src/pages/{about,work}.astro`: compatibility documents that jump to `./#about`
  and `./#work`, so the address bar settles on `/#about` or `/portfolio/#about`.
- `src/pages/impressum.astro`: legal page.
- `src/components/{Home,About,Work}Section.astro`: section markup.
- `src/layouts/BaseLayout.astro`: shared document, metadata, stylesheet order.
- `src/components/`: header, footer, and work project card markup.
- `src/data/projects.ts`: project copy, destinations, and image references.
- `public/style.css`: shared colors, `.container` column and gutter, section
  labels, header/navigation, footer, scroll clearance.
- `public/css/{index,about,work}.css`: hero, about (quotes, strengths, stories),
  and project-card layouts. Class names are per component (`hero-*`, `story-*`,
  `project-*`); do not reintroduce exported `div-N`/`column-N`/`img-N` names.
- `public/scroll-nav.js`: sets `aria-current="true"` from the visible section.
  It must not rewrite the URL. Anchors work without it.
- `public/css/impressum.css`: legal-page layout.
- `public/`: original images, decorative SVG in `assets/`, and `helvetica_font/`.
  Font files are retained but not loaded via `@font-face`. Public files are copied
  unchanged to preserve rendering and asset URLs during migration.
- `astro.config.mjs`: static output with file-format `.html` routes; loopback
  development/preview on port 3000, rejecting port conflicts.
- `.github/workflows/deploy.yml`: single-job GitHub Pages deployment from `master`,
  using Node.js/npm and the configured Pages origin/base path. Custom domain:
  `lizavetakuk.com` (configured in GitHub Pages settings, not in local dev).
- `dist/`: generated deployable site, ignored along with `.astro/`.
- `tests/site.test.mjs`: generated HTML structure, copy, links, assets, and
  published-file checks. `tests/design-review.test.mjs`: contact links, skip
  link, image weight/dimensions, card labels, and list semantics.
- `tests/scroll-nav.test.mjs`: section-highlighting script behavior.
- `tests/dev-server.test.mjs`: HTTP integration checks for Astro development and
  production preview on temporary loopback ports; closes servers afterward.
- `tests/pages-build.test.mjs` exercises the deployment
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
`node --test tests/site.test.mjs tests/design-review.test.mjs`.

Optional HTML validation after building:

```sh
npx --yes html-validate@11.17.0 --preset standard,a11y dist/index.html dist/about.html dist/work.html dist/impressum.html
```

## Change guidelines

- Keep static output and minimal dependencies. Prefer Astro components, CSS, and
  selective vanilla JavaScript over introducing a client framework or router.
- Preserve wording, images, layout, and link destinations unless the task changes
  them. Copy and image lists in the tests protect the content; update only the
  relevant entries for intentional changes, and do not remove checks just to make
  tests pass. Test behavior and output, not exact CSS/YAML text or file hashes.
- Reuse the shared layout/components and project data. Primary navigation uses
  `./#home`, `./#about`, and `./#work` so both the domain root and the Pages
  subpath stay on one document. Do not add a client router or SPA fallback.
  Keep `about.html` and `work.html` as jump documents.
- Put shared rules in `public/style.css`, not duplicated page styles. Lay out
  with grid/flex and `.container`, not fixed offsets or per-item copies. Preserve
  stylesheet order, semantic landmarks/headings, image alternatives, focus
  styles, and reduced-motion support.
- Keep assets local; do not embed credentials or introduce third-party image URLs.
- Add regression tests for behavior changes. Run `npm run check` and `npm test`
  before finishing. HTTP/source checks do not prove visual or screen-reader
  behavior—state what remains unverified. Keep the lockfile in sync when changing
  dependencies.
