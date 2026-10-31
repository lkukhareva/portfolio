# Agent guide

## Project

Static portfolio for Berlin-based UX designer Lizaveta Kukharava. Plain HTML/CSS;
no client-side application framework, backend, or production build. Case studies
link to Behance. Vite is development-only tooling for local preview/live updates.

## Structure

- Root HTML: `index.html`, `about.html`, `work.html`, `cv.html`, `impressum.html`.
- `style.css`: shared colors, header/navigation, footer, accessibility styles.
- `css/<page>.css`: page-specific layouts; loaded after shared CSS.
- Images/PDFs and `helvetica_font/`: original media. `assets/` holds the local
  decorative SVG arrow. Font files are retained but not loaded via `@font-face`.
- `tests/site.test.mjs`: dependency-free source/content regression checks.
- `tests/dev-server.test.mjs`: HTTP integration checks using Vite on a temporary
  loopback port; closes the server afterward.

## Commands

Requires Node.js 22.12+ and npm. Run commands from the project root.

```sh
npm ci
npm run dev     # http://127.0.0.1:3000; Ctrl+C to stop
npm test
```

Override a busy port with `npm run dev -- --port 3001`. The dev server deliberately
binds to loopback and exits on port conflicts rather than silently changing URLs.
For source-only checks without installing Vite: `node --test tests/site.test.mjs`.
Optional HTML validation:

```sh
npx --yes html-validate@11.17.0 --preset standard,a11y index.html about.html work.html cv.html impressum.html
```

## Change guidelines

- Keep the site build-free; prefer small HTML/CSS changes and minimal dependencies.
- Preserve wording, images, and link destinations unless the task changes them.
  Content fingerprints, URL fingerprints, and image lists in the source tests
  intentionally protect the original content. Update only relevant baselines
  when content changes are intended; do not remove checks just to make tests pass.
- Navigation/footer markup is repeated across pages. Keep links consistent and
  use static `aria-current="page"` markers; no navigation script is needed.
- Put shared rules in `style.css`, not duplicated page styles. Preserve semantic
  landmarks/headings, image alternatives, focus styles, and reduced-motion support.
- Keep assets local; do not embed credentials or introduce third-party image URLs.
- Add regression tests for behavior changes; run `npm test` before finishing.
  HTTP/source checks do not prove visual or screen-reader behavior—state what
  remains unverified. Keep the lockfile in sync when changing dependencies.
