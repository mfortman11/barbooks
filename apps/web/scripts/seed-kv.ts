/**
 * seed-kv.ts
 *
 * Reads sport-specific Excel files and generates a JSON file
 * for bulk-uploading redirect entries to Cloudflare KV.
 *
 * Usage:
 *   npx tsx scripts/seed-kv.ts
 *   npx wrangler kv bulk put --namespace-id <id> kv-seed.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOKS = [
  { id: 'nfl', file: 'NFL Barbook Trivia.xlsx' },
  { id: 'nba', file: 'NBA Barbook Trivia.xlsx' },
];

interface KVEntry {
  key: string;
  value: string;
}

const entries: KVEntry[] = [];

for (const book of BOOKS) {
  const excelPath = path.resolve(__dirname, '..', book.file);
  if (!fs.existsSync(excelPath)) {
    console.warn(`⚠️  Skipping ${book.id}: ${excelPath} not found`);
    continue;
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Pages'];
  if (!sheet) {
    console.warn(`⚠️  Skipping ${book.id}: no "Pages" sheet`);
    continue;
  }

  const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
    header: ['pageNum', 'type', 'title', 'description', 'category', 'difficulty',
             'itemsNote', 'columns', 'answerKeyUrl', 'actionNote', 'notePosition',
             'noteRotation', 'noteIcon'],
    range: 4,
    defval: '',
  });

  let count = 0;
  for (const row of rows) {
    const pageNum = Number(row.pageNum);
    if (!pageNum) continue;

    const url = String(row.answerKeyUrl).trim();
    if (!url) continue;

    const title = String(row.title).trim();
    const category = String(row.category).trim() || 'General';

    const key = `${book.id}:${pageNum}`;
    entries.push({
      key,
      value: JSON.stringify({ url, label: title, category }),
    });
    count++;
  }

  console.log(`✅  ${book.id}: ${count} redirect entries`);
}

const outPath = path.resolve(__dirname, '..', '..', 'worker', 'kv-seed.json');
fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));
console.log(`\nWrote ${entries.length} entries to kv-seed.json`);
console.log(`\nNext: npx wrangler kv bulk put --namespace-id 8d9e8560388f4140a6819922931f5a48 kv-seed.json`);
