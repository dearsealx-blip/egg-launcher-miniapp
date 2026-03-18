'use client';
import { useEffect, useState } from 'react';
import { API } from '@/lib/api';

interface PortfolioData {
  launched: { ticker: string; name: string; progress: number; real_ton: number }[];
  following: { ticker: string; progress: number; real_ton: number }[];
  total_earnings_ton: number;
  referral_earnings_ton: number;
}

// In a real TMA this comes from window.Telegram.WebApp.initDataUnsafe.user
function getTgId(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id || null;
  } catch { return null; }
}

export default function PortfolioTab() {
  const [data, setData]     = useState<PortfolioData | null>(null);
  const [loading, setLoad]  = useState(true);
  const tgId = typeof window !== 'undefined' ? getTgId() : null;

  useEffect(() => {
    if (!tgId) { setLoad(false); return; }
    fetch(`${API}/api/dashboard/portfolio/${tgId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoad(false); });
  }, [tgId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#FFD700] animate-pulse text-2xl">🥚</div></div>;

  if (!tgId) return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-3">🔒</div>
      <p className="text-[#888]">Open in Telegram to view your portfolio.</p>
    </div>
  );

  const totalEarnings = (data?.total_earnings_ton || 0) + (data?.referral_earnings_ton || 0);

  return (
    <div className="p-4 space-y-4">
      {/* Earnings */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#FFD700]/20">
        <p className="text-[#888] text-xs mb-1">Total earnings</p>
        <p className="text-[#FFD700] text-2xl font-bold">{totalEarnings.toFixed(4)} TON</p>
        <div className="flex gap-4 mt-2 text-xs text-[#666]">
          <span>Trade fees: {data?.total_earnings_ton?.toFixed(4) || '0'} TON</span>
          <span>Referrals: {data?.referral_earnings_ton?.toFixed(4) || '0'} TON</span>
        </div>
      </div>

      {/* Launched tokens */}
      <div>
        <h3 className="text-[#888] text-xs font-bold uppercase tracking-wider mb-2">Your Tokens</h3>
        {!data?.launched?.length
          ? <div className="bg-[#1A1A1A] rounded-xl p-4 text-center text-[#555] text-sm">No tokens launched yet.</div>
          : data.launched.map(t => (
            <div key={t.ticker} className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] mb-2">
              <div className="flex justify-between mb-2">
                <span className="font-bold">${t.ticker}</span>
                <span className="text-[#F5A623] text-sm">{t.progress.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-[#2A2A2A] rounded-full">
                <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#F5A623] rounded-full" style={{ width: `${Math.min(t.progress, 100)}%` }} />
              </div>
              <p className="text-[#666] text-xs mt-1">{t.real_ton.toFixed(2)} / 500 TON</p>
            </div>
          ))
        }
      </div>

      {/* Following */}
      <div>
        <h3 className="text-[#888] text-xs font-bold uppercase tracking-wider mb-2">Watching</h3>
        {!data?.following?.length
          ? <div className="bg-[#1A1A1A] rounded-xl p-4 text-center text-[#555] text-sm">Not following any tokens.</div>
          : data.following.map(t => (
            <div key={t.ticker} className="bg-[#1A1A1A] rounded-xl p-3 border border-[#2A2A2A] mb-2 flex items-center justify-between">
              <span className="font-bold text-sm">${t.ticker}</span>
              <span className="text-[#F5A623] text-xs">{t.progress.toFixed(1)}%</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
