'use client';
import { useEffect, useState } from 'react';
import { fetchDashboard, fetchTokens } from '@/lib/api';

interface Token {
  ticker: string; name: string; image_url?: string; description?: string;
  progress: number; real_ton: number; trade_count: number; price: number;
  curve_address?: string; jetton_address?: string; creator_username?: string;
}

interface Dashboard {
  total: number; graduated: number; treasury_ton: number;
}

function TokenImage({ url, ticker }: { url?: string; ticker: string }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#F5A623] flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
        {ticker[0]}
      </div>
    );
  }
  // Convert IPFS gateway URL or use directly
  const src = url.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/');
  return (
    <img
      src={src}
      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
      alt={ticker}
      onError={() => setErr(true)}
    />
  );
}

function TokenDetail({ token, onBack }: { token: Token; onBack: () => void }) {
  const progress = Math.min(token.progress ?? 0, 100);
  const tonscan = `https://tonscan.org/address/${token.curve_address}`;

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-[#FFD700] text-sm mb-2">
        ← Back
      </button>
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A] space-y-4">
        <div className="flex items-center gap-4">
          <TokenImage url={token.image_url} ticker={token.ticker} />
          <div>
            <div className="text-white font-bold text-xl">${token.ticker}</div>
            <div className="text-[#888] text-sm">{token.name}</div>
            {token.creator_username && <div className="text-[#555] text-xs">by @{token.creator_username}</div>}
          </div>
        </div>
        {token.description && (
          <p className="text-[#aaa] text-sm leading-relaxed">{token.description}</p>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['💰', `${(token.real_ton ?? 0).toFixed(2)}`, 'TON raised'],
            ['📊', `${token.trade_count ?? 0}`, 'Trades'],
            ['📈', `${progress.toFixed(1)}%`, 'Progress'],
          ].map(([icon, val, label]) => (
            <div key={label} className="bg-[#111] rounded-xl p-3">
              <div className="text-lg">{icon}</div>
              <div className="text-[#FFD700] font-bold text-sm">{val}</div>
              <div className="text-[#555] text-xs">{label}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#666] mb-1">
            <span>{(token.real_ton ?? 0).toFixed(2)} TON</span>
            <span>500 TON 🎓</span>
          </div>
          <div className="h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="space-y-2 text-xs text-[#555] break-all">
          {token.curve_address && (
            <div><span className="text-[#888]">Curve: </span>{token.curve_address}</div>
          )}
          {token.jetton_address && (
            <div><span className="text-[#888]">Jetton: </span>{token.jetton_address}</div>
          )}
        </div>
        {token.curve_address && (
          <a
            href={tonscan}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center bg-[#FFD700] text-black font-bold py-3 rounded-xl text-sm"
          >
            View on TONScan 🔍
          </a>
        )}
      </div>
    </div>
  );
}

export default function TrendingTab() {
  const [tokens, setTokens]     = useState<Token[]>([]);
  const [dash, setDash]         = useState<Dashboard | null>(null);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Token | null>(null);

  useEffect(() => {
    Promise.all([fetchTokens(), fetchDashboard()]).then(([t, d]) => {
      setTokens(t || []);
      setDash(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[#FFD700] animate-pulse text-4xl">🥚</div>
    </div>
  );

  if (selected) return <TokenDetail token={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="p-4 space-y-4">
      {dash && (
        <div className="grid grid-cols-3 gap-2">
          {[
            ['4️⃣', dash.total, 'Tokens'],
            ['🎓', dash.graduated, 'Graduated'],
            ['💎', `${(dash.treasury_ton ?? 0).toFixed(1)} TON`, 'Treasury'],
          ].map(([icon, val, label]) => (
            <div key={String(label)} className="bg-[#1A1A1A] rounded-xl p-3 text-center">
              <div className="text-xl">{icon}</div>
              <div className="text-[#FFD700] font-bold text-sm">{val}</div>
              <div className="text-[#666] text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}

      {tokens.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🥚</div>
          <p className="text-[#888]">No tokens yet. Be the first to launch.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => (
            <button
              key={t.ticker}
              onClick={() => setSelected(t)}
              className="w-full text-left bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] active:border-[#FFD700] transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <TokenImage url={t.image_url} ticker={t.ticker} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">${t.ticker}</span>
                    <span className="text-[#666] text-xs truncate">{t.name}</span>
                  </div>
                  <div className="text-[#888] text-xs">{(t.real_ton ?? 0).toFixed(2)} TON raised · {t.trade_count ?? 0} trades</div>
                </div>
                <div className="text-[#F5A623] text-xs font-bold">{(t.progress ?? 0).toFixed(1)}%</div>
              </div>
              <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full"
                  style={{ width: `${Math.min(t.progress ?? 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#555] mt-1">
                <span>{(t.real_ton ?? 0).toFixed(1)} TON</span>
                <span>500 TON 🎓</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
