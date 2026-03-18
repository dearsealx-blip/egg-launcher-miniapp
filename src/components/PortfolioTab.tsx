'use client';
import { useEffect, useState } from 'react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { fetchTokens } from '@/lib/api';

interface Token {
  ticker: string; name: string; image_url?: string;
  jetton_address: string; curve_address: string;
  real_ton: number; progress: number; trade_count: number;
  creator_tg_id?: number;
}

interface Holding {
  token: Token;
  balance: number;
}

function getTgUser() {
  try { return (window as any).Telegram?.WebApp?.initDataUnsafe?.user; } catch { return null; }
}

export default function PortfolioTab() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [launched, setLaunched] = useState<Token[]>([]);
  const [loading, setLoading]   = useState(false);

  const tgUser = typeof window !== 'undefined' ? getTgUser() : null;

  useEffect(() => {
    if (!wallet) return;
    loadPortfolio();
  }, [wallet]);

  async function loadPortfolio() {
    setLoading(true);
    try {
      const tokens: Token[] = await fetchTokens();
      const addr = wallet!.account.address;

      // Find tokens launched by this user (by Telegram ID)
      const tgId = tgUser?.id;
      if (tgId) {
        setLaunched(tokens.filter(t => t.creator_tg_id === tgId));
      }

      // Check jetton balances via toncenter for each token
      const holdingsList: Holding[] = [];
      for (const token of tokens) {
        try {
          const r = await fetch(
            `https://toncenter.com/api/v3/jetton/wallets?owner_address=${addr}&jetton_address=${token.jetton_address}&limit=1`,
            { headers: { 'X-API-Key': '1fd161ec024cd219ca33841ba501876cabf8e864e5ae35fce77694e3725da156' } }
          );
          const data = await r.json();
          const bal = data.jetton_wallets?.[0]?.balance;
          if (bal && BigInt(bal) > 0n) {
            holdingsList.push({ token, balance: Number(BigInt(bal)) / 1e9 });
          }
        } catch {}
      }
      setHoldings(holdingsList);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (!wallet) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="text-6xl">🥚</div>
      <p className="text-white font-bold text-lg">Connect your wallet</p>
      <p className="text-[#888] text-sm">to see your token holdings and earnings</p>
      <button
        onClick={() => tonConnectUI.openModal()}
        className="bg-[#FFD700] text-black font-bold px-8 py-3 rounded-xl text-base"
      >
        Connect Wallet
      </button>
    </div>
  );

  const shortAddr = wallet.account.address.slice(0, 6) + '...' + wallet.account.address.slice(-4);

  return (
    <div className="p-4 space-y-5">
      {/* Wallet */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] flex items-center justify-between">
        <div>
          <p className="text-[#888] text-xs">Connected wallet</p>
          <p className="text-white font-mono text-sm">{shortAddr}</p>
        </div>
        <button onClick={() => tonConnectUI.disconnect()} className="text-[#555] text-xs border border-[#2A2A2A] px-3 py-1.5 rounded-lg">
          Disconnect
        </button>
      </div>

      {/* Holdings */}
      <div>
        <h3 className="text-[#888] text-xs font-bold uppercase tracking-wider mb-3">Your Holdings</h3>
        {loading ? (
          <div className="text-center py-8 text-[#555]">Loading...</div>
        ) : holdings.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-xl p-6 text-center">
            <p className="text-[#555] text-sm">No token holdings yet.</p>
            <p className="text-[#444] text-xs mt-1">Buy tokens in the Trending tab.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {holdings.map(h => (
              <div key={h.token.ticker} className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-white">${h.token.ticker}</span>
                    <span className="text-[#666] text-xs ml-2">{h.token.name}</span>
                  </div>
                  <span className="text-[#FFD700] font-bold">{h.balance.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full" style={{ width: `${Math.min(h.token.progress ?? 0, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-[#555] mt-1">
                  <span>{(h.token.real_ton ?? 0).toFixed(1)} TON raised</span>
                  <span>{(h.token.progress ?? 0).toFixed(1)}% to graduate</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Launched by me */}
      {launched.length > 0 && (
        <div>
          <h3 className="text-[#888] text-xs font-bold uppercase tracking-wider mb-3">Tokens You Launched</h3>
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
                <p className="text-[#666] text-xs mt-1">{(t.real_ton ?? 0).toFixed(2)} / 500 TON &middot; {t.trade_count ?? 0} trades &middot; earning 0.2% per trade</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
