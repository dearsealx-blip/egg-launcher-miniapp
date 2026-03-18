'use client';
import { useEffect, useState } from 'react';
import { fetchTokens } from '@/lib/api';

interface Token {
  ticker: string; name: string; image_url?: string;
  jetton_address: string; curve_address: string;
  real_ton: number; progress: number; trade_count: number;
  creator_tg_id?: number;
}

export default function PortfolioTab() {
  const [launched, setLaunched] = useState<Token[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tgId, setTgId]         = useState<number | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    const id = user?.id || null;
    setTgId(id);

    fetchTokens().then((tokens: Token[]) => {
      if (id) setLaunched(tokens.filter((t: Token) => t.creator_tg_id === id));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#FFD700] animate-pulse">Loading...</div></div>;

  return (
    <div className="p-4 space-y-5">
      {/* Holdings via Tonviewer */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] space-y-3">
        <p className="text-white font-bold">Your Holdings</p>
        <p className="text-[#888] text-sm">View your token balances in Tonkeeper or TONViewer.</p>
        <a
          href="https://tonviewer.com"
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center bg-[#FFD700] text-black font-bold py-3 rounded-xl text-sm"
        >
          Open TONViewer
        </a>
      </div>

      {/* Tokens launched by me */}
      <div>
        <h3 className="text-[#888] text-xs font-bold uppercase tracking-wider mb-3">
          {tgId ? 'Your Launched Tokens' : 'Open in Telegram to see your tokens'}
        </h3>
        {!tgId ? (
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center text-[#555] text-sm">Open this app inside Telegram.</div>
        ) : launched.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center text-[#555] text-sm">
            No tokens launched yet. Go to Launch tab!
          </div>
        ) : (
          <div className="space-y-2">
            {launched.map(t => (
              <div key={t.ticker} className="bg-[#1A1A1A] rounded-xl p-4 border border-[#FFD700]/20">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-white">${t.ticker}</span>
                  <span className="text-[#F5A623] text-sm">{(t.progress ?? 0).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full" style={{ width: `${Math.min(t.progress ?? 0, 100)}%` }} />
                </div>
                <p className="text-[#666] text-xs mt-1">{(t.real_ton ?? 0).toFixed(2)} / 500 TON &middot; {t.trade_count ?? 0} trades &middot; earning 0.2% fees</p>
                <a href={`https://tonviewer.com/${t.curve_address}`} target="_blank" rel="noreferrer"
                  className="block text-center text-[#555] text-xs mt-2">View on TONViewer</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
