export function renderDashboard(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trivia Scan Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; background: #f9fafb; color: #111; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
    .subtitle { color: #6b7280; margin-bottom: 2rem; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card h2 { font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
    .stat { text-align: center; }
    .stat .value { font-size: 2rem; font-weight: 700; color: #2563eb; }
    .stat .label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
    .note { color: #6b7280; font-size: 0.875rem; padding: 1rem; text-align: center; }
  </style>
</head>
<body>
  <h1>Trivia Scan Dashboard</h1>
  <p class="subtitle">QR code scan analytics — powered by Cloudflare Analytics Engine</p>

  <div class="card">
    <h2>Overview</h2>
    <div class="stat-grid">
      <div class="stat">
        <div class="value" id="total-scans">—</div>
        <div class="label">Total Scans</div>
      </div>
      <div class="stat">
        <div class="value" id="scans-30d">—</div>
        <div class="label">Last 30 Days</div>
      </div>
      <div class="stat">
        <div class="value" id="unique-questions">—</div>
        <div class="label">Questions Scanned</div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>Top 10 Most Scanned</h2>
    <p class="note" id="top-list">Loading…</p>
  </div>

  <div class="card">
    <h2>Bottom 10 Least Scanned</h2>
    <p class="note" id="bottom-list">Loading…</p>
  </div>

  <div class="card">
    <h2>About This Dashboard</h2>
    <p class="note">
      Data is sourced from Cloudflare Analytics Engine. Full query support
      requires the Analytics Engine GraphQL API — connect it to populate the
      stats above. See the
      <a href="https://developers.cloudflare.com/analytics/analytics-engine/" target="_blank">
        Cloudflare docs
      </a> for setup.
    </p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
