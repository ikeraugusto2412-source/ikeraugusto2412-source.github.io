/*
 * Reel comments, stored in a Supabase table (see supabase/comments.sql) and read / written
 * through its REST API with the public anon key. The table's rules only let visitors read
 * visible comments and add new ones.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const commentsEnabled = Boolean(URL_ && KEY);

const headers = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' });

export async function listComments(project) {
  const qs = new URLSearchParams({ select: 'id,name,body,created_at', project: `eq.${project}`, order: 'created_at.asc', limit: '200' });
  const r = await fetch(`${URL_}/rest/v1/comments?${qs}`, { headers: headers() });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

export async function addComment(project, name, body) {
  const r = await fetch(`${URL_}/rest/v1/comments`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify({ project, name: name.trim(), body: body.trim() }),
  });
  if (!r.ok) throw new Error(String(r.status));
  const [row] = await r.json();
  return row;
}
