'use client';
import { useEffect, useState } from 'react';
import { fetchDashboard, fetchTokens } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://egg-api-production.up.railway.app';

interface Token {
  ticker: string; name: string; image_url?: string; description?: string;
  progress: number; real_ton: number; trade_count: number; price: number;
  curve_address?: string; jetton_address?: string; creator_username?: string;
}

interface Wallet { address: string; balance: string; }

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

function TokenDetail({ token, onBack, wallet, onRefreshWallet }: { token: Token; onBack: () => void; wallet: Wallet | null; onRefreshWallet: () => void }) {
  const [tab, setTab]           = useState<'buy'|'sell'>('buy');
  const [amount, setAmount]     = useState(0.5);
  const [custom, setCustom]     = useState('');
  const [sellAmt, setSellAmt]   = useState(1000000);
  const [sellCustom, setSellCustom] = useState('');
  const [status, setStatus]       = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [msg, setMsg]             = useState('');
  const [tokenBal, setTokenBal]   = useState<string>('0');

  const tg   = (window as any).Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;

  const progress   = Math.min(token.progress ?? 0, 100);
  const buyAmount  = custom ? parseFloat(custom) || 0.5 : amount;
  const sellTokens = sellCustom ? parseInt(sellCustom) || 1000000 : sellAmt;
  const walletBal  = parseFloat(wallet?.balance || '0');
  const tokenBalNum = parseInt(tokenBal) || 0;

  useEffect(() => {
    if (!user?.id || !token.jetton_address) return;
    fetch(`${API}/api/wallet/${user.id}/jetton?master=${token.jetton_address}`)
      .then(r => r.json()).then(d => setTokenBal(d.balance || '0')).catch(() => {});
  }, [user?.id, token.jetton_address]);

  async function refreshBalances() {
    if (!user?.id) return;
    fetch(`${API}/api/wallet/${user.id}/jetton?master=${token.jetton_address}`)
      .then(r => r.json()).then(d => setTokenBal(d.balance || '0')).catch(() => {});
    onRefreshWallet();
  }

  async function handleBuy() {
    if (!user?.id || !token.curve_address) return;
    if (walletBal < buyAmount + 0.05) {
      setMsg(`Need ${(buyAmount + 0.05).toFixed(2)} TON. Fund your wallet first.`);
      setStatus('err');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    setStatus('loading');
    setMsg('');
    try {
      const r = await fetch(`${API}/api/wallet/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: user.id, curve_address: token.curve_address, ton_amount: buyAmount }),
      });
      const d = await r.json();
      if (d.ok) { setStatus('ok'); setMsg(`Bought! Tx sent.`); setTimeout(refreshBalances, 12000); }
      else { setStatus('err'); setMsg(d.error || 'Failed'); }
    } catch (e: any) { setStatus('err'); setMsg(e.message); }
    setTimeout(() => setStatus('idle'), 3000);
  }

  async function handleSell() {
    if (!user?.id || !token.curve_address) return;
    // Block sell if not enough tokens
    if (tokenBalNum <= 0) {
      setStatus('err'); setMsg('No tokens to sell');
      setTimeout(() => setStatus('idle'), 3000); return;
    }
    if (sellTokens > tokenBalNum) {
      setStatus('err'); setMsg(`Only have ${(tokenBalNum/1e9).toFixed(1)}M tokens`);
      setTimeout(() => setStatus('idle'), 3000); return;
    }
    setStatus('loading');
    setMsg('');
    try {
      const r = await fetch(`${API}/api/wallet/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: user.id, curve_address: token.curve_address, jetton_address: token.jetton_address, token_amount: sellTokens }),
      });
      const d = await r.json();
      if (d.ok) {
        setStatus('ok'); setMsg('Sold! TON sent to your wallet.');
        setTokenBal(String(Math.max(0, tokenBalNum - sellTokens))); // optimistic update
        setTimeout(refreshBalances, 10000);
      }
      else { setStatus('err'); setMsg(d.error || 'Failed'); }
    } catch (e: any) { setStatus('err'); setMsg(e.message); }
    setTimeout(() => setStatus('idle'), 3000);
  }

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

        {/* Balances */}
        {wallet && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#111] rounded-xl p-3 text-center">
              <div className={`text-sm font-bold ${walletBal > 0 ? 'text-[#FFD700]' : 'text-[#555]'}`}>{walletBal.toFixed(3)}</div>
              <div className="text-[#444] text-xs">TON balance</div>
            </div>
            <div className="bg-[#111] rounded-xl p-3 text-center">
              <div className={`text-sm font-bold ${tokenBalNum > 0 ? 'text-[#F5A623]' : 'text-[#555]'}`}>{tokenBalNum > 0 ? (tokenBalNum/1e6).toFixed(1)+'M' : '0'}</div>
              <div className="text-[#444] text-xs">${token.ticker} balance</div>
            </div>
          </div>
        )}
        {wallet && walletBal === 0 && (
          <div className="text-[#888] text-xs text-center bg-[#111] rounded-xl p-3">
            Fund your wallet: <span className="text-[#FFD700] break-all">{wallet.address}</span>
          </div>
        )}

        {/* Buy/Sell tabs */}
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

            {status === 'ok' && <div className="text-green-400 text-sm text-center">{msg}</div>}
            {status === 'err' && <div className="text-red-400 text-sm text-center">{msg}</div>}

            <button onClick={handleBuy} disabled={status === 'loading'}
              className={`w-full font-bold py-3.5 rounded-xl text-base transition-all ${status === 'loading' ? 'bg-[#555] text-[#999] cursor-wait' : 'bg-[#FFD700] text-black active:scale-95'}`}>
              {status === 'loading' ? 'Buying...' : `Buy ${buyAmount} TON`}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#888] text-xs">How many tokens to sell?</span>
              {tokenBalNum > 0 && (
                <button onClick={() => setSellCustom(tokenBalNum.toString())}
                  className="text-xs text-[#FFD700] font-bold border border-[#FFD700]/30 rounded-lg px-2 py-0.5">
                  MAX ({(tokenBalNum/1e6).toFixed(1)}M)
                </button>
              )}
            </div>
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

            {status === 'ok' && tab === 'sell' && <div className="text-green-400 text-sm text-center">{msg}</div>}
            {status === 'err' && tab === 'sell' && <div className="text-red-400 text-sm text-center">{msg}</div>}

            <button onClick={handleSell} disabled={status === 'loading'}
              className={`w-full font-bold py-3.5 rounded-xl text-base transition-all ${status === 'loading' ? 'bg-[#555] text-[#999] cursor-wait' : 'bg-red-500 text-white active:scale-95'}`}>
              {status === 'loading' ? 'Selling...' : `Sell ${(sellTokens/1_000_000).toFixed(0)}M ${token.ticker}`}
            </button>
            <p className="text-[#555] text-xs text-center">Tokens sold from your Egg wallet</p>
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
  const [tokens, setTokens]   = useState<Token[]>([]);
  const [dash, setDash]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Token | null>(null);
  const [wallet, setWallet]   = useState<Wallet | null>(null);

  useEffect(() => {
    const tg   = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    Promise.all([fetchTokens(), fetchDashboard()]).then(([t, d]) => {
      setTokens(t || []);
      setDash(d);
      setLoading(false);
    });

    if (user?.id) {
      fetch(`${API}/api/wallet/${user.id}?username=${user.username || ''}`)
        .then(r => r.json())
        .then(d => { if (d.address) setWallet({ address: d.address, balance: d.balance || '0' }); })
        .catch(() => {});
    }
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#FFD700] animate-pulse text-2xl">Loading...</div></div>;
  const refreshWallet = () => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (!user?.id) return;
    fetch(`${API}/api/wallet/${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.address) setWallet({ address: d.address, balance: d.balance || '0' }); })
      .catch(() => {});
  };

  if (selected) return <TokenDetail token={selected} onBack={() => setSelected(null)} wallet={wallet} onRefreshWallet={refreshWallet} />;

  return (
    <div className="p-4 space-y-4">
      {dash && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <div className="text-[#FFD700] font-bold text-lg">{dash.total ?? 0}</div>
            <div className="text-[#555] text-xs">Tokens</div>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <div className="text-[#FFD700] font-bold text-lg">{dash.graduated ?? 0}</div>
            <div className="text-[#555] text-xs">Graduated</div>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <div className="text-[#FFD700] font-bold text-lg">{dash.treasury_ton?.toFixed(1) ?? '0'}</div>
            <div className="text-[#555] text-xs">TON treasury</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tokens.length === 0 && <div className="text-[#555] text-center py-8">No tokens yet</div>}
        {tokens.map(token => (
          <button key={token.ticker} onClick={() => setSelected(token)}
            className="w-full bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] flex items-center gap-3 text-left hover:border-[#FFD700]/30 transition-colors">
            <TokenImage url={token.image_url} ticker={token.ticker} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">${token.ticker}</span>
                <span className="text-[#FFD700] text-sm font-bold">{(token.real_ton ?? 0).toFixed(2)} TON</span>
              </div>
              <div className="text-[#666] text-xs truncate">{token.name}</div>
              <div className="mt-1.5 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full" style={{ width: `${Math.min(token.progress ?? 0, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[#444] text-xs mt-0.5">
                <span>{token.trade_count ?? 0} trades</span>
                <span>{(token.progress ?? 0).toFixed(1)}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
