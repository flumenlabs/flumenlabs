# Apex Site Tooling — Design Spec

**Date:** 2026-05-28
**Repo:** `flumenlabs/flumenlabs` (the apex landing for `flumenlabs.eu`)
**Scope:** Group A — apex site evolution (local iteration + multi-page structure).
**Out of scope (follow-up specs):** Group B — deploy/CI pipeline; Group C — shared design system across the four `flumenlabs/*` repos.

---

## Context

The apex repo is currently a single 14k inline-everything `index.html`. The page introduces Flumen Labs and links to three subdomain projects (Josefine, Solace, eu-accessibility) hosted in sibling repos under the same GitHub org. The trauma-informed / accessibility-first ethos demands the site stay fast, quiet, and resilient.

We need to evolve from "one HTML file" into a multi-page, content-driven site without sacrificing the qualities that make the current site good:

- Tiny page weight (zero framework runtime on content pages by default)
- No client-side hydration overhead unless explicitly opted into
- Static output that deploys anywhere
- Honors `prefers-reduced-motion`, semantic HTML, skip links, focus-visible states

Decisions made here should leave room for Groups B and C without locking them in.

## Goals

1. **Multi-page structure** with a shared layout: `/`, `/about`, `/manifesto`, `/privacy`.
2. **Markdown-based writing section** at `/writing` for occasional essays, with an index and per-post pages, RSS feed.
3. **Data-driven project listing**: the three project cards become entries in YAML files validated against a Zod schema. Adding a fourth project is a data edit, not an HTML edit.
4. **TypeScript-first** authoring with the modern (May 2026) stable stack.
5. **Visual parity** with the existing landing on day one — this migration is structural, not a redesign. Same palette, fonts, waves, brand mark, animations, accessibility features.
6. **Local dev**: `pnpm dev` opens a hot-reloading server.
7. **Build**: `pnpm build` produces a `dist/` of static HTML/CSS/JS deployable on any static host.

## Non-goals

- Redesigning the landing (visual or content). New content goes on the new pages (`/about`, `/manifesto`, `/privacy`, `/writing`).
- Changing how the site is deployed (Group B).
- Distributing tokens/components to sibling repos (Group C).
- Internationalization.
- A CMS or admin UI — markdown files in git are the writing model.

## Stack

| Concern | Choice | Why |
|---|---|---|
| SSG | **Astro 5.x** | Content Collections, zero JS by default, TS-first, components portable to future Group C work |
| Language | **TypeScript (strict)** | Required |
| Package manager | **pnpm** | Faster, smaller node_modules; standard for new TS projects in 2026 |
| Node | **22 LTS** (pinned via `.nvmrc`) | Current LTS |
| Lint/format | **Biome** | Single fast binary, replaces ESLint + Prettier |
| Styles | **Vanilla CSS with custom properties** | Mirrors the current site; preserves design tokens in `:root`; no Tailwind dependency |
| Markdown | Astro built-in (remark) | First-class; supports frontmatter and Zod-validated schemas |
| Images | `astro:assets` | Built-in optimization for future images |
| View transitions | Astro `<ClientRouter />` opt-in in `Base.astro` | Gentle cross-page transitions fit the brand; respects `prefers-reduced-motion` automatically |
| Sitemap | `@astrojs/sitemap` | Standard hygiene |
| RSS | `@astrojs/rss` at `/writing/rss.xml` | Standard for a writing section |

## File layout

```
flumenlabs/
├── .nvmrc                    # 22
├── astro.config.mjs
├── biome.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── README.md                 # dev/build commands, structure overview
├── CLAUDE.md                 # guidance for future Claude sessions
├── public/
│   ├── favicon.svg           # single source of truth for the brand mark
│   └── robots.txt
├── src/
│   ├── assets/
│   │   └── brand-mark.svg    # imported by header/footer components
│   ├── components/
│   │   ├── BrandMark.astro       # river-wave SVG used in header + footer
│   │   ├── Waves.astro            # three drifting wave bands
│   │   ├── ProjectCard.astro      # one card; takes a projects collection entry
│   │   └── Eyebrow.astro          # the all-caps eyebrow style
│   ├── content/
│   │   ├── config.ts              # Zod schemas for both collections
│   │   ├── projects/
│   │   │   ├── josefine.yaml
│   │   │   ├── solace.yaml
│   │   │   └── accessibility.yaml
│   │   └── writing/
│   │       └── (markdown posts — none on day one)
│   ├── layouts/
│   │   └── Base.astro             # <head>, skip link, header, footer, global styles, ClientRouter
│   ├── pages/
│   │   ├── index.astro            # apex landing (ported from current index.html)
│   │   ├── about.astro            # stub
│   │   ├── manifesto.astro        # stub
│   │   ├── privacy.astro          # stub
│   │   └── writing/
│   │       ├── index.astro        # writing index from collection
│   │       ├── [...slug].astro    # per-post template
│   │       └── rss.xml.ts         # RSS feed
│   ├── styles/
│   │   ├── tokens.css             # :root custom properties (palette, shadow, line, etc.)
│   │   └── globals.css            # reset, body bg/grain, .wrap, .skip, reveal anim, reduced-motion override
│   └── env.d.ts
```

## Components

- **`BrandMark`** — small circle-and-wave SVG. Props: `size?: number` (default 34). Renders inline SVG with `aria-hidden="true"`. The favicon (`public/favicon.svg`) and this component both render the same SVG path data — sourced from `src/assets/brand-mark.svg` so a change happens in one place.
- **`Waves`** — three drifting wave bands rendered between hero and projects on the landing. Pure decoration, no props.
- **`ProjectCard`** — renders one entry from the `projects` collection. Props: `entry: CollectionEntry<'projects'>`. Status pill (`live` | `in_development` | `coming_soon`) derived from `entry.data.status`. Description, host, and href flow from data.
- **`Eyebrow`** — the all-caps `.eyebrow` style as a small wrapping component. Renders a `<p>` with the eyebrow class. Slot for content.

## Content schemas (`src/content/config.ts`)

Uses Astro 5's Content Layer API (`glob` loader) — one file per entry, schemas validated with Zod.

```ts
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    href: z.string().url(),
    description: z.string(),
    status: z.enum(['live', 'in_development', 'coming_soon']),
    order: z.number(), // sort order in the grid
  }),
})

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { projects, writing }
```

## Style migration

The existing `<style>` block in `index.html` decomposes:

- `:root` tokens → `src/styles/tokens.css`
- universal reset + `body` bg + grain overlay + `prefers-reduced-motion` override + `[data-reveal]` reveal → `src/styles/globals.css` (imported once in `Base.astro`)
- `.wrap`, `.skip`, header, footer, `.sec-head` → `globals.css`
- `.hero`, `h1 em::after` underline, `.lede` → component-scoped `<style>` in `index.astro`
- `.waves` → component-scoped in `Waves.astro`
- `.card`, `.pill` → component-scoped in `ProjectCard.astro`

The reveal-on-load script (the `requestAnimationFrame` chain that sets `.ready` on `<body>`) goes into `Base.astro` as an inline `<script is:inline>` so it ships unmodified and runs immediately.

## Accessibility commitments preserved

- Skip link (`.skip`) in `Base.astro`
- `prefers-reduced-motion` blanket override in `globals.css`
- All decorative SVGs keep `aria-hidden="true"`
- Focus-visible states on cards preserved
- One `<h1>` per page; `<header>`, `<main>`, `<footer>` retained
- View transitions honor reduced-motion automatically (Astro behavior)

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Visual drift from the current site | Acceptance criterion: side-by-side eye-test before merging. The original `index.html` stays in git history (one `git show HEAD~1:index.html` away) for direct comparison. |
| Brand mark duplicated (favicon, header, footer) drifts | Single canonical SVG at `src/assets/brand-mark.svg`. `BrandMark.astro` imports it via Astro's `?raw` import. The favicon is the same file copied verbatim to `public/favicon.svg` with a top-of-file comment noting they must stay in sync (no build script — overkill for one file). |
| Astro framework lock-in | Components are mostly plain HTML+CSS in `.astro` files; migration away (to 11ty, plain HTML, etc.) would be tedious but not catastrophic. |
| node_modules / lockfile churn now lands in the repo | Pin Node 22 LTS via `.nvmrc`; commit lockfile; Biome replaces a Prettier+ESLint pair so net dev-dep count stays small. |

## Acceptance criteria

1. `pnpm install && pnpm dev` opens the site at `localhost:4321` with hot reload.
2. `pnpm build` produces `dist/` containing `index.html`, `about/index.html`, `manifesto/index.html`, `privacy/index.html`, `writing/index.html`, `writing/rss.xml`, `sitemap-index.xml`.
3. The built `dist/index.html` renders **visually identical** to the prior `index.html` (eye-test): palette, fonts, waves, hover states, reveal animation, reduced-motion behavior.
4. The three project cards on the landing are rendered from `src/content/projects/*.yaml` entries.
5. `pnpm lint` and `pnpm format` pass with Biome.
6. `pnpm typecheck` (Astro's `astro check`) passes.
7. Skip link, brand mark, focus-visible states, and `prefers-reduced-motion` behavior verified preserved.
8. `README.md` documents `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm format` / `pnpm typecheck`.
9. `CLAUDE.md` documents the new structure for future Claude sessions.
10. The old monolithic `index.html` is removed (its history is preserved by git).
