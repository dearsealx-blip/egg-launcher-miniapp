'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Token {
  ticker: string;
  name: string;
  description: string;
  image_url: string;
  creator_username: string;
  real_ton: number;
  trade_count: number;
  progress: number;
  graduated: boolean;
  price: number;
}

export default function TrendingTab() {
  const [tokens, setTokens]   = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState<'progress' | 'trades' | 'new'>('progress');

  useEffect(() => {
    fetch(`${API}/api/tokens?sort=${sort}`)
      .then(r => r.json())
      .then(setTokens)
      .finally(() => setLoading(false));
  }, [sort]);

  return (
    <div className="p-4">
      {/* Sort tabs */}
      <div className="flex gap-2 mb-4">
        {(['progress', 'trades', 'new'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              sort === s
                ? 'bg-[#F5A623] text-black'
                : 'bg-[#2A2A2A] text-[#888]'
            }`}
          >
            {s === 'progress' ? '🔥 Hot' : s === 'trades' ? '📈 Volume' : '🆕 New'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin text-3xl">🥚</div>
        </div>
      )}

      <div className="space-y-3">
        {tokens.map(token => (
          <TokenCard key={token.ticker} token={token} />
        ))}
      </div>

      {!loading && tokens.length === 0 && (
        <div className="text-center py-12 text-[#888]">
          <p className="text-4xl mb-3">🥚</p>
          <p>no tokens yet. be first.</p>
        </div>
      )}
    </div>
  );
}

function TokenCard({ token }: { token: Token }) {
  const pct   = Math.min(token.progress, 100);
  const color = pct >= 80 ? '#FFD700' : '#F5A623';

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex items-start gap-3">
        {/* Token image */}
        <div className="w-12 h-12 rounded-full bg-[#2A2A2A] overflow-hidden flex-shrink-0">
          {token.image_url && (
            <img src={token.image_url} alt={token.ticker} className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-base" style={{ color }}>
              ${token.ticker}
            </span>
            <span className="text-xs text-[#888]">
              {token.real_ton.toFixed(1)} / 500 TON
            </span>
          </div>
          <p className="text-[#888] text-xs mt-0.5 truncate">
            by @{token.creator_username} · {token.trade_count} trades
          </p>

          {/* Progress bar */}
          <div className="mt-2 bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>

          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#888]">{token.description?.slice(0, 40)}...</span>
            <span className="text-xs font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <BuyButton token={token} />
        <button className="flex-1 py-2 rounded-lg bg-[#2A2A2A] text-[#888] text-xs font-bold active:bg-[#333]">
          📊 Chart
        </button>
        <button className="py-2 px-3 rounded-lg bg-[#2A2A2A] text-[#888] text-xs active:bg-[#333]">
          🔔
        </button>
      </div>
    </div>
  );
}

function BuyButton({ token }: { token: Token }) {
  const [buying, setBuying]   = useState(false);
  const [amount, setAmount]   = useState('');
  const [open, setOpen]       = useState(false);

  const handleBuy = async () => {
    if (!amount || isNaN(+amount)) return;
    setBuying(true);
    try {
      // Trigger TON Connect transaction via Telegram Mini App
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.openInvoice(`ton://transfer/CURVE_ADDRESS?amount=${Math.floor(+amount * 1e9)}&comment=BUY_${token.ticker}`);
      }
    } finally {
      setBuying(false);
      setOpen(false);
    }
  };

  if (open) {
    return (
      <div className="flex-1 flex gap-2">
        <input
          type="number"
          placeholder="TON amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="flex-1 bg-[#2A2A2A] text-white text-xs rounded-lg px-2 py-2 outline-none"
          autoFocus
        />
        <button
          onClick={handleBuy}
          disabled={buying}
          className="px-3 py-2 rounded-lg bg-[#F5A623] text-black text-xs font-bold"
        >
          {buying ? '...' : 'BUY'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex-1 py-2 rounded-lg bg-[#F5A623] text-black text-xs font-bold active:bg-[#FFD700]"
    >
      🛒 Buy
    </button>
  );
}
