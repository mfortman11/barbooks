import type { RedirectEntry } from './redirects.js';

export function logScan(
  analytics: AnalyticsEngineDataset,
  questionId: string,
  entry: RedirectEntry,
  request: Request
): void {
  const cf = (request as any).cf ?? {};
  const ua = request.headers.get('User-Agent') ?? '';
  const platform = parsePlatform(ua);

  try {
    analytics.writeDataPoint({
      blobs: [
        questionId,
        entry.label,
        entry.category,
        cf.country ?? 'unknown',
        cf.city ?? 'unknown',
        platform,
      ],
      doubles: [Date.now()],
      indexes: [questionId],
    });
  } catch (err) {
    console.error('Analytics write failed:', err);
    // Never throw — analytics must not block redirects
  }
}

function parsePlatform(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}
