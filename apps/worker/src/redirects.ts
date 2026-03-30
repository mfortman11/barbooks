export interface RedirectEntry {
  url: string;
  label: string;
  category: string;
}

export async function getRedirect(
  kv: KVNamespace,
  id: string
): Promise<RedirectEntry | null> {
  const value = await kv.get(id, 'json');
  if (!value) return null;
  return value as RedirectEntry;
}

export async function putRedirect(
  kv: KVNamespace,
  id: string,
  entry: RedirectEntry
): Promise<void> {
  await kv.put(id, JSON.stringify(entry));
}

export async function deleteRedirect(
  kv: KVNamespace,
  id: string
): Promise<void> {
  await kv.delete(id);
}
