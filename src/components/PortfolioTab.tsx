'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function PortfolioTab() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
  const tg_id = tg?.initDataUnsafe?.user?.id;

  useEffect(() => {
    if (!tg_id) { setLoading(false); return; }
    fetch(`${API}/api/portfolio/${tg_id}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [tg_id]);

  if (!tg_id) {
    return (
      <div className="p-4 text-center py-12">
        <p className="text-4xl mb-3">🥚</p>
        <p className="text-[#888] text-sm">open via Telegram to see your portfolio</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin text-3xl">🥚</div>
      </div>
    );
  }

  const launched  = data?.launched || [];
  const following = data?.following || [];
  const earnings  = data?.total_earnings_ton || 0;
  const referrals = data?.referral_earnings_ton || 0;

  return (
    <div className="p-4 space-y-4">
      {/* Earnings summary */}
      <div className="bg-[#1A1A1A] rounded-xl p-4">
        <h2 className="text-[#888] text-xs mb-3 font-bold">YOUR EARNINGS</h2>
        <div className="flex gap-3">
          <div className="flex-1 bg-[#0D0D0D] rounded-lg p-3">
            <p className="text-xs text-[#888]">Trade fees</p>
            <p className="text-[#F5A623] font-bold text-xl">{earnings.toFixed(3)}</p>
            <p className="text-xs text-[#888]">TON</p>
          </div>
          <div className="flex-1 bg-[#0D0D0D] rounded-lg p-3">
            <p className="text-xs text-[#888]">Referrals</p>
            <p className="text-[#FFD700] font-bold text-xl">{referrals.toFixed(3)}</p>
            <p className="text-xs text-[#888]">TON</p>
          </div>
        </div>
      </div>

      {/* Launched tokens */}
      {launched.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-xl p-4">
          <h2 className="text-[#888] text-xs mb-3 font-bold">YOUR TOKENS</h2>
          <div className="space-y-3">
            {launched.map((t: any) => (
              <div key={t.ticker} className="flex items-center justify-between">
                <div>
                  <span className="text-[#F5A623] font-bold">${t.ticker}</span>
                  <p className="text-xs text-[#888]">{t.trade_count} trades</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-bold">{t.real_ton.toFixed(1)} / 500</p>
                  <div className="w-24 bg-[#2A2A2A] rounded-full h-1.5 mt-1">
                    <div
                      className="h-full rounded-full bg-[#F5A623]"
                      style={{ width: `${Math.min(t.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Following */}
      {following.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-xl p-4">
          <h2 className="text-[#888] text-xs mb-3 font-bold">FOLLOWING</h2>
          <div className="space-y-2">
            {following.map((t: any) => (
              <div key={t.ticker} className="flex items-center justify-between py-1">
                <span className="text-white text-sm">${t.ticker}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-[#2A2A2A] rounded-full h-1.5">
                    <div
                      className="h-full rounded-full bg-[#F5A623]"
                      style={{ width: `${Math.min(t.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#888]">{t.progress.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {launched.length === 0 && following.length === 0 && (
        <div className="text-center py-8 text-[#888]">
          <p className="text-4xl mb-3">🥚</p>
          <p className="text-sm">nothing here yet</p>
          <p className="text-xs mt-1">launch a token or follow one</p>
        </div>
      )}

      {/* Referral link */}
      <div className="bg-[#1F1A00] rounded-xl p-4">
        <p className="text-[#F5A623] font-bold text-sm mb-1">📣 Referral Link</p>
        <p className="text-[#888] text-xs mb-2">Earn 0.5% on every launch through your link</p>
        <button
          onClick={() => {
            const link = `https://t.me/EggLauncherBot/app?startapp=ref_${tg_id}`;
            tg?.openLink(link);
          }}
          className="w-full py-2 rounded-lg bg-[#2A2A2A] text-[#F5A623] text-xs font-bold"
        >
          Copy Referral Link
        </button>
      </div>
    </div>
  );
}
