# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`flumenlabs/flumenlabs` is the apex landing for `flumenlabs.eu`. Sister repos under the same GitHub org host the subdomain projects (`josefine`, `solace`, `eu-accessibility`). Shared design tokens / cross-repo component distribution is a future concern, not yet solved here.

## Commands

`pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm typecheck` (astro check) · `pnpm lint` (biome) · `pnpm format` / `pnpm format:check`.

There is no separate test framework. The build pipeline is the test suite: `pnpm typecheck && pnpm build` is the canonical pre-merge check.

## Architecture

**Static site, zero JS by default.** Astro 6 with vanilla CSS — no Tailwind, no UI framework runtime on content pages. The only client-side JS is a tiny inline reveal-animation script in `src/layouts/Base.astro` that runs on initial load and on the `astro:page-load` event (so view transitions don't kill the fade-in).

**One layout, many pages.** `src/layouts/Base.astro` owns `<head>`, the skip link, the header brandbar, the footer, and view transitions (`<ClientRouter />`). Every page in `src/pages/` wraps its content in `<Base title="...">`.

**Content lives in collections.** `src/content.config.ts` (note: at `src/` root, not inside `src/content/`, per Astro 6) defines two collections with Zod schemas:
- `projects` (`*.yaml`, one file per project) drives the cards on the landing. Editing data adds/removes/reorders cards; never touch JSX/HTML.
- `writing` (`**/*.md`, one file per post) drives `/writing/` and `/writing/rss.xml`. The dynamic post template lives at `src/pages/writing/[...slug].astro`.

**Brand mark is a single source of truth.** `src/assets/brand-mark.svg` is the canonical file. `src/components/BrandMark.astro` imports it via `?raw` and inlines it. `public/favicon.svg` is a *manually synced* copy — the file has a top-of-file comment reminding editors to update both.

## Design system (in-repo, for now)

CSS custom properties in `src/styles/tokens.css` are the source of truth for the palette and shadow. **Some hex values are duplicated in inline SVG `stroke=` attributes** in the brand mark and the waves — a token-only edit will not change those. When changing brand colors, grep for the hex code as well as updating the token.

Fonts: Fraunces (serif, display, italic = emphasis) + Hanken Grotesk (body), loaded from Google Fonts in `Base.astro`.

## Accessibility commitments

These are load-bearing, not nice-to-haves:
- Skip link in `Base.astro` — every page has it.
- `prefers-reduced-motion` blanket override in `src/styles/globals.css` — kills all animation and the reveal. Any new motion MUST go through CSS transitions/animations so it inherits this.
- Decorative SVGs (`Waves`, `BrandMark`) have `aria-hidden="true"`.
- Focus-visible states on `.card` — preserve them when restyling cards.
- One `<h1>` per page.

## Future work (not in this repo yet)

- **Group B — Deploy/CI:** `pnpm build` produces a static `dist/`. How that gets to `flumenlabs.eu` (Cloudflare Pages, GitHub Pages, Netlify, etc.) is still TBD. PR-preview deploys are a likely follow-up.
- **Group C — Shared design system:** the tokens and components in this repo are the precedent for a future `@flumenlabs/ui` package shared with `josefine`, `solace`, and `eu-accessibility`. Keep components portable (no hard dependency on this repo's layout) so extraction stays easy.

## Specs and plans

Design specs live in `docs/superpowers/specs/`; implementation plans in `docs/superpowers/plans/`. The migration that produced this repo's current shape is documented in `2026-05-28-apex-tooling-design.md` and `2026-05-28-apex-astro-migration.md`.
