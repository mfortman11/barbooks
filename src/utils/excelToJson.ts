/**
 * sync-page-config.ts
 *
 * Reads page_config.xlsx and regenerates src/utils/pageConfig.ts.
 *
 * Usage:
 *   npx ts-node sync-page-config.ts
 *   npx ts-node sync-page-config.ts --excel path/to/page_config.xlsx
 *   npx ts-node sync-page-config.ts --out src/utils/pageConfig.ts
 *
 * Dependencies:
 *   npm install xlsx       (SheetJS — reads .xlsx files)
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag: string, fallback: string) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const EXCEL_PATH = getArg('--excel', 'page_config.xlsx');
const OUT_PATH   = getArg('--out',   path.join('src', 'utils', 'pageConfig.ts'));

// ── Types mirroring the existing PageConfiguration union ─────────────────────
interface ActionContent {
  content:  string;
  position: 'left' | 'right';
  rotation: number;
  icon:     string;
}

interface ListPage {
  type:          'list';
  title:         string;
  description:   string;
  items:         { clue: string | number }[];
  columns:       number;
  answerKeyUrl:  string;
  actionContent?: ActionContent;
}

interface MatchupItem {
  centerText: string;
  context:    string;
}

interface MatchupPage {
  type:          'matchup';
  title:         string;
  description:   string;
  items:         MatchupItem[];
  columns:       number;
  answerKeyUrl:  string;
  actionContent?: ActionContent;
}

interface TextPage {
  type:          'text';
  content:       string;
  answerKeyUrl:  string;
}

type PageConfig = ListPage | MatchupPage | TextPage;

// ── Read workbook ─────────────────────────────────────────────────────────────
if (!fs.existsSync(EXCEL_PATH)) {
  console.error(`❌  Could not find Excel file at: ${EXCEL_PATH}`);
  console.error(`    Run with --excel <path> to specify a different location.`);
  process.exit(1);
}

const workbook = XLSX.readFile(EXCEL_PATH);

// ── Parse "Pages" sheet ───────────────────────────────────────────────────────
// Columns (1-based, matching the spreadsheet):
//  A=pageNum  B=type  C=title  D=description  E=itemsNote
//  F=columns  G=answerKeyUrl  H=actionNote  I=notePosition
//  J=noteRotation  K=noteIcon
const pagesSheet = workbook.Sheets['Pages'];
if (!pagesSheet) {
  console.error('❌  Could not find a sheet named "Pages" in the workbook.');
  process.exit(1);
}

// Skip rows 1-4 (banner, subtitle, spacer, header)
const pagesRaw: any[] = XLSX.utils.sheet_to_json(pagesSheet, {
  header: ['pageNum', 'type', 'title', 'description', 'itemsNote',
           'columns', 'answerKeyUrl', 'actionNote', 'notePosition',
           'noteRotation', 'noteIcon'],
  range: 4,   // 0-based → skips rows 1-4 (banner/subtitle/spacer/header)
  defval: '',
});

// ── Parse "Matchup Items" sheet ───────────────────────────────────────────────
// Columns: A=pageNum  B=context  C=centerText  D=notes
const matchupSheet = workbook.Sheets['Matchup Items'];
if (!matchupSheet) {
  console.error('❌  Could not find a sheet named "Matchup Items" in the workbook.');
  process.exit(1);
}

const matchupRaw: any[] = XLSX.utils.sheet_to_json(matchupSheet, {
  header: ['pageNum', 'context', 'centerText', 'notes'],
  range: 4,
  defval: '',
});

// Group matchup rows by page number for easy lookup
const matchupsByPage = new Map<number, MatchupItem[]>();
for (const row of matchupRaw) {
  const pageNum = Number(row.pageNum);
  if (!pageNum) continue;
  if (!matchupsByPage.has(pageNum)) matchupsByPage.set(pageNum, []);
  matchupsByPage.get(pageNum)!.push({
    centerText: String(row.centerText).trim(),
    context:    String(row.context).trim(),
  });
}

// ── Helper: parse the "itemsNote" column into an items array ──────────────────
// Supported patterns (case-insensitive):
//   "25 items – clues are years descending from 2024"
//   "10 items – clues are years descending from 2024"
//   "20 items – clues are rank numbers (#1, #2 …)"
//   "10 items – clues are rank numbers"
//   "5 items – clues are <anything else>"   → clue = ""
function parseItemsNote(note: string): { clue: string | number }[] {
  const countMatch = note.match(/^(\d+)\s+items/i);
  if (!countMatch) {
    console.warn(`  ⚠️  Could not parse item count from: "${note}" — defaulting to 10 items with empty clues.`);
    return Array.from({ length: 10 }, () => ({ clue: '' }));
  }
  const count = parseInt(countMatch[1], 10);

  // Years pattern — "years descending from YYYY"
  const yearMatch = note.match(/years\s+descending\s+from\s+(\d{4})/i);
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1], 10);
    return Array.from({ length: count }, (_, i) => ({ clue: startYear - i }));
  }

  // Rank numbers pattern — "#1, #2 …" or "rank numbers"
  if (/rank\s+numbers?/i.test(note)) {
    return Array.from({ length: count }, (_, i) => ({ clue: `#${i + 1}` }));
  }

  // Fallback — items with empty clues
  console.warn(`  ⚠️  Unrecognised clue style in: "${note}" — items will have empty clues.`);
  return Array.from({ length: count }, () => ({ clue: '' }));
}

// ── Build page configuration array ───────────────────────────────────────────
const pages: PageConfig[] = [];
let warnings = 0;

for (const row of pagesRaw) {
  const pageNum = Number(row.pageNum);
  if (!pageNum) continue; // skip empty rows

  const type    = String(row.type).trim().toLowerCase();
  const title   = String(row.title).trim();
  const desc    = String(row.description).trim();
  const columns = Number(row.columns) || 1;
  const url     = String(row.answerKeyUrl).trim();

  // actionContent — only include if there's actual note text
  let actionContent: ActionContent | undefined;
  const noteText = String(row.actionNote).trim();
  if (noteText) {
    const rotation = Number(row.noteRotation);
    actionContent = {
      content:  noteText,
      position: String(row.notePosition).trim().toLowerCase() === 'left' ? 'left' : 'right',
      rotation: isNaN(rotation) ? 0 : rotation,
      icon:     String(row.noteIcon).trim() || '📌',
    };
  }

  if (type === 'list') {
    const itemsNote = String(row.itemsNote).trim();
    pages.push({
      type:         'list',
      title,
      description:  desc,
      items:        parseItemsNote(itemsNote),
      columns,
      answerKeyUrl: url,
      ...(actionContent ? { actionContent } : {}),
    });

  } else if (type === 'matchup') {
    const items = matchupsByPage.get(pageNum) ?? [];
    if (items.length === 0) {
      console.warn(`  ⚠️  Page ${pageNum} ("${title}") is type=matchup but has no rows in Matchup Items sheet.`);
      warnings++;
    }
    pages.push({
      type:         'matchup',
      title,
      description:  desc,
      items,
      columns,
      answerKeyUrl: url,
      ...(actionContent ? { actionContent } : {}),
    });

  } else if (type === 'text') {
    pages.push({
      type:         'text',
      content:      desc,   // for text pages the description IS the content
      answerKeyUrl: url,
    });

  } else {
    console.warn(`  ⚠️  Page ${pageNum} ("${title}") has unknown type "${type}" — skipping.`);
    warnings++;
  }
}

// ── Code-generation helpers ───────────────────────────────────────────────────
function indent(str: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(l => pad + l).join('\n');
}

function serializeActionContent(ac: ActionContent): string {
  return [
    `{`,
    `  content: ${JSON.stringify(ac.content)},`,
    `  position: '${ac.position}',`,
    `  rotation: ${ac.rotation},`,
    `  icon: '${ac.icon}'`,
    `}`,
  ].join('\n');
}

function serializeListItems(items: { clue: string | number }[]): string {
  // Use Array.from shorthand when clues are sequential years or sequential ranks
  const clues = items.map(i => i.clue);
  const count = clues.length;

  const firstClue = clues[0];

  // All numeric, descending by 1 → year range shorthand
  if (typeof firstClue === 'number') {
    const isDescendingYears = clues.every(
      (c, i) => typeof c === 'number' && c === (firstClue as number) - i
    );
    if (isDescendingYears) {
      return `Array.from({length: ${count}}, (_, i) => ({\n  clue: ${firstClue} - i,\n}))`;
    }
  }

  // All strings matching "#N" pattern → rank shorthand
  if (typeof firstClue === 'string' && firstClue === '#1') {
    const isRanks = clues.every((c, i) => c === `#${i + 1}`);
    if (isRanks) {
      return `Array.from({length: ${count}}, (_, i) => ({\n  clue: \`#\${i + 1}\`,\n}))`;
    }
  }

  // Fallback — inline array
  const lines = items.map(it => `  { clue: ${JSON.stringify(it.clue)} },`);
  return `[\n${lines.join('\n')}\n]`;
}

function serializeMatchupItems(items: MatchupItem[]): string {
  const lines = items.map(it =>
    `  { centerText: ${JSON.stringify(it.centerText)}, context: ${JSON.stringify(it.context)} },`
  );
  return `[\n${lines.join('\n')}\n]`;
}

function serializePage(page: PageConfig): string {
  const lines: string[] = ['{'];

  if (page.type === 'text') {
    lines.push(`  type: 'text',`);
    lines.push(`  content: ${JSON.stringify(page.content)},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)}`);
  } else {
    lines.push(`  type: '${page.type}',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  description: ${JSON.stringify(page.description)},`);

    if (page.type === 'list') {
      const itemsStr = serializeListItems(page.items);
      lines.push(`  items: ${itemsStr.split('\n').join('\n  ')},`);
    } else {
      const itemsStr = serializeMatchupItems(page.items);
      lines.push(`  items: ${itemsStr.split('\n').join('\n  ')},`);
    }

    lines.push(`  columns: ${page.columns},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);

    if ('actionContent' in page && page.actionContent) {
      const acStr = serializeActionContent(page.actionContent);
      lines.push(`  actionContent: ${acStr.split('\n').join('\n  ')}`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

// ── Emit pageConfig.ts ────────────────────────────────────────────────────────
const pagesBlock = pages
  .map(p => indent(serializePage(p), 4))
  .join(',\n\n');

const output = `import type { PageConfig, PageConfiguration } from './pageTypes.js';

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-GENERATED by sync-page-config.ts
// Source: ${path.basename(EXCEL_PATH)}
// Generated: ${new Date().toISOString()}
//
// DO NOT EDIT BY HAND — edit page_config.xlsx and re-run the script instead.
// ─────────────────────────────────────────────────────────────────────────────

export const pageConfig: PageConfig = {
  totalPages: 100,

  pages: [
${pagesBlock}
  ],

  getPageConfiguration(pageNum: number): PageConfiguration {
    const pageIndex = pageNum - 1;
    if (pageIndex >= 0 && pageIndex < this.pages.length) {
      return this.pages[pageIndex];
    }
    return {
      type: 'text',
      content: \`This is page \${pageNum} of our book. The content for this page is dynamically generated. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\`,
      answerKeyUrl: \`https://example.com/page-\${pageNum}-answers\`
    };
  },

  getAnswerKeyUrl(pageNum: number): string {
    const pageConfiguration = this.getPageConfiguration(pageNum);
    return pageConfiguration.answerKeyUrl || \`https://example.com/page-\${pageNum}-answers\`;
  },

  pageExists(pageNum: number): boolean {
    return pageNum >= 1 && pageNum <= this.totalPages;
  }
};
`;

// ── Write output ──────────────────────────────────────────────────────────────
const outDir = path.dirname(OUT_PATH);
if (outDir && !fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(OUT_PATH, output, 'utf8');

console.log(`✅  Generated ${pages.length} pages → ${OUT_PATH}`);
if (warnings > 0) {
  console.warn(`⚠️   ${warnings} warning(s) above — review before committing.`);
}