# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hiring teams for in-house UX roles, mostly recruiters and design leads
in Berlin and the wider EU. They scan many portfolios quickly and decide whether
to open case studies and contact the candidate.

Secondary: freelance clients (small teams and founders, via Upwork or direct
contact) looking to commission a UX or brand project. Welcome, but employment
comes first.

## Product Purpose

Personal portfolio for Lizaveta Kukharava, a Berlin-based UX designer. It
introduces her, shows her background and working strengths, and sends visitors
to full case studies on Behance. Success: a visitor opens a case study and
reaches out by email, LinkedIn, or Upwork about a role or project.

## Positioning

She came to UX from customer acquisition, team-lead work, and language teaching
and interpreting. Her design starts from empathy and clear communication with
real customers. She is multilingual (English, Russian, German, Belarusian,
Polish).

## Operating Context

- Visitors usually arrive from a job application, LinkedIn, Behance, or Upwork,
  and spend little time per portfolio.
- Case studies live on Behance; the site's Work section links out to them.
- Contact paths: `contact@lizavetakuk.com`, LinkedIn, Behance, Upwork.
- Served at `lizavetakuk.com` via GitHub Pages.

## Capabilities and Constraints

- Static Astro site: one scrolling page (Home, Work, About) plus a separate
  Impressum. No client framework, backend, or server runtime. `about.html` and
  `work.html` stay as jump documents for older links.
- Full case studies stay on Behance; the site does not host them.
- Animation work stays separate from this site.
- Site copy is English. The Impressum is German and required (German law).
- Assets stay local; no third-party image URLs.

## Brand Commitments

- Name: Lizaveta Kukharava; wordmark "LiKUK".
- Tagline: "Empathetic Designer: Meaningful Connections via Design".
- Voice: warm, first-person, growth-oriented, collaborative.
- Multilingual greeting (Hello, Привет, Hallo, Вітаю, Cześć) reflects her
  languages.

## Evidence on Hand

- Four Behance case studies (`src/data/projects.ts`): International Fashion Show
  website redesign, Hop travel app redesign, Cloud 9 weather app, Rapuha brand
  identity.
- Three real feedback quotes from colleagues and clients, shown unattributed
  (`src/components/AboutSection.astro`). Do not add names, titles, or extra
  quotes without her confirmation.
- Background stories with photos: Andersen lab (customer acquisition to team
  lead), ReDI School Kids coding classes (volunteering), first app at home.
- Portrait: `public/profile.webp`.
- Absent, never fabricate: client logos, metrics or outcomes, employer
  endorsements, awards, press.

## Product Principles

1. Get hiring teams to the case studies and contact paths fast.
2. Let her customer-facing and teaching background explain her empathy-led
   design approach.
3. Show only real work and real feedback; no invented proof.
4. The site is itself a sample of her craft, so it must be accessible and
   carefully made.

## Accessibility & Inclusion

Keep semantic landmarks and headings, image alternatives, visible focus, and
reduced-motion support. State indicators (current section, focus) need at least
3:1 contrast. Each greeting word carries its own `lang`.
