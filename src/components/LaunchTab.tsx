'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Step = 'form' | 'dex' | 'pay' | 'done';

export default function LaunchTab() {
  const [step, setStep]         = useState<Step>('form');
  const [name, setName]         = useState('');
  const [ticker, setTicker]     = useState('');
  const [desc, setDesc]         = useState('');
  const [image, setImage]       = useState<File | null>(null);
  const [preview, setPreview]   = useState('');
  const [dex, setDex]           = useState<'dedust' | 'stonfi'>('dedust');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
  const username = tg?.initDataUnsafe?.user?.username || '';

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!name || !ticker || !desc || !image) {
      setError('Fill in all fields');
      return;
    }

    // Validate ticker matches username
    if (username) {
      const base = username.split('_')[0].toUpperCase();
      if (ticker.toUpperCase() !== base && ticker.toUpperCase() !== username.toUpperCase()) {
        setError(`@${username} can only launch $${base} or $${username.toUpperCase()}`);
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      // Upload image
      const form = new FormData();
      form.append('file', image);
      const r = await fetch(`${API}/api/launch/upload`, { method: 'POST', body: form });
      if (!r.ok) throw new Error('Image upload failed');
      const { image_url } = await r.json();

      // Reserve ticker
      const r2 = await fetch(`${API}/api/launch/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, ticker: ticker.toUpperCase(), description: desc,
          image_url, dex_choice: dex,
          tg_id: tg?.initDataUnsafe?.user?.id,
          tg_username: username,
        }),
      });
      if (!r2.ok) throw new Error((await r2.json()).error || 'Failed');

      setStep('pay');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'pay') {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-[#1A1A1A] rounded-xl p-5 text-center">
          <p className="text-4xl mb-3">🥚</p>
          <h2 className="text-[#FFD700] font-bold text-xl mb-1">Almost there</h2>
          <p className="text-[#888] text-sm mb-4">Send <span className="text-white font-bold">1.2 TON</span> to deploy ${ticker.toUpperCase()}</p>
          <div className="bg-[#2A2A2A] rounded-lg p-3 mb-3">
            <p className="text-xs text-[#888] mb-1">Send to:</p>
            <p className="text-[#F5A623] text-xs font-mono break-all">UQCPMM8-ORuo7XVypJdcKQe5Cg_rLTjD09SyxKvyYSKoeRuc</p>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-3 mb-4">
            <p className="text-xs text-[#888] mb-1">With comment:</p>
            <p className="text-[#F5A623] font-mono font-bold">LAUNCH_{ticker.toUpperCase()}</p>
          </div>
          <p className="text-[#888] text-xs">egg will deploy your token automatically after payment is detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[#1A1A1A] rounded-xl p-4">
        <h2 className="text-[#FFD700] font-bold mb-1">🚀 Launch Your Token</h2>
        <p className="text-[#888] text-xs">1 TON fee · 0.2% of every trade back to you · graduate at 500 TON</p>
      </div>

      {username && (
        <div className="bg-[#1F1A00] rounded-xl p-3 text-xs text-[#F5A623]">
          🔒 @{username} → you can launch <strong>${username.split('_')[0].toUpperCase()}</strong>
        </div>
      )}

      {/* Image upload */}
      <label className="block">
        <div className="bg-[#1A1A1A] rounded-xl h-32 flex items-center justify-center cursor-pointer border-2 border-dashed border-[#2A2A2A] hover:border-[#F5A623] transition-colors overflow-hidden">
          {preview
            ? <img src={preview} className="h-full w-full object-cover rounded-xl" />
            : <div className="text-center text-[#888]"><p className="text-3xl">📷</p><p className="text-xs mt-1">Upload token image</p></div>
          }
        </div>
        <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
      </label>

      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="Token name"
        maxLength={32}
        className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#F5A623] placeholder-[#555]"
      />

      <input
        value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
        placeholder="TICKER (max 8)"
        maxLength={8}
        className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-1 focus:ring-[#F5A623] placeholder-[#555]"
      />

      <textarea
        value={desc} onChange={e => setDesc(e.target.value)}
        placeholder="Short description (max 100 chars)"
        maxLength={100}
        rows={2}
        className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#F5A623] placeholder-[#555] resize-none"
      />

      {/* DEX choice */}
      <div>
        <p className="text-xs text-[#888] mb-2">Graduation DEX:</p>
        <div className="flex gap-2">
          {(['dedust', 'stonfi'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDex(d)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                dex === d ? 'bg-[#F5A623] text-black' : 'bg-[#1A1A1A] text-[#888]'
              }`}
            >
              {d === 'dedust' ? '💧 DeDust' : '⚡ STON.fi'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-[#F5A623] text-black font-bold text-base disabled:opacity-50 active:bg-[#FFD700]"
      >
        {loading ? '🥚 preparing...' : '🚀 Launch Token — 1 TON'}
      </button>

      <p className="text-[#555] text-xs text-center">
        egg takes 1% of supply · your earnings: 0.2% of all trades forever
      </p>
    </div>
  );
}
