import { putRedirect, deleteRedirect } from './redirects.js';

export async function handleAdmin(
  request: Request,
  kv: KVNamespace,
  adminToken: string
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  // Expects /admin/redirect/:id
  const match = url.pathname.match(/^\/admin\/redirect\/([^/]+)$/);
  if (!match) {
    return new Response('Not found', { status: 404 });
  }

  const id = match[1];

  if (request.method === 'PUT') {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { url: destUrl, label, category } = body as Record<string, string>;
    if (!destUrl || !label || !category) {
      return new Response('Missing required fields: url, label, category', { status: 400 });
    }

    await putRedirect(kv, id, { url: destUrl, label, category });
    return new Response(JSON.stringify({ id, url: destUrl, label, category }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'DELETE') {
    await deleteRedirect(kv, id);
    return new Response(null, { status: 204 });
  }

  return new Response('Method not allowed', { status: 405 });
}
