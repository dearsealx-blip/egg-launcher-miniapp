const API = process.env.NEXT_PUBLIC_API_URL || 'https://egg-api-production.up.railway.app';

export async function fetchTokens() {
  const r = await fetch(`${API}/api/tokens`);
  return r.json();
}

export async function fetchToken(ticker: string) {
  const r = await fetch(`${API}/api/tokens/${ticker}`);
  return r.json();
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('image', file);
  const r = await fetch(`${API}/api/upload-image`, { method: 'POST', body: fd });
  const j = await r.json();
  return j.url;
}

export async function reserveLaunch(params: {
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  dex_choice: string;
}): Promise<{ ok: boolean; ticker: string; payment_address: string; comment: string }> {
  // Get Telegram user from WebApp
  let tg_id = 0;
  let tg_username = '';
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
    const u = (window as any).Telegram.WebApp.initDataUnsafe.user;
    tg_id = u.id;
    tg_username = u.username || '';
  }

  const r = await fetch(`${API}/api/pending-launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, tg_id, tg_username }),
  });
  return r.json();
}

export async function fetchPortfolio(walletAddress: string) {
  const r = await fetch(`${API}/api/portfolio/${walletAddress}`);
  return r.json();
}
