/**
 * excelToJson.ts
 *
 * Reads multiple .xlsx files and regenerates src/utils/pageConfig.ts
 *
 * Usage:
 *   npx tsx src/utils/excelToJson.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

const OUT_PATH = path.join('src', 'utils', 'pageConfig.ts');

const BOOKS = [
  { id: 'nfl', file: 'NFL Barbook Trivia.xlsx' },
  { id: 'nba', file: 'NBA Barbook Trivia.xlsx' }
];

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

interface TeamsPage {
  type:          'teams';
  title:         string;
  description:   string;
  answerKeyUrl:  string;
  actionContent?: ActionContent;
}

type PageConfig = ListPage | MatchupPage | TextPage | TeamsPage;

// ── Helper: parse the "itemsNote" column into an items array ──────────────────
function parseItemsNote(note: string): { clue: string | number }[] {
  const countMatch = note.match(/^(\d+)\s+items/i);
  if (!countMatch) {
    console.warn(`  ⚠️  Could not parse item count from: "${note}" — defaulting to 10 items with empty clues.`);
    return Array.from({ length: 10 }, () => ({ clue: '' }));
  }
  const count = parseInt(countMatch[1], 10);

  const yearMatch = note.match(/years\s+descending\s+from\s+(\d{4})/i);
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1], 10);
    return Array.from({ length: count }, (_, i) => ({ clue: startYear - i }));
  }

  if (/rank\s+numbers?/i.test(note)) {
    return Array.from({ length: count }, (_, i) => ({ clue: `#${i + 1}` }));
  }

  console.warn(`  ⚠️  Unrecognised clue style in: "${note}" — items will have empty clues.`);
  return Array.from({ length: count }, () => ({ clue: '' }));
}

function processBook(bookId: string, excelPath: string) {
  if (!fs.existsSync(excelPath)) {
    console.warn(`⚠️  Could not find Excel file at: ${excelPath}. Skipping.`);
    return null;
  }

  const workbook = XLSX.readFile(excelPath);

  const pagesSheet = workbook.Sheets['Pages'];
  if (!pagesSheet) {
    console.error(`❌  Could not find "Pages" in ${excelPath}.`);
    return null;
  }

  const pagesRaw: any[] = XLSX.utils.sheet_to_json(pagesSheet, {
    header: ['pageNum', 'type', 'title', 'description', 'itemsNote',
             'columns', 'answerKeyUrl', 'actionNote', 'notePosition',
             'noteRotation', 'noteIcon'],
    range: 4,
    defval: '',
  });

  const matchupSheet = workbook.Sheets['Matchup Items'];
  let matchupRaw: any[] = [];
  if (matchupSheet) {
    matchupRaw = XLSX.utils.sheet_to_json(matchupSheet, {
      header: ['pageNum', 'context', 'centerText', 'notes'],
      range: 4,
      defval: '',
    });
  } else {
    console.warn(`⚠️  Could not find "Matchup Items" in ${excelPath}.`);
  }

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

  const pages: PageConfig[] = [];
  let warnings = 0;

  for (const row of pagesRaw) {
    const pageNum = Number(row.pageNum);
    if (!pageNum) continue;

    const type    = String(row.type).trim().toLowerCase();
    const title   = String(row.title).trim();
    const desc    = String(row.description).trim();
    const columns = Number(row.columns) || 1;
    const url     = String(row.answerKeyUrl).trim();

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
        console.warn(`  ⚠️  [${bookId}] Page ${pageNum} is matchup but has no rows.`);
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
        content:      desc,
        answerKeyUrl: url,
      });
    } else if (type === 'teams') {
      pages.push({
        type:         'teams',
        title,
        description:  desc,
        answerKeyUrl: url,
        ...(actionContent ? { actionContent } : {}),
      });
    } else {
      console.warn(`  ⚠️  [${bookId}] Page ${pageNum} has unknown type "${type}".`);
      warnings++;
    }
  }

  return { pages, warnings };
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
    `}`
  ].join('\n');
}

function serializeListItems(items: { clue: string | number }[]): string {
  const clues = items.map(i => i.clue);
  const count = clues.length;
  if (count === 0) return '[]';

  const firstClue = clues[0];

  if (typeof firstClue === 'number') {
    const isDescendingYears = clues.every(
      (c, i) => typeof c === 'number' && c === (firstClue as number) - i
    );
    if (isDescendingYears) {
      return `Array.from({length: ${count}}, (_, i) => ({\n  clue: ${firstClue} - i,\n}))`;
    }
  }

  if (typeof firstClue === 'string' && firstClue === '#1') {
    const isRanks = clues.every((c, i) => c === `#${i + 1}`);
    if (isRanks) {
      return `Array.from({length: ${count}}, (_, i) => ({\n  clue: \`#\${i + 1}\`,\n}))`;
    }
  }

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
  } else if (page.type === 'teams') {
    lines.push(`  type: 'teams',`);
    lines.push(`  title: ${JSON.stringify(page.title)},`);
    lines.push(`  description: ${JSON.stringify(page.description)},`);
    lines.push(`  answerKeyUrl: ${JSON.stringify(page.answerKeyUrl)},`);
    if (page.actionContent) {
      const acStr = serializeActionContent(page.actionContent);
      lines.push(`  actionContent: ${acStr.split('\n').join('\n  ')}`);
    }
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

const bookConfigs: string[] = [];
let totalWarnings = 0;

for (const book of BOOKS) {
  const result = processBook(book.id, book.file);
  if (!result) continue;

  totalWarnings += result.warnings;
  const pagesBlock = result.pages.map(p => indent(serializePage(p), 4)).join(',\n\n');
  
  const bookStr = `
  '${book.id}': {
    totalPages: 100, // Fixed to 100 for now, could be result.pages.length based
    pages: [
${pagesBlock}
    ],
    getPageConfiguration(pageNum: number) {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0 && pageIndex < this.pages.length) {
        return this.pages[pageIndex];
      }
      return {
        type: 'text',
        content: \`This is page \${pageNum} of our \${'${book.id}'.toUpperCase()} book. The content for this page is dynamically generated.\`,
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
  }`;
  bookConfigs.push(bookStr);
  console.log(`✅  Generated ${result.pages.length} pages for [${book.id}]`);
}

const output = `import type { PageConfig, PageConfiguration } from './pageTypes.js';

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-GENERATED by excelToJson.ts
// Generated: ${new Date().toISOString()}
//
// DO NOT EDIT BY HAND
// ─────────────────────────────────────────────────────────────────────────────

export const booksConfig: Record<string, PageConfig> = {
${bookConfigs.join(',\n')}
};

// Aliasing for backward compatibility if ever needed directly (points to nfl by default)
export const pageConfig = booksConfig['nfl'];
`;

const outDir = path.dirname(OUT_PATH);
if (outDir && !fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(OUT_PATH, output, 'utf8');

if (totalWarnings > 0) {
  console.warn(`⚠️   ${totalWarnings} warning(s) above — review before committing.`);
}
