# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

**BarBooks** (working brand name) is a multi-sport trivia book system (NFL, NBA) designed for print-on-demand distribution. The project lets people play collaborative trivia with friends — questions like "name the last 20 NFL MVPs" or "who is each team's all-time passing leader."

### How it works end-to-end

1. **Content is authored in Excel** (e.g., `NFL Barbook Trivia.xlsx`). Each row defines one page of the book.
2. **The spreadsheet is converted to TypeScript** via `npm run sync-pages`, generating `src/utils/pageConfig.ts`.
3. **An Astro site** provides a browsable, print-ready web view of every page, deployed to GitHub Pages.
4. **A PDF generation script** (headless browser, one PDF per page) visits each page URL and prints it, then stitches the PDFs into a single book-ready file.
5. **The final PDF** is submitted to a print-on-demand service for physical distribution.

### Answer keys

Question pages do **not** include printed answers. Each page has an `answerKeyUrl` that is rendered as a QR code in the print footer — readers scan it to check their answers.

### Page types

| Type | Description | Example |
|------|-------------|---------|
| `list` | Numbered fill-in-the-blank items with optional clues (year, rank, etc.) | "Name the last 25 Super Bowl MVPs" |
| `matchup` | Head-to-head comparisons with a center label | "Score: 49ers 38 vs Chiefs 35" |
| `text` | Plain paragraph content | Intro pages, rules, etc. |
| `custom` | Arbitrary HTML | Special layouts |

Additional page types (e.g., one-item-per-team, division breakdowns) are planned for future additions.

### Sports scope

NFL is the initial focus. Other sports (NBA, MLB, etc.) are planned as future volumes.

## Development Commands

- `npm run dev` - Start local development server at localhost:4321
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview the built site locally
- `npm run sync-pages` - Regenerate `src/utils/pageConfig.ts` from sport-specific Excel files
- `npm run astro` - Run Astro CLI commands directly

> **No test framework is configured.** There are no unit or integration tests. Verify changes by running `npm run build` and `npm run dev`.

## Project Architecture

This is an Astro-based book reader application designed for GitHub Pages deployment. The core concept is a configurable book with different page types that can be printed or viewed digitally.

### Directory Structure

```
barbooks/
├── .claude/agents/book-page-creator.md  # Claude sub-agent for page creation
├── .github/workflows/deploy.yml         # GitHub Actions CI/CD to GitHub Pages
├── public/favicon.svg
├── src/
│   ├── components/
│   │   ├── ActionContent.astro          # Decorative rotating badge
│   │   ├── List.astro                   # Quiz/list page renderer
│   │   ├── Matchup.astro                # Head-to-head comparison renderer
│   │   ├── SiteHeader.astro             # Top nav bar (hidden in print)
│   │   ├── SiteFooter.astro             # Bottom nav bar (hidden in print)
│   │   ├── PageHeader.astro             # In-page title/description header
│   │   └── PageFooter.astro             # Print-only footer with QR code
│   ├── layouts/Layout.astro             # Root HTML template
│   ├── pages/
│   │   ├── index.astro                  # Redirects to /barbooks/nfl/1/
│   │   ├── [book]/[page].astro          # Dynamic route: generates pages for all books
│   │   └── 404.astro                    # Not found page
│   ├── scripts/bookApp.ts               # Client-side navigation + QR codes
│   ├── styles/global.css                # Tailwind v4 import
│   └── utils/
│       ├── pageTypes.ts                 # TypeScript interfaces for page types
│       ├── pageConfig.ts                # Page content config (auto-generated)
│       └── excelToJson.ts               # Excel-to-TS code generator script
├── NFL Barbook Trivia.xlsx              # NFL source of truth
├── NBA Barbook Trivia.xlsx              # NBA source of truth
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

### Page Configuration System

**The primary way to manage page content is via the sport-specific Excel files (e.g. `NFL Barbook Trivia.xlsx`).** Do not manually edit `pageConfig.ts` — it is auto-generated and marked with a `DO NOT EDIT BY HAND` header.

Workflow for updating pages:
1. Edit the relevant Excel file (two sheets: **Pages** and **Matchup Items**)
2. Run `npm run sync-pages` to regenerate `src/utils/pageConfig.ts`
3. Verify with `npm run build`

The sync script (`src/utils/excelToJson.ts`) reads all configured Excel files in the `BOOKS` array and emits TypeScript.

#### Excel Sheet Schema

**Pages sheet** (columns A–K):
| Column | Field | Notes |
|--------|-------|-------|
| A | pageNum | 1-based page number |
| B | type | `list`, `matchup`, or `text` |
| C | title | Page heading |
| D | description | Subtitle or, for `text` pages, the full content |
| E | itemsNote | Item count/clue style (list pages only) |
| F | columns | Grid column count |
| G | answerKeyUrl | URL for the answer key QR code |
| H | actionNote | Optional badge content (HTML allowed) |
| I | notePosition | `left` or `right` |
| J | noteRotation | Degrees of badge rotation |
| K | noteIcon | Emoji icon for the badge |

`itemsNote` patterns recognised by the parser:
- `"25 items – clues are years descending from 2024"` → auto-generates year array
- `"20 items – clues are rank numbers"` → generates `#1`, `#2`, …
- Any other pattern → items with empty clues (warns at generation time)

**Matchup Items sheet** (columns A–D):
| Column | Field | Notes |
|--------|-------|-------|
| A | pageNum | Matches Pages sheet |
| B | context | Label above matchup (e.g., year, game name) |
| C | centerText | Center divider (e.g., `"vs"`, `"40-22"`) |
| D | notes | Ignored by the script |

### TypeScript Interfaces (`src/utils/pageTypes.ts`)

Four page configuration types are supported:

```typescript
// List page — numbered quiz items with fill-in-the-blank blanks
interface ListPageConfig {
  type: 'list';
  title: string;
  description?: string;
  items: ListItem[];        // each item has an optional clue (year/rank/string)
  columns?: number;
  showInstructions?: boolean;
  instructionText?: string;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

// Matchup page — head-to-head comparisons
interface MatchupPageConfig {
  type: 'matchup';
  title: string;
  description?: string;
  items: MatchupItem[];     // each item has centerText and optional context
  columns?: number;
  showInstructions?: boolean;  // true by default for matchups
  instructionText?: string;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

// Text page — simple paragraph content
interface TextPageConfig {
  type: 'text';
  content: string;          // the description column IS the content for text pages
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

// Custom page — arbitrary HTML content
interface CustomPageConfig {
  type: 'custom';
  content: string;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}
```

`ListItem.clue` accepts `string | number`. The legacy `year` and `label` fields still work but are deprecated — use `clue` instead.

`ActionContent` renders a decorative badge:
```typescript
interface ActionContent {
  content: string;            // HTML string shown inside the badge
  position?: 'left' | 'right';
  rotation?: number;          // degrees
  icon?: string;              // emoji
}
```

### Dynamic Routing

- `src/pages/[page].astro` pre-renders pages 1–100 at build time via `getStaticPaths()`
- Invalid page numbers redirect to page 1
- URL pattern: `/barbooks/{pageNum}/`
- `pageConfig.getPageConfiguration(n)` returns the configured page or a fallback `text` page for unconfigured numbers

### Component Details

| Component | Purpose |
|-----------|---------|
| `SiteHeader.astro` | Blue top nav with quick links, page number input, Print button. Hidden during print. |
| `SiteFooter.astro` | Gray bottom nav with prev/next buttons and current page display. Hidden during print. |
| `PageHeader.astro` | Centered title + description; renders `ActionContent` badge if provided. |
| `PageFooter.astro` | Fixed-position footer visible only when printing. Contains QR code + "Scan for Answer Key". |
| `List.astro` | Renders quiz items as `{clue} : _____` in a configurable grid. |
| `Matchup.astro` | Renders matchup items as `_____ {centerText} _____` cards with optional context label. |
| `ActionContent.astro` | Absolutely-positioned orange badge with icon and rotated content. |
| `Layout.astro` | Root HTML template; passes `bookAppConfig` to the `window` object for `bookApp.ts`. |

### Client-Side Script (`src/scripts/bookApp.ts`)

`BookApp` class handles all browser-side interactivity:
- Parses current page from the URL pathname
- Wires up the page-number input, Go button, and keyboard (Enter key)
- Wires up Prev/Next buttons with boundary enforcement
- Generates QR codes using `qrcode-generator` for both the print footer and the on-screen footer
  - Print footer: 40×40 px (typeNumber 2, scale factor 2)
  - On-screen footer: 32×32 px (typeNumber 4, scale factor 4)
- Falls back to a red error box with a plain link if QR generation fails

### Styling

- Tailwind CSS v4 configured via the `@tailwindcss/vite` Vite plugin (no `tailwind.config.js`)
- Global styles live solely in `src/styles/global.css` (`@import "tailwindcss";`)
- Print-specific styles use Tailwind's `print:` modifier (e.g., `print:hidden`, `print:text-black`)
- Print layout uses fixed page dimensions set via `print:p-10 print:px-32 print:pb-16`

### Deployment

The app deploys automatically to GitHub Pages on every push to `main`.

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Checkout → Setup Node 18 → `npm install`
2. Configure GitHub Pages base URL
3. `npm run build` → Upload `dist/` artifact → Deploy to Pages

GitHub Pages configuration (in `astro.config.mjs`):
- `site: 'https://mfortman11.github.io'`
- `base: '/barbooks'`
- `output: 'static'`
- `assetsInlineLimit: 0` (required for GitHub Pages asset resolution)

All internal links must account for the `/barbooks` base path. Astro handles this automatically when using its built-in routing and asset helpers.

## Key Conventions

1. **Never hand-edit `pageConfig.ts`** — always use the Excel workflow and `npm run sync-pages`.
2. **Page numbers are 1-based** and map to array index `pageNum - 1` in `pageConfig.pages`.
3. **`text` page content** comes from the `description` column in the spreadsheet, not a separate `content` column.
4. **Matchup items** must exist in the "Matchup Items" sheet; an empty items array will produce a warning during sync.
5. **`clue` is preferred over `year`/`label`** in `ListItem` — the legacy fields still render but are deprecated.
6. **Adding new page types** requires changes to `pageTypes.ts`, a new Astro component, `[page].astro`, and the sync script.

## Sub-Agent

A dedicated Claude sub-agent is available at `.claude/agents/book-page-creator.md`. Use it when you need to add new pages — it understands the page type selection logic and `pageConfig.ts` conventions.
