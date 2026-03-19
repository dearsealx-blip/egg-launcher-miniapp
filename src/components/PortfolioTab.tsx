'use client';
import { useEffect, useState } from 'react';
import { fetchTokens } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://egg-api-production.up.railway.app';

interface Token {
  ticker: string; name: string; image_url?: string;
  jetton_address: string; curve_address: string;
  real_ton: number; progress: number; trade_count: number;
  creator_tg_id?: number;
}

export default function PortfolioTab() {
  const [launched, setLaunched]   = useState<Token[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tgId, setTgId]           = useState<number | null>(null);
  const [wallet, setWallet]       = useState<{ address: string; balance: string } | null>(null);
  const [seed, setSeed]           = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [showSeed, setShowSeed]   = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    const tg   = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    const id   = user?.id || null;
    setTgId(id);

    fetchTokens().then((tokens: Token[]) => {
      if (id) setLaunched(tokens.filter((t: Token) => t.creator_tg_id === id));
      setLoading(false);
    });

    if (id) {
      fetch(`${API}/api/wallet/${id}?username=${user?.username || ''}`)
        .then(r => r.json())
        .then(d => { if (d.address) setWallet({ address: d.address, balance: d.balance || '0' }); })
        .catch(() => {});
    }
  }, []);

  async function handleShowSeed() {
    if (!tgId) return;
    if (seed) { setShowSeed(s => !s); return; }
    setSeedLoading(true);
    try {
      const r = await fetch(`${API}/api/wallet/${tgId}/seed`);
      const d = await r.json();
      if (d.mnemonic) { setSeed(d.mnemonic); setShowSeed(true); }
    } catch {}
    setSeedLoading(false);
  }

  function copyAddress() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#FFD700] animate-pulse">Loading...</div></div>;

  return (
    <div className="p-4 space-y-5">

      {/* Wallet card */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-white font-bold">Your Egg Wallet</p>
          <span className="text-[#FFD700] font-bold">{parseFloat(wallet?.balance || '0').toFixed(3)} TON</span>
        </div>

        {wallet ? (
          <button onClick={copyAddress}
            className="w-full bg-[#111] rounded-xl p-2.5 text-left text-[#888] text-xs break-all border border-[#2A2A2A] active:border-[#FFD700]">
            {copied ? '✓ Copied!' : wallet.address}
          </button>
        ) : (
          <div className="text-[#555] text-sm">Open in Telegram to see your wallet.</div>
        )}

        <p className="text-[#555] text-xs">Fund this address with TON to trade inside the app.</p>

        {/* Export seed */}
        {wallet && (
          <div className="space-y-2">
            <button onClick={handleShowSeed} disabled={seedLoading}
              className="w-full bg-[#111] border border-[#2A2A2A] text-[#888] font-bold py-2.5 rounded-xl text-sm active:border-[#FFD700]">
              {seedLoading ? 'Loading...' : showSeed ? 'Hide Seed Phrase' : '🔑 Export Seed Phrase'}
            </button>

            {showSeed && seed && (
              <div className="bg-[#0a0a0a] border border-red-500/30 rounded-xl p-4 space-y-3">
                <p className="text-red-400 text-xs font-bold">⚠️ Keep this secret! Never share it.</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {seed.split(' ').map((word, i) => (
                    <div key={i} className="bg-[#1A1A1A] rounded-lg px-2 py-1.5 text-center">
                      <span className="text-[#444] text-xs">{i + 1}. </span>
                      <span className="text-white text-xs font-mono">{word}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigator.clipboard.writeText(seed)}
                  className="w-full bg-[#1A1A1A] text-[#888] text-xs py-2 rounded-xl border border-[#2A2A2A] active:border-[#FFD700]">
                  Copy All Words
                </button>
                <p className="text-[#444] text-xs text-center">Import into Tonkeeper or MyTonWallet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tokens launched by me */}
      <div>
        <h3 className="text-[#888] text-xs font-bold uppercase tracking-wider mb-3">Your Launched Tokens</h3>
        {!tgId ? (
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center text-[#555] text-sm">Open this app inside Telegram.</div>
        ) : launched.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center text-[#555] text-sm">No tokens launched yet.</div>
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
