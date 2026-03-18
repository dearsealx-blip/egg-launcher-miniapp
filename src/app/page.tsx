'use client';
import { useState } from 'react';
import TrendingTab from '@/components/TrendingTab';
import LaunchTab from '@/components/LaunchTab';
import PortfolioTab from '@/components/PortfolioTab';

export default function Home() {
  const [tab, setTab] = useState<'trending' | 'launch' | 'portfolio'>('trending');

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white max-w-[480px] mx-auto">
      <div className="bg-[#1A1A1A] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-[#FFD700] font-bold text-xl">EGG LAUNCHER</h1>
          <p className="text-[#888] text-xs">the living launchpad on TON</p>
        </div>
        <div className="text-right">
          <p className="text-[#F5A623] text-xs font-bold">500 TON</p>
          <p className="text-[#888] text-xs">to graduate</p>
        </div>
      </div>

      <div className="pb-20">
        {tab === 'trending'  && <TrendingTab />}
        {tab === 'launch'    && <LaunchTab />}
        {tab === 'portfolio' && <PortfolioTab />}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#1A1A1A] border-t border-[#2A2A2A] flex">
        {([
          ['trending',  'Trending'],
          ['launch',    'Launch'],
          ['portfolio', 'Portfolio'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-3 text-xs transition-colors ${tab === id ? 'text-[#FFD700]' : 'text-[#888]'}`}>
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}
