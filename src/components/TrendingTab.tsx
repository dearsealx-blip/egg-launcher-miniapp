'use client';
import { useEffect, useState } from 'react';
import { fetchDashboard, fetchTokens } from '@/lib/api';

interface Token {
  ticker: string; name: string; image_url?: string; description?: string;
  progress: number; real_ton: number; trade_count: number; price: number;
  curve_address?: string; jetton_address?: string; creator_username?: string;
}

const BUY_AMOUNTS  = [0.1, 0.5, 1, 5];
const SELL_AMOUNTS = [1000000, 5000000, 10000000, 50000000];

function TokenImage({ url, ticker }: { url?: string; ticker: string }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#F5A623] flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
        {ticker[0]}
      </div>
    );
  }
  const src = url.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/');
  return <img src={src} className="w-12 h-12 rounded-full object-cover flex-shrink-0" alt={ticker} onError={() => setErr(true)} />;
}

function openWalletLink(url: string) {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

function TokenDetail({ token, onBack }: { token: Token; onBack: () => void }) {
  const [tab, setTab]         = useState<'buy'|'sell'>('buy');
  const [amount, setAmount]   = useState(0.5);
  const [custom, setCustom]   = useState('');
  const [sellAmt, setSellAmt] = useState(1000000);
  const [sellCustom, setSellCustom] = useState('');

  const progress    = Math.min(token.progress ?? 0, 100);
  const buyAmount   = custom ? parseFloat(custom) || 0.5 : amount;
  const sellTokens  = sellCustom ? parseInt(sellCustom) || 1000000 : sellAmt;
  const nanotons    = Math.floor(buyAmount * 1e9);
  const nanoSell    = BigInt(sellTokens) * 1_000_000_000n;

  // Deep links — work inside Telegram
  const buyLink  = token.curve_address ? `https://app.tonkeeper.com/transfer/${ token.curve_address }?amount=${ nanotons }&text=buy` : '#';
  // Sell: encode payload as hex for ton:// link
  const sellLink = token.curve_address ? `https://app.tonkeeper.com/transfer/${ token.curve_address }?amount=50000000&text=sell` : '#';

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="text-[#FFD700] text-sm">&larr; Back</button>

      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A] space-y-4">
        <div className="flex items-center gap-4">
          <TokenImage url={token.image_url} ticker={token.ticker} />
          <div>
            <div className="text-white font-bold text-xl">${token.ticker}</div>
            <div className="text-[#888] text-sm">{token.name}</div>
            {token.creator_username && <div className="text-[#555] text-xs">by @{token.creator_username}</div>}
          </div>
        </div>

        {token.description && <p className="text-[#aaa] text-sm">{token.description}</p>}

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#111] rounded-xl p-3">
            <div className="text-[#FFD700] font-bold">{(token.real_ton ?? 0).toFixed(2)}</div>
            <div className="text-[#555] text-xs">TON raised</div>
          </div>
          <div className="bg-[#111] rounded-xl p-3">
            <div className="text-[#FFD700] font-bold">{token.trade_count ?? 0}</div>
            <div className="text-[#555] text-xs">Trades</div>
          </div>
          <div className="bg-[#111] rounded-xl p-3">
            <div className="text-[#FFD700] font-bold">{progress.toFixed(1)}%</div>
            <div className="text-[#555] text-xs">Progress</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#666] mb-1">
            <span>{(token.real_ton ?? 0).toFixed(1)} TON</span>
            <span>500 TON goal</span>
          </div>
          <div className="h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Buy / Sell toggle */}
        <div className="flex gap-2">
          <button onClick={() => setTab('buy')} className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==='buy' ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-[#111] text-[#888] border-[#2A2A2A]'}`}>Buy</button>
          <button onClick={() => setTab('sell')} className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==='sell' ? 'bg-red-500 text-white border-red-500' : 'bg-[#111] text-[#888] border-[#2A2A2A]'}`}>Sell</button>
        </div>

        {tab === 'buy' ? (
          <div className="space-y-2">
            <div className="text-[#888] text-xs">How much TON?</div>
            <div className="grid grid-cols-4 gap-2">
              {BUY_AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustom(''); }}
                  className={`py-2 rounded-xl text-sm font-bold border transition-colors ${!custom && amount === a ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-[#111] text-[#888] border-[#2A2A2A]'}`}>
                  {a}
                </button>
              ))}
            </div>
            <input type="number" min="0.1" step="0.1" placeholder="Custom TON" value={custom} onChange={e => setCustom(e.target.value)}
              className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white text-sm placeholder-[#555] focus:border-[#FFD700] outline-none" />
            <button onClick={() => openWalletLink(buyLink)} className="block w-full text-center bg-[#FFD700] text-black font-bold py-3 rounded-xl text-base w-full">
              Buy {buyAmount} TON &mdash; Tonkeeper
            </button>
            <button onClick={() => openWalletLink(`https://my.tt/transfer/${token.curve_address}?amount=${nanotons}&text=buy`)} className="block w-full text-center bg-[#1A1A1A] text-[#FFD700] border border-[#FFD700]/40 font-bold py-3 rounded-xl text-base w-full">
              Buy {buyAmount} TON &mdash; MyTonWallet
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[#888] text-xs">How many tokens?</div>
            <div className="grid grid-cols-4 gap-2">
              {SELL_AMOUNTS.map(a => (
                <button key={a} onClick={() => { setSellAmt(a); setSellCustom(''); }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${!sellCustom && sellAmt === a ? 'bg-red-500 text-white border-red-500' : 'bg-[#111] text-[#888] border-[#2A2A2A]'}`}>
                  {(a/1000000).toFixed(0)}M
                </button>
              ))}
            </div>
            <input type="number" placeholder="Custom amount" value={sellCustom} onChange={e => setSellCustom(e.target.value)}
              className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white text-sm placeholder-[#555] focus:border-red-500 outline-none" />
            <button onClick={() => openWalletLink(sellLink)} className="block w-full text-center bg-red-500 text-white font-bold py-3 rounded-xl text-base w-full">
              Sell via Tonkeeper
            </button>
            <button onClick={() => openWalletLink(`https://my.tt/transfer/${token.curve_address}?amount=50000000&text=sell`)} className="block w-full text-center bg-[#1A1A1A] text-red-400 border border-red-500/40 font-bold py-3 rounded-xl text-base w-full">
              Sell via MyTonWallet
            </button>
            <p className="text-[#555] text-xs text-center">Opens Tonkeeper to confirm sell</p>
          </div>
        )}

        <a href={`https://tonviewer.com/${token.curve_address}`} target="_blank" rel="noreferrer"
          className="block w-full text-center bg-[#111] text-[#555] border border-[#2A2A2A] py-2.5 rounded-xl text-xs">
          View on TONViewer
        </a>
      </div>
    </div>
  );
}

export default function TrendingTab() {
  const [tokens, setTokens]     = useState<Token[]>([]);
  const [dash, setDash]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Token | null>(null);

  useEffect(() => {
    Promise.all([fetchTokens(), fetchDashboard()]).then(([t, d]) => {
      setTokens(t || []);
      setDash(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#FFD700] animate-pulse text-2xl">Loading...</div></div>;
  if (selected) return <TokenDetail token={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="p-4 space-y-4">
      {dash && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <div className="text-[#FFD700] font-bold text-lg">{dash.total ?? 0}</div>
            <div className="text-[#666] text-xs">Tokens</div>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <div className="text-[#FFD700] font-bold text-lg">{dash.graduated ?? 0}</div>
            <div className="text-[#666] text-xs">Graduated</div>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <div className="text-[#FFD700] font-bold text-lg">{(dash.treasury_ton ?? 0).toFixed(1)}</div>
            <div className="text-[#666] text-xs">Treasury TON</div>
          </div>
        </div>
      )}

      {tokens.length === 0 ? (
        <div className="text-center py-16"><p className="text-[#888]">No tokens yet. Be the first to launch.</p></div>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => (
            <button key={t.ticker} onClick={() => setSelected(t)} className="w-full text-left bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] active:border-[#FFD700] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <TokenImage url={t.image_url} ticker={t.ticker} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">${t.ticker}</span>
                    <span className="text-[#666] text-xs truncate">{t.name}</span>
                  </div>
                  <div className="text-[#888] text-xs">{(t.real_ton ?? 0).toFixed(2)} TON &middot; {t.trade_count ?? 0} trades</div>
                </div>
                <div className="text-[#F5A623] text-xs font-bold">{(t.progress ?? 0).toFixed(1)}%</div>
              </div>
              <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full" style={{ width: `${Math.min(t.progress ?? 0, 100)}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
