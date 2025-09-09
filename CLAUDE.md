# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start local development server at localhost:4321
- `npm run build` - Build production site to ./dist/
- `npm run preview` - Preview the built site locally

## Project Architecture

This is an Astro-based book reader application designed for GitHub Pages deployment. The core concept is a configurable book with different page types that can be printed or viewed digitally.

### Key Components

**Page Configuration System (`src/utils/`)**
- `pageConfig.ts` - Central configuration defining all book pages and their content
- `pageTypes.ts` - TypeScript interfaces for different page types (list, text, custom)
- Pages are dynamically generated based on configuration, with fallback content for undefined pages

**Dynamic Routing**
- `src/pages/[page].astro` - Dynamic route handler that generates static pages 1-100
- Uses Astro's `getStaticPaths` to pre-render all pages at build time
- Automatically redirects invalid page numbers to page 1

**Page Types**
- **List pages**: Interactive quiz/list formats with configurable columns and items
- **Text pages**: Simple text content pages
- **Custom pages**: Flexible content with HTML support
- **Matchup pages**: Two-column layout for team vs team, score-based games, or any head-to-head comparisons

**Interactive Features (`src/scripts/bookApp.ts`)**
- Client-side navigation between pages
- QR code generation for answer keys (uses `qrcode-generator` library)
- Print-optimized layout with footer QR codes
- Page input with validation

**Styling**
- Uses Tailwind CSS v4 (configured via Vite plugin in `astro.config.mjs`)
- Print-specific styles with `print:` modifiers
- Responsive design with mobile/desktop layouts

### Configuration Details

The application is configured for GitHub Pages deployment:
- Base URL: `/barbooks` 
- Site: `https://mfortman11.github.io`
- Static output mode for GitHub Pages compatibility
- Assets inlining disabled for proper GitHub Pages asset handling

### Component Structure

- `ActionContent.astro` - Decorative badges with rotating position and custom content
- `List.astro` - Renders quiz/list pages with numbered items and configurable layouts
- `Matchup.astro` - Renders matchup pages with left vs right layout and center text/scores
- `Layout.astro` - Main page template with navigation and footer
- `Header.astro`, `Footer.astro` - Navigation and QR code display components

To add new pages, modify the `pages` object in `src/utils/pageConfig.ts` following the existing patterns for different page types.

### Matchup Page Configuration

Matchup pages use the `MatchupItem` interface with:
- `centerText`: The middle text (e.g., "vs", "40-22", or other scores/dividers)
- `context`: Optional label above each matchup (e.g., year, game name)

Examples:
- NFC Championship games with "vs" and year context
- Super Bowl matchups with final scores and game context
- Any head-to-head comparison format