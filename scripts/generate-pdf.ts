/**
 * generate-pdf.ts
 *
 * Generates a single print-ready PDF for each book by:
 *   1. Building the Astro site (unless --skip-build is passed)
 *   2. Starting a local preview server
 *   3. Using Playwright to print each configured page to PDF
 *   4. Stitching all page PDFs into one book PDF with pdf-lib
 *
 * Usage:
 *   npx tsx scripts/generate-pdf.ts [--book nfl] [--skip-build] [--out output.pdf]
 */

import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { spawn, type ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { booksConfig } from '../src/utils/pageConfig.js';

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const bookFilter = args.includes('--book') ? args[args.indexOf('--book') + 1] : null;
const outFlagIdx = args.indexOf('--out');
const outFlag = outFlagIdx !== -1 ? args[outFlagIdx + 1] : null;

// Path to the pre-installed Playwright Chromium (avoids re-download)
const CHROMIUM_PATH = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';
const PREVIEW_PORT = 4322;
const BASE_URL = `http://localhost:${PREVIEW_PORT}/barbooks`;
const TMP_DIR = join(process.cwd(), '.pdf-tmp');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[generate-pdf] ${msg}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return; // server is up
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: false });
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
  });
}

function startPreviewServer(): ChildProcess {
  const child = spawn('npx', ['astro', 'preview', '--port', String(PREVIEW_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  // Pipe output without blocking
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
  return child;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Build
  if (!skipBuild) {
    log('Building Astro site…');
    await runCommand('npx', ['astro', 'build']);
  } else {
    log('Skipping build (--skip-build)');
  }

  // 2. Start preview server
  log(`Starting preview server on port ${PREVIEW_PORT}…`);
  const server = startPreviewServer();
  await waitForServer(`${BASE_URL}/nfl/1/`);
  log('Preview server ready.');

  // 3. Set up tmp dir
  mkdirSync(TMP_DIR, { recursive: true });

  // 4. Determine which books to process
  const bookIds = bookFilter ? [bookFilter] : Object.keys(booksConfig);

  // 5. Launch browser
  const executablePath = existsSync(CHROMIUM_PATH) ? CHROMIUM_PATH : undefined;
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

  try {
    for (const bookId of bookIds) {
      const bookConfig = booksConfig[bookId];
      if (!bookConfig) {
        log(`Unknown book "${bookId}", skipping.`);
        continue;
      }

      log(`\nGenerating PDF for book: ${bookId} (${bookConfig.totalPages} pages)`);

      const pagePdfs: Buffer[] = [];

      for (let pageNum = 1; pageNum <= bookConfig.totalPages; pageNum++) {
        if (!bookConfig.pageExists(pageNum)) {
          log(`  Page ${pageNum}: no content, skipping.`);
          continue;
        }

        const url = `${BASE_URL}/${bookId}/${pageNum}/`;
        log(`  Page ${pageNum}: ${url}`);

        const page = await browser.newPage();
        try {
          await page.goto(url, { waitUntil: 'networkidle' });
          // Wait for QR codes to render
          await page.waitForTimeout(500);

          const pdfBytes = await page.pdf({
            width: '6in',
            height: '9in',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
          });

          pagePdfs.push(Buffer.from(pdfBytes));
        } finally {
          await page.close();
        }
      }

      // 6. Merge page PDFs into one book PDF
      log(`\nMerging ${pagePdfs.length} pages for "${bookId}"…`);
      const mergedDoc = await PDFDocument.create();

      for (const pdfBuf of pagePdfs) {
        const srcDoc = await PDFDocument.load(pdfBuf);
        const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(p => mergedDoc.addPage(p));
      }

      const mergedBytes = await mergedDoc.save();
      const outPath = outFlag ?? join(process.cwd(), `${bookId}-book.pdf`);
      writeFileSync(outPath, mergedBytes);
      log(`Saved: ${outPath}`);
    }
  } finally {
    await browser.close();
    server.kill();
    log('Done.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
