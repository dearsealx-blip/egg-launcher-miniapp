'use client';
import { useEffect, useState } from 'react';
import { fetchDashboard, fetchTokens } from '@/lib/api';

interface Token {
  ticker: string; name: string; image_url?: string;
  progress: number; real_ton: number; trade_count: number; price: number;
}

interface Dashboard {
  total: number; graduated: number; treasury_ton: number; top_token?: Token;
}

export default function TrendingTab() {
  const [tokens, setTokens]   = useState<Token[]>([]);
  const [dash, setDash]       = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTokens(), fetchDashboard()]).then(([t, d]) => {
      setTokens(t || []);
      setDash(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[#FFD700] animate-pulse text-2xl">🥚</div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {/* Stats bar */}
      {dash && (
        <div className="grid grid-cols-3 gap-2">
          {[
            ['🪙', 'Tokens', dash.total],
            ['🎓', 'Graduated', dash.graduated],
            ['💎', 'Treasury', `${dash.treasury_ton.toFixed(1)} TON`],
          ].map(([icon, label, val]) => (
            <div key={String(label)} className="bg-[#1A1A1A] rounded-xl p-3 text-center">
              <div className="text-xl">{icon}</div>
              <div className="text-[#FFD700] font-bold text-sm">{val}</div>
              <div className="text-[#666] text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Token list */}
      {tokens.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🥚</div>
          <p className="text-[#888]">No tokens yet.</p>
          <p className="text-[#555] text-sm mt-1">Be the first to launch.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => (
            <div key={t.ticker} className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
              <div className="flex items-center gap-3 mb-3">
                {t.image_url
                  ? <img src={t.image_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                  : <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold">{t.ticker[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">${t.ticker}</span>
                    <span className="text-[#666] text-xs truncate">{t.name}</span>
                  </div>
                  <div className="text-[#888] text-xs">{t.real_ton.toFixed(2)} TON raised · {t.trade_count} trades</div>
                </div>
                <div className="text-right">
                  <div className="text-[#F5A623] text-xs font-bold">{t.progress.toFixed(1)}%</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full transition-all"
                  style={{ width: `${Math.min(t.progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#555] mt-1">
                <span>{t.real_ton.toFixed(1)} TON</span>
                <span>500 TON 🎓</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
