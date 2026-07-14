# flumenlabs.eu

The apex landing for **Flumen Labs** — calm, trauma-informed, accessibility-first tools.

## Stack

Astro 6 · TypeScript (strict) · pnpm · Node 22 LTS · Biome · vanilla CSS with custom properties.

## Local development

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # produces ./dist
pnpm preview      # serves ./dist locally
pnpm typecheck    # astro check
pnpm lint         # biome lint
pnpm format       # biome format --write
pnpm format:check # biome format (no writes)
```

## Project structure

- `src/pages/` — every file is a route. `index.astro` is the apex; `writing/[...slug].astro` is the dynamic post template.
- `src/content/projects/*.yaml` — the cards on the landing. Add a `.yaml` file, fill out the schema, and a new card appears.
- `src/content/writing/*.md` — essays. Add a markdown file with frontmatter (`title`, `date`, `description?`, `draft?`) and it appears at `/writing/<slug>/`.
- `src/components/` — `BrandMark`, `Waves`, `Eyebrow`, `ProjectCard`.
- `src/layouts/Base.astro` — shared shell: head, skip link, header, footer, view transitions, reveal-animation script.
- `src/styles/` — `tokens.css` (CSS custom properties) and `globals.css` (reset, body bg, motion override).
- `public/` — files served verbatim (`favicon.svg`, `robots.txt`).
- `src/assets/brand-mark.svg` — canonical brand mark. `public/favicon.svg` is a synced manual copy.

## Brand & design

Palette and other design tokens live in `src/styles/tokens.css`. Fonts are Fraunces (display, italic for emphasis) and Hanken Grotesk (body), loaded from Google Fonts.

Accessibility commitments: skip link, `prefers-reduced-motion` blanket override, focus-visible states on all interactive elements, one `<h1>` per page, semantic landmarks.
