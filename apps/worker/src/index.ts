import { getRedirect } from './redirects.js';
import { logScan } from './analytics.js';
import { handleAdmin } from './admin.js';
import { renderDashboard } from './dashboard.js';

export interface Env {
  REDIRECTS: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  ADMIN_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    // Dashboard
    if (path === '/dashboard') {
      return renderDashboard();
    }

    // Admin endpoints
    if (path.startsWith('/admin/')) {
      return handleAdmin(request, env.REDIRECTS, env.ADMIN_TOKEN);
    }

    // Redirect by question number
    const slugMatch = path.match(/^\/(\d+)$/);
    if (slugMatch) {
      const id = slugMatch[1];

      let entry;
      try {
        entry = await getRedirect(env.REDIRECTS, id);
      } catch (err) {
        console.error('KV lookup failed:', err);
        return new Response('Service temporarily unavailable', { status: 503 });
      }

      if (!entry || !entry.url) {
        return notFoundResponse(id);
      }

      // Log non-blocking — fire and forget
      logScan(env.ANALYTICS, id, entry, request);

      return Response.redirect(entry.url, 301);
    }

    return new Response('Not found', { status: 404 });
  },
};

function notFoundResponse(id: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Not Found</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 4rem auto; text-align: center; color: #111; }
    h1 { font-size: 1.5rem; }
    p { color: #6b7280; }
  </style>
</head>
<body>
  <h1>Question #${id} not found</h1>
  <p>This question may have moved or this code is from an older edition.</p>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
