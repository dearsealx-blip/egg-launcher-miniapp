export const API = process.env.NEXT_PUBLIC_API_URL || 'https://egg-api-production.up.railway.app';

export async function fetchTokens() {
  const r = await fetch(`${API}/api/tokens?sort=trade_count`);
  return r.json();
}

export async function fetchDashboard() {
  const r = await fetch(`${API}/api/dashboard`);
  return r.json();
}

export async function fetchToken(ticker: string) {
  const r = await fetch(`${API}/api/tokens/${ticker}`);
  return r.json();
}

export async function reserveLaunch(data: {
  name: string; ticker: string; description: string;
  image_url: string; dex_choice: string; tg_id?: number; tg_username?: string;
}) {
  const r = await fetch(`${API}/api/launch/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const r = await fetch(`${API}/api/launch/upload`, { method: 'POST', body: form });
  const j = await r.json();
  return j.image_url;
}
