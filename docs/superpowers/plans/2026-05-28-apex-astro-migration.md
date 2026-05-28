# Apex Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `flumenlabs/flumenlabs` from a single inline `index.html` to a multi-page Astro 5 site with TypeScript, content collections, and a writing section — while preserving the existing landing page visually and behaviourally.

**Architecture:** Astro 5 static-site generator with TypeScript strict, pnpm, and Biome. Vanilla CSS with custom properties (no Tailwind). Content Layer API (`glob` loader) drives both the project cards (YAML data) and the writing section (markdown). One shared `Base.astro` layout with skip link, brand mark, and view transitions. Zero JS on content pages except a tiny inline reveal-animation script.

**Tech Stack:** Astro 5, TypeScript, pnpm, Node 22 LTS, Biome, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/check`.

**Reference:** `docs/superpowers/specs/2026-05-28-apex-tooling-design.md`

**Verification primitives:** Each task verifies via `pnpm build` (must succeed), `pnpm typecheck` (`astro check` must pass), and where applicable a grep against `dist/` output HTML. There is no separate test framework — Astro's build pipeline + schema validation is the test suite.

**Branch:** Work on a feature branch (e.g. `astro-migration`). Do NOT work directly on `main`.

---

### Task 0: Feature branch

**Files:** none

- [ ] **Step 1: Confirm clean working tree**

Run: `git status`
Expected: `nothing to commit, working tree clean` (the spec was committed in `174b2b6`)

- [ ] **Step 2: Create and switch to feature branch**

Run: `git switch -c astro-migration`
Expected: `Switched to a new branch 'astro-migration'`

---

### Task 1: Initialize Astro project with TypeScript

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.nvmrc`
- Create: `src/env.d.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Pin Node version**

Create `.nvmrc`:
```
22
```

- [ ] **Step 2: Initialize package.json**

Run: `pnpm init`

Then replace the generated `package.json` with:
```json
{
  "name": "flumenlabs-apex",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "format:check": "biome format ."
  }
}
```

- [ ] **Step 3: Install Astro and TypeScript**

Run: `pnpm add astro && pnpm add -D typescript @astrojs/check`
Expected: Lockfile created, `astro`, `typescript`, `@astrojs/check` listed in package.json.

- [ ] **Step 4: Create astro.config.mjs**

Create `astro.config.mjs`:
```js
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://flumenlabs.eu',
  output: 'static',
  trailingSlash: 'ignore',
})
```

- [ ] **Step 5: Create tsconfig.json**

Create `tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 6: Create src/env.d.ts**

Create `src/env.d.ts`:
```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 7: Update .gitignore**

Replace contents of `.gitignore`:
```
.DS_Store
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
```

- [ ] **Step 8: Verify dev server boots**

Run: `pnpm dev`
Expected: `Local: http://localhost:4321/`
Press `q` to quit.

(Note: there are no pages yet, so the dev server will 404 — that is fine; we only need it to boot without crashing.)

- [ ] **Step 9: Commit**

```bash
git add .nvmrc .gitignore package.json pnpm-lock.yaml astro.config.mjs tsconfig.json src/env.d.ts
git commit -m "chore: initialize Astro 5 project with TypeScript strict"
```

---

### Task 2: Move legacy index.html aside

**Files:**
- Move: `index.html` → `legacy/index.html`

- [ ] **Step 1: Move the legacy file**

Run: `mkdir -p legacy && git mv index.html legacy/index.html`
Expected: `index.html` no longer at repo root; `legacy/index.html` exists and is staged.

(Rationale: keeping it on disk during the migration makes side-by-side diff easier. It will be deleted in the final cleanup task.)

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: move pre-migration index.html to legacy/ for reference"
```

---

### Task 3: Add Biome with lint/format scripts

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Install Biome**

Run: `pnpm add -D --save-exact @biomejs/biome`

- [ ] **Step 2: Scaffold default biome.json**

Run: `pnpm biome init`
Expected: A `biome.json` file appears with version-correct defaults.

- [ ] **Step 3: Customize biome.json**

Open the generated `biome.json` and ensure these settings (preserve any version-correct schema field name Biome scaffolded — only adjust the values shown). The exact field shape can vary across Biome versions; if your scaffolded file uses different keys (`files.include` vs `files.includes`, etc.), apply the same intent to those keys:

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "files": {
    "ignore": ["dist", "node_modules", ".astro", "pnpm-lock.yaml", "public", "legacy"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  }
}
```

(Biome does not natively format `.astro` files in 2026; we exclude none explicitly but the default scan skips `.astro` extensions. Astro files are hand-formatted.)

- [ ] **Step 4: Verify lint and format scripts run cleanly**

Run: `pnpm lint && pnpm format:check`
Expected: Both succeed without errors. (No source files to check yet beyond config.)

- [ ] **Step 5: Commit**

```bash
git add biome.json package.json pnpm-lock.yaml
git commit -m "chore: add Biome for lint and format"
```

---

### Task 4: Add sitemap and RSS integrations

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Install integrations**

Run: `pnpm add -D @astrojs/sitemap @astrojs/rss`

- [ ] **Step 2: Wire sitemap into astro.config.mjs**

Replace `astro.config.mjs`:
```js
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://flumenlabs.eu',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
})
```

(`@astrojs/rss` is a runtime helper used inside an endpoint file, not an integration — no wiring needed here.)

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs package.json pnpm-lock.yaml
git commit -m "chore: add @astrojs/sitemap and @astrojs/rss"
```

---

### Task 5: Style tokens and globals

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/globals.css`

- [ ] **Step 1: Create tokens file**

Create `src/styles/tokens.css`:
```css
:root {
  --paper:      #eef3f1;
  --paper-deep: #e3ece9;
  --ink:        #16312e;
  --ink-soft:   #3b5551;
  --teal:       #2f7e78;
  --aqua:       #6fb5ae;
  --mist:       #a9d6d0;
  --sand:       #d9b483;
  --card:       #f7faf8;
  --line:       #cdddd8;
  --shadow:     22px 30px 60px -28px rgba(16, 49, 46, .35);
}
```

- [ ] **Step 2: Create globals file**

Create `src/styles/globals.css`:
```css
@import './tokens.css';

* { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: "Hanken Grotesk", -apple-system, sans-serif;
  color: var(--ink);
  background: var(--paper);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  position: relative;
  min-height: 100vh;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(60% 50% at 15% 0%,  rgba(111,181,174,.30), transparent 70%),
    radial-gradient(55% 45% at 90% 10%, rgba(217,180,131,.18), transparent 70%),
    radial-gradient(70% 60% at 50% 100%, rgba(47,126,120,.16), transparent 70%),
    linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
}

body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: .035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.skip {
  position: absolute; left: -999px; top: 0;
  background: var(--ink); color: var(--paper);
  padding: .75rem 1.25rem; border-radius: 0 0 12px 0; z-index: 50;
}
.skip:focus { left: 0; }

.wrap { width: min(1080px, 90vw); margin-inline: auto; }

.sec-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
  margin-bottom: 2.2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}
.sec-head h2 {
  font-family: "Fraunces", serif;
  font-weight: 500;
  font-size: clamp(1.5rem, 3.4vw, 2.1rem);
  letter-spacing: -.02em;
}
.sec-head p { color: var(--ink-soft); font-size: .98rem; max-width: 34ch; }

footer {
  border-top: 1px solid var(--line);
  padding: 2.4rem 0 3rem;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 1rem;
  color: var(--ink-soft); font-size: .9rem;
}
footer .river { display: flex; align-items: center; gap: .55rem; font-weight: 500; color: var(--ink); }

[data-reveal] { opacity: 0; transform: translateY(18px); }
.ready [data-reveal] {
  opacity: 1; transform: none;
  transition: opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1);
  transition-delay: var(--d, 0s);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css src/styles/globals.css
git commit -m "feat(styles): port tokens and globals from legacy index"
```

---

### Task 6: Base layout, brand mark, favicon, robots

**Files:**
- Create: `src/assets/brand-mark.svg`
- Create: `src/components/BrandMark.astro`
- Create: `src/layouts/Base.astro`
- Create: `public/favicon.svg`
- Create: `public/robots.txt`

- [ ] **Step 1: Create the canonical brand-mark SVG**

Create `src/assets/brand-mark.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" aria-hidden="true">
  <circle cx="20" cy="20" r="19" stroke="#2f7e78" stroke-width="1.4" opacity=".5"/>
  <path d="M6 24 C 14 18, 18 30, 26 22 S 34 14, 34 14" stroke="#2f7e78" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M6 30 C 14 24, 18 36, 26 28 S 34 20, 34 20" stroke="#6fb5ae" stroke-width="2.2" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: Create BrandMark component**

Create `src/components/BrandMark.astro`:
```astro
---
import markRaw from '../assets/brand-mark.svg?raw'

interface Props {
  size?: number
}

const { size = 34 } = Astro.props

// Inject width/height into the inline SVG. The source uses viewBox, so we
// only need to add explicit sizing for layout.
const sized = markRaw
  .replace('<svg ', `<svg width="${size}" height="${size}" `)
---
<Fragment set:html={sized} />
```

- [ ] **Step 3: Create the favicon**

Create `public/favicon.svg` — a synced copy of the same path data. (Manual sync; the file has a top comment to remind future editors.)
```svg
<!-- Synced manually from src/assets/brand-mark.svg. Update both files together. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="9" fill="#eef3f1"/>
  <path d="M6 24 C 14 18, 18 30, 26 22 S 34 14, 34 14" stroke="#2f7e78" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M6 30 C 14 24, 18 36, 26 28 S 34 20, 34 20" stroke="#6fb5ae" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 4: Create robots.txt**

Create `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://flumenlabs.eu/sitemap-index.xml
```

- [ ] **Step 5: Create Base layout**

Create `src/layouts/Base.astro`:
```astro
---
import { ClientRouter } from 'astro:transitions'
import BrandMark from '../components/BrandMark.astro'
import '../styles/globals.css'

interface Props {
  title: string
  description?: string
}

const {
  title,
  description = 'Flumen Labs builds calm, trauma-informed, accessibility-first tools — designed to flow with you, never against you.',
} = Astro.props

const year = new Date().getFullYear()
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="theme-color" content="#eef3f1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={Astro.url.href} />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Hanken+Grotesk:wght@400;500;600&display=swap"
      rel="stylesheet"
    />

    <ClientRouter />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>

    <header class="wrap">
      <div class="brandbar" data-reveal>
        <BrandMark />
        <b>Flumen&nbsp;Labs</b>
      </div>
    </header>

    <main id="main" class="wrap">
      <slot />
    </main>

    <footer class="wrap">
      <span class="river">
        <BrandMark size={22} />
        Flumen Labs
      </span>
      <span>© {year} · Made gently in Europe</span>
    </footer>

    <script is:inline>
      const setReady = () => {
        document.body.classList.remove('ready')
        requestAnimationFrame(() =>
          requestAnimationFrame(() => document.body.classList.add('ready')),
        )
      }
      setReady()
      document.addEventListener('astro:page-load', setReady)
    </script>

    <style>
      .brandbar { display: flex; align-items: center; gap: .7rem; padding: 2rem 0 0; }
      .brandbar b {
        font-family: "Fraunces", serif;
        font-weight: 600;
        font-size: 1.25rem;
        letter-spacing: -.01em;
      }
    </style>
  </body>
</html>
```

- [ ] **Step 6: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step 7: Commit**

```bash
git add src/assets/brand-mark.svg src/components/BrandMark.astro src/layouts/Base.astro public/favicon.svg public/robots.txt
git commit -m "feat(layout): base layout, brand mark, favicon, robots"
```

---

### Task 7: Content collections (schemas + project data)

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/projects/josefine.yaml`
- Create: `src/content/projects/solace.yaml`
- Create: `src/content/projects/accessibility.yaml`

- [ ] **Step 1: Create the collection config**

Create `src/content/config.ts`:
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
    order: z.number().int().nonnegative(),
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

- [ ] **Step 2: Create the three project entries**

Create `src/content/projects/josefine.yaml`:
```yaml
name: Josefine
href: https://josefine.flumenlabs.eu
description: A gentle daily system for routines, health, and goals — built around CPTSD and ADHD. The system remembers so your brain doesn't have to. Nothing turns red; nothing scolds.
status: coming_soon
order: 1
```

Create `src/content/projects/solace.yaml`:
```yaml
name: Solace
href: https://solace.flumenlabs.eu
description: A trauma-informed mobile companion for mental health — grown from a 2024 Chalmers thesis into a real, working app you can carry with you.
status: in_development
order: 2
```

Create `src/content/projects/accessibility.yaml`:
```yaml
name: Accessibility
href: https://accessibility.flumenlabs.eu
description: Tooling that scans, scores, and helps fix the web's accessibility gaps — so more people can use the things we all rely on.
status: in_development
order: 3
```

- [ ] **Step 3: Verify schema accepts valid data**

Run: `pnpm typecheck && pnpm build`
Expected: Build succeeds. `dist/` may not contain anything visible yet (no pages), but Astro will sync the collections — look for a log line like `Synced data for projects collection`.

- [ ] **Step 4: Schema-failure test (temporarily break a YAML and confirm build fails)**

Edit `src/content/projects/josefine.yaml` and change `status: coming_soon` to `status: wrong`.

Run: `pnpm build`
Expected: Build FAILS with a Zod validation error pointing at `josefine` and the `status` field.

- [ ] **Step 5: Restore the YAML**

Revert `status: wrong` back to `status: coming_soon` in `src/content/projects/josefine.yaml`.

Run: `pnpm build`
Expected: Build succeeds again.

- [ ] **Step 6: Commit**

```bash
git add src/content/config.ts src/content/projects/
git commit -m "feat(content): projects collection with Zod-validated YAML entries"
```

---

### Task 8: Waves and Eyebrow components

**Files:**
- Create: `src/components/Waves.astro`
- Create: `src/components/Eyebrow.astro`

- [ ] **Step 1: Create Waves**

Create `src/components/Waves.astro`:
```astro
<div class="waves" aria-hidden="true">
  <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
    <path d="M0,40 C 360,80 720,10 1080,40 C 1260,55 1380,45 1500,38 L1500,90 L0,90 Z" fill="#a9d6d0" opacity=".35"/>
    <path d="M-60,55 C 300,20 660,75 1020,50 C 1200,38 1320,55 1500,48 L1500,90 L-60,90 Z" fill="#6fb5ae" opacity=".4"/>
    <path d="M0,68 C 360,48 720,80 1080,62 C 1260,53 1380,66 1500,60 L1500,90 L0,90 Z" fill="#2f7e78" opacity=".5"/>
  </svg>
</div>

<style>
  /* Self-breakout: spans the full viewport regardless of any .wrap ancestor. */
  .waves {
    position: relative;
    width: 100vw;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    height: 90px;
    margin-top: -1px;
    line-height: 0;
  }
  .waves svg { width: 100%; height: 100%; display: block; }
  .waves path { animation: drift 18s ease-in-out infinite alternate; }
  .waves path:nth-child(2) { animation-duration: 24s; animation-direction: alternate-reverse; }
  .waves path:nth-child(3) { animation-duration: 30s; }
  @keyframes drift {
    from { transform: translateX(-3%); }
    to   { transform: translateX(3%); }
  }
</style>
```

- [ ] **Step 2: Create Eyebrow**

Create `src/components/Eyebrow.astro`:
```astro
---
interface Props {
  reveal?: boolean
  delay?: string
}

const { reveal = false, delay } = Astro.props
---
<p
  class="eyebrow"
  data-reveal={reveal ? '' : undefined}
  style={delay ? `--d:${delay}` : undefined}
>
  <slot />
</p>

<style>
  .eyebrow {
    font-size: .82rem;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: var(--teal);
    font-weight: 600;
    margin-bottom: 1.4rem;
  }
</style>
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: `0 errors`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Waves.astro src/components/Eyebrow.astro
git commit -m "feat(components): Waves and Eyebrow"
```

---

### Task 9: ProjectCard component

**Files:**
- Create: `src/components/ProjectCard.astro`

- [ ] **Step 1: Create ProjectCard**

Create `src/components/ProjectCard.astro`:
```astro
---
import type { CollectionEntry } from 'astro:content'

interface Props {
  entry: CollectionEntry<'projects'>
  index: number
}

const { entry, index } = Astro.props
const { name, href, description, status } = entry.data

const PILL_LABEL = {
  live: 'Live',
  in_development: 'In development',
  coming_soon: 'Coming soon',
} as const

const PILL_CLASS = {
  live: 'live',
  in_development: 'soon',
  coming_soon: 'soon',
} as const

const hostLabel = new URL(href).host

const delay = `${(0.05 + index * 0.08).toFixed(2)}s`
---
<a class="card" href={href} data-reveal style={`--d:${delay}`}>
  <div class="top">
    <h3>{name}</h3>
    <span class={`pill ${PILL_CLASS[status]}`}>{PILL_LABEL[status]}</span>
  </div>
  <p class="desc">{description}</p>
  <span class="host">{hostLabel} →</span>
</a>

<style>
  .card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 22px;
    padding: 1.8rem 1.7rem 1.6rem;
    box-shadow: var(--shadow);
    display: flex; flex-direction: column; gap: .75rem;
    text-decoration: none; color: inherit;
    transition: transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s, border-color .45s;
    overflow: hidden;
  }
  .card::before {
    content: "";
    position: absolute; right: -40%; top: -60%;
    width: 90%; height: 130%;
    background: radial-gradient(closest-side, rgba(111,181,174,.28), transparent);
    transition: opacity .45s, transform .6s;
    opacity: .5;
  }
  .card:hover, .card:focus-visible {
    transform: translateY(-6px);
    box-shadow: 26px 38px 70px -30px rgba(16,49,46,.45);
    border-color: var(--aqua);
    outline: none;
  }
  .card:hover::before { opacity: .9; transform: translate(-6%, 4%); }

  .top { display: flex; align-items: center; justify-content: space-between; }
  h3 {
    font-family: "Fraunces", serif;
    font-weight: 500;
    font-size: 1.4rem;
    letter-spacing: -.015em;
  }
  .desc { color: var(--ink-soft); font-size: .98rem; }
  .host { margin-top: auto; font-size: .85rem; color: var(--teal); font-weight: 500; }

  .pill {
    font-size: .68rem; letter-spacing: .08em; text-transform: uppercase;
    font-weight: 600; padding: .3rem .6rem; border-radius: 999px;
    border: 1px solid currentColor; white-space: nowrap;
  }
  .pill.live { color: var(--teal); background: rgba(47,126,120,.08); }
  .pill.soon { color: #9a7838; background: rgba(217,180,131,.16); border-color: #d9b483; }
</style>
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectCard.astro
git commit -m "feat(components): ProjectCard reading from projects collection"
```

---

### Task 10: Home page

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create the home page**

Create `src/pages/index.astro`:
```astro
---
import { getCollection } from 'astro:content'
import Base from '../layouts/Base.astro'
import Eyebrow from '../components/Eyebrow.astro'
import Waves from '../components/Waves.astro'
import ProjectCard from '../components/ProjectCard.astro'

const projects = (await getCollection('projects')).sort(
  (a, b) => a.data.order - b.data.order,
)
---
<Base title="Flumen Labs — gentle software for difficult days">
  <section class="hero">
    <Eyebrow reveal delay=".05s">Calm tools, made with care</Eyebrow>
    <h1 data-reveal style="--d:.12s">Gentle software for <em>difficult</em> days.</h1>
    <p class="lede" data-reveal style="--d:.22s">
      Flumen Labs builds trauma-informed, accessibility-first tools — designed to
      flow <em>with</em> you, never against you. <em>Flumen</em> is Latin for river:
      like water, good software should find its way around the obstacles, not add to them.
    </p>
  </section>

  <Waves />

  <section id="projects">
    <div class="sec-head" data-reveal>
      <h2>What we're building</h2>
      <p>A small family of projects, each meeting people where they are.</p>
    </div>

    <div class="grid">
      {projects.map((entry, i) => <ProjectCard entry={entry} index={i} />)}
    </div>
  </section>
</Base>

<style>
  .hero {
    padding: clamp(4rem, 13vh, 9rem) 0 clamp(3rem, 9vh, 6rem);
  }
  h1 {
    font-family: "Fraunces", serif;
    font-weight: 400;
    font-size: clamp(2.7rem, 7.5vw, 5.4rem);
    line-height: 1.04;
    letter-spacing: -.025em;
    max-width: 16ch;
  }
  h1 em {
    font-style: italic;
    color: var(--teal);
    position: relative;
    white-space: nowrap;
  }
  h1 em::after {
    content: "";
    position: absolute;
    left: 0; right: 0; bottom: -.12em;
    height: .32em;
    background: no-repeat center/100% 100% url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 16' preserveAspectRatio='none'%3E%3Cpath d='M2 9 C 40 2, 70 14, 110 8 S 170 2, 198 9' fill='none' stroke='%236fb5ae' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E");
    opacity: .85;
  }
  .lede {
    margin-top: 1.8rem;
    font-size: clamp(1.08rem, 2.2vw, 1.4rem);
    color: var(--ink-soft);
    max-width: 46ch;
    line-height: 1.55;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.3rem;
    padding-bottom: clamp(4rem, 10vh, 7rem);
  }
</style>
```

(Note: `<Waves>` is inside `<main class="wrap">` but uses the self-breakout CSS pattern defined in Task 8 — `width: 100vw; left: 50%; margin-left: -50vw` — so it spans the viewport regardless of the `.wrap` ancestor's max-width.)

- [ ] **Step 2: Run the build and verify output**

Run: `pnpm build`
Expected: Build succeeds. `dist/index.html` exists.

Run: `grep -c "Josefine\|Solace\|Accessibility" dist/index.html`
Expected: `3` (one occurrence of each project name).

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: `0 errors`.

- [ ] **Step 4: Eye-test against legacy/index.html**

Run: `pnpm preview &` (note the PID; or run in a separate terminal)

Then in a browser, open:
- `http://localhost:4321/` (new build)
- `file:///` path to `legacy/index.html` in another tab

Compare:
- Palette and gradient mesh
- Header brandbar position and font
- Hero h1 with italic `difficult` and underline
- Lede paragraph
- Three drifting wave bands between hero and projects
- "What we're building" section heading
- Three project cards with correct labels and pill colors
- Hover state on cards (lift + corner wash)
- Footer

Stop the preview server (`kill <PID>` or Ctrl-C).

If anything is materially off, fix it and re-run from Step 2. Common fixes:
- Missing font: check the Google Fonts link in `Base.astro`.
- Wrong pill color: check `PILL_CLASS` mapping in `ProjectCard.astro`.
- Reveal not firing: confirm `body.ready` is set in DevTools after load.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(pages): home page with hero, waves, and data-driven project grid"
```

---

### Task 11: Stub pages (about, manifesto, privacy)

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/pages/manifesto.astro`
- Create: `src/pages/privacy.astro`

- [ ] **Step 1: Create about page**

Create `src/pages/about.astro`:
```astro
---
import Base from '../layouts/Base.astro'
import Eyebrow from '../components/Eyebrow.astro'
---
<Base title="About — Flumen Labs" description="About Flumen Labs.">
  <section class="page">
    <Eyebrow reveal>About</Eyebrow>
    <h1 data-reveal style="--d:.1s">About Flumen Labs</h1>
    <p class="lede" data-reveal style="--d:.2s">
      A page to be written.
    </p>
  </section>
</Base>

<style>
  .page { padding: clamp(3rem, 10vh, 6rem) 0; }
  h1 {
    font-family: "Fraunces", serif;
    font-weight: 400;
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    line-height: 1.1;
    letter-spacing: -.02em;
  }
  .lede {
    margin-top: 1.5rem;
    font-size: clamp(1.05rem, 1.8vw, 1.25rem);
    color: var(--ink-soft);
    max-width: 50ch;
  }
</style>
```

- [ ] **Step 2: Create manifesto page**

Create `src/pages/manifesto.astro`:
```astro
---
import Base from '../layouts/Base.astro'
import Eyebrow from '../components/Eyebrow.astro'
---
<Base title="Manifesto — Flumen Labs" description="Why we build like this.">
  <section class="page">
    <Eyebrow reveal>Manifesto</Eyebrow>
    <h1 data-reveal style="--d:.1s">Why we build like this</h1>
    <p class="lede" data-reveal style="--d:.2s">
      A page to be written.
    </p>
  </section>
</Base>

<style>
  .page { padding: clamp(3rem, 10vh, 6rem) 0; }
  h1 {
    font-family: "Fraunces", serif;
    font-weight: 400;
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    line-height: 1.1;
    letter-spacing: -.02em;
  }
  .lede {
    margin-top: 1.5rem;
    font-size: clamp(1.05rem, 1.8vw, 1.25rem);
    color: var(--ink-soft);
    max-width: 50ch;
  }
</style>
```

- [ ] **Step 3: Create privacy page**

Create `src/pages/privacy.astro`:
```astro
---
import Base from '../layouts/Base.astro'
import Eyebrow from '../components/Eyebrow.astro'
---
<Base title="Privacy — Flumen Labs" description="Privacy policy for Flumen Labs.">
  <section class="page">
    <Eyebrow reveal>Privacy</Eyebrow>
    <h1 data-reveal style="--d:.1s">Privacy</h1>
    <p class="lede" data-reveal style="--d:.2s">
      A page to be written.
    </p>
  </section>
</Base>

<style>
  .page { padding: clamp(3rem, 10vh, 6rem) 0; }
  h1 {
    font-family: "Fraunces", serif;
    font-weight: 400;
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    line-height: 1.1;
    letter-spacing: -.02em;
  }
  .lede {
    margin-top: 1.5rem;
    font-size: clamp(1.05rem, 1.8vw, 1.25rem);
    color: var(--ink-soft);
    max-width: 50ch;
  }
</style>
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds. `dist/about/index.html`, `dist/manifesto/index.html`, `dist/privacy/index.html` all exist.

Run: `ls dist/about dist/manifesto dist/privacy`
Expected: each directory contains `index.html`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/about.astro src/pages/manifesto.astro src/pages/privacy.astro
git commit -m "feat(pages): stub about, manifesto, privacy pages"
```

---

### Task 12: Writing section (index, dynamic post, RSS)

**Files:**
- Create: `src/pages/writing/index.astro`
- Create: `src/pages/writing/[...slug].astro`
- Create: `src/pages/writing/rss.xml.ts`
- Create: `src/content/writing/.gitkeep`

- [ ] **Step 1: Create writing index**

Create `src/pages/writing/index.astro`:
```astro
---
import { getCollection } from 'astro:content'
import Base from '../../layouts/Base.astro'
import Eyebrow from '../../components/Eyebrow.astro'

const posts = (await getCollection('writing', ({ data }) => !data.draft)).sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
)

const fmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' })
---
<Base title="Writing — Flumen Labs" description="Notes and essays from Flumen Labs.">
  <section class="page">
    <Eyebrow reveal>Writing</Eyebrow>
    <h1 data-reveal style="--d:.1s">Notes and essays</h1>
    {posts.length === 0 ? (
      <p class="lede" data-reveal style="--d:.2s">Nothing here yet.</p>
    ) : (
      <ul class="posts" data-reveal style="--d:.2s">
        {posts.map((post) => (
          <li>
            <a href={`/writing/${post.id}/`}>
              <span class="title">{post.data.title}</span>
              <time datetime={post.data.date.toISOString()}>{fmt.format(post.data.date)}</time>
            </a>
            {post.data.description && <p class="desc">{post.data.description}</p>}
          </li>
        ))}
      </ul>
    )}
  </section>
</Base>

<style>
  .page { padding: clamp(3rem, 10vh, 6rem) 0; }
  h1 {
    font-family: "Fraunces", serif;
    font-weight: 400;
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    line-height: 1.1;
    letter-spacing: -.02em;
    margin-bottom: 2rem;
  }
  .lede {
    font-size: clamp(1.05rem, 1.8vw, 1.25rem);
    color: var(--ink-soft);
    max-width: 50ch;
  }
  .posts { list-style: none; padding: 0; display: grid; gap: 1.6rem; }
  .posts a {
    display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
    text-decoration: none; color: var(--ink); font-size: 1.1rem;
  }
  .posts a:hover .title { color: var(--teal); }
  .posts .title { font-family: "Fraunces", serif; font-weight: 500; }
  .posts time { color: var(--ink-soft); font-size: .85rem; white-space: nowrap; }
  .posts .desc { margin-top: .4rem; color: var(--ink-soft); }
</style>
```

- [ ] **Step 2: Create dynamic post page**

Create `src/pages/writing/[...slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content'
import type { CollectionEntry } from 'astro:content'
import Base from '../../layouts/Base.astro'

export async function getStaticPaths() {
  const posts = await getCollection('writing', ({ data }) => !data.draft)
  return posts.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }))
}

interface Props {
  entry: CollectionEntry<'writing'>
}

const { entry } = Astro.props
const { Content } = await render(entry)

const fmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' })
---
<Base title={`${entry.data.title} — Flumen Labs`} description={entry.data.description}>
  <article class="post">
    <header data-reveal>
      <p class="meta"><time datetime={entry.data.date.toISOString()}>{fmt.format(entry.data.date)}</time></p>
      <h1>{entry.data.title}</h1>
    </header>
    <div class="prose" data-reveal style="--d:.1s">
      <Content />
    </div>
  </article>
</Base>

<style>
  .post { padding: clamp(3rem, 10vh, 6rem) 0; max-width: 65ch; }
  .meta { color: var(--ink-soft); font-size: .85rem; letter-spacing: .12em; text-transform: uppercase; margin-bottom: .8rem; }
  h1 {
    font-family: "Fraunces", serif;
    font-weight: 400;
    font-size: clamp(2rem, 4.5vw, 3.2rem);
    line-height: 1.1;
    letter-spacing: -.02em;
  }
  .prose { margin-top: 2.2rem; font-size: 1.08rem; }
  .prose :global(p) { margin-bottom: 1.2rem; }
  .prose :global(h2) { font-family: "Fraunces", serif; font-weight: 500; font-size: 1.6rem; margin: 2.4rem 0 .8rem; letter-spacing: -.015em; }
  .prose :global(a) { color: var(--teal); }
  .prose :global(code) { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .92em; background: var(--paper-deep); padding: .1em .35em; border-radius: 4px; }
</style>
```

- [ ] **Step 3: Create RSS endpoint**

Create `src/pages/writing/rss.xml.ts`:
```ts
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = await getCollection('writing', ({ data }) => !data.draft)
  posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())

  return rss({
    title: 'Flumen Labs — Writing',
    description: 'Notes and essays from Flumen Labs.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/writing/${post.id}/`,
    })),
  })
}
```

- [ ] **Step 4: Create the writing directory**

Run: `mkdir -p src/content/writing && touch src/content/writing/.gitkeep`

(Empty collections are valid; the index page handles `posts.length === 0`.)

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds. `dist/writing/index.html` and `dist/writing/rss.xml` both exist.

Run: `ls dist/writing`
Expected: `index.html` and `rss.xml` both listed. No per-post directory since the collection is empty.

- [ ] **Step 6: Verify typecheck**

Run: `pnpm typecheck`
Expected: `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/writing/ src/content/writing/.gitkeep
git commit -m "feat(writing): index, dynamic post route, and RSS endpoint"
```

---

### Task 13: README and CLAUDE.md

**Files:**
- Create: `README.md`
- Create: `CLAUDE.md`

- [ ] **Step 1: Create README.md**

Create `README.md`:
```markdown
# flumenlabs.eu

The apex landing for **Flumen Labs** — calm, trauma-informed, accessibility-first tools.

## Stack

Astro 5 · TypeScript (strict) · pnpm · Node 22 LTS · Biome · vanilla CSS with custom properties.

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
```

- [ ] **Step 2: Create CLAUDE.md**

Create `CLAUDE.md`:
```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`flumenlabs/flumenlabs` is the apex landing for `flumenlabs.eu`. Sister repos under the same GitHub org host the subdomain projects (`josefine`, `solace`, `eu-accessibility`). Shared design tokens / cross-repo component distribution is a future concern, not yet solved here.

## Commands

`pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm typecheck` (astro check) · `pnpm lint` (biome) · `pnpm format` / `pnpm format:check`.

There is no separate test framework. The build pipeline is the test suite: `pnpm typecheck && pnpm build` is the canonical pre-merge check.

## Architecture

**Static site, zero JS by default.** Astro 5 with vanilla CSS — no Tailwind, no UI framework runtime on content pages. The only client-side JS is a tiny inline reveal-animation script in `src/layouts/Base.astro` that runs on initial load and on the `astro:page-load` event (so view transitions don't kill the fade-in).

**One layout, many pages.** `src/layouts/Base.astro` owns `<head>`, the skip link, the header brandbar, the footer, and view transitions (`<ClientRouter />`). Every page in `src/pages/` wraps its content in `<Base title="...">`.

**Content lives in collections.** `src/content/config.ts` defines two collections with Zod schemas:
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
```

- [ ] **Step 3: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: README and CLAUDE.md for the post-migration repo"
```

---

### Task 14: Final cleanup and verification

**Files:**
- Delete: `legacy/index.html` (and the now-empty `legacy/` directory)

- [ ] **Step 1: Run the full check suite**

Run: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`
Expected: All four commands pass with no errors.

- [ ] **Step 2: Final eye-test against legacy**

Run: `pnpm preview &` (note the PID)

Open `http://localhost:4321/` and `file://<full path to>/legacy/index.html` side by side. Confirm visual parity for:

- Header brandbar
- Hero: eyebrow, h1 with italic underline, lede
- Wave bands between hero and projects
- "What we're building" section heading and divider
- Three project cards in correct order: Josefine (Coming soon), Solace (In development), Accessibility (In development)
- Card hover: lift + soft corner wash + teal border
- Footer

Click `/about`, `/manifesto`, `/privacy`, `/writing` from the URL bar — all four load. View transitions cross-fade between them.

Stop the preview server.

If anything is off, fix it and re-run from Step 1. Do not proceed if there are open visual issues.

- [ ] **Step 3: Delete the legacy directory**

Run: `git rm -r legacy && rmdir legacy 2>/dev/null || true`
Expected: `legacy/index.html` removed and staged.

- [ ] **Step 4: Verify build still succeeds after legacy removal**

Run: `pnpm build`
Expected: Build succeeds. `dist/index.html` exists and has the project cards.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: remove pre-migration index.html (preserved in git history)"
```

- [ ] **Step 6: Confirm git history is clean**

Run: `git log --oneline main..HEAD`
Expected: A linear history of small, focused commits from Task 1 through Task 14.

---

## Plan self-review

**Spec coverage check:**

| Spec acceptance criterion | Task |
|---|---|
| `pnpm install && pnpm dev` opens at :4321 | Task 1, Step 8 |
| `pnpm build` produces all pages | Task 14, Step 1 |
| Visual parity with legacy | Task 10 Step 4; Task 14 Step 2 |
| Cards from YAML | Task 7 + Task 9 + Task 10 |
| `pnpm lint && pnpm format` pass | Task 3 Step 4; Task 14 Step 1 |
| `pnpm typecheck` passes | Verified per-task |
| Skip link + a11y commitments | Task 6 Step 5 |
| README documents commands | Task 13 Step 1 |
| CLAUDE.md documents structure | Task 13 Step 2 |
| Old `index.html` removed | Task 14 Step 3 |

All ten acceptance criteria are covered.

**Placeholder scan:** No "TBD" / "implement later" / "add error handling" / "similar to Task N" remain. Each step contains the actual content to write.

**Type consistency check:**
- `ProjectCard.astro` declares `Props { entry: CollectionEntry<'projects'>; index: number }`. `index.astro` calls `<ProjectCard entry={entry} index={i} />`. ✓
- `Eyebrow.astro` declares `Props { reveal?: boolean; delay?: string }`. `index.astro` calls `<Eyebrow reveal delay=".05s">`. ✓
- `Base.astro` declares `Props { title: string; description?: string }`. All pages pass `title`. ✓
- `getStaticPaths` in `[...slug].astro` returns `{ params: { slug }, props: { entry } }`; the component declares `Props { entry: CollectionEntry<'writing'> }`. ✓

Plan is internally consistent and covers the spec.
