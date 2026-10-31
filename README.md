# Portfolio

Lizaveta Kukharava's portfolio: five static HTML pages with shared CSS and local
images/PDFs. No framework or production build step.

## View locally

Install **Node.js 22.12+** (with npm), then run from this folder:

```sh
npm ci           # first time, or after dependencies change
npm run dev
```

Open **http://127.0.0.1:3000**. Saved HTML/CSS changes update the browser
automatically. Stop the server with **Ctrl+C**.

If port 3000 is busy: `npm run dev -- --port 3001`.
The preview is local to your computer; Vite is only a development tool.

## Edit and check

- Pages: `index.html`, `about.html`, `work.html`, `cv.html`, `impressum.html`.
- Shared styling: `style.css`; page layouts: `css/`.
- Media: root images/PDFs, `assets/`, and `helvetica_font/`.
- Agent guidance: `AGENTS.md`.

```sh
npm test
```

Tests check content preservation, markup, links/assets, and the preview server.
Intentional content changes require updating the corresponding test baselines.
Deployment still uses the static files directly—no Vite server is required.
