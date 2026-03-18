'use client';
import { useState, useRef } from 'react';
import { uploadImage, reserveLaunch } from '@/lib/api';

type Step = 'form' | 'pay' | 'done';

export default function LaunchTab() {
  const [step, setStep]         = useState<Step>('form');
  const [loading, setLoading]   = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview]   = useState('');
  const [payInfo, setPayInfo]   = useState<{ ticker: string; payment_address: string; comment: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', ticker: '', description: '', dex_choice: 'dedust',
  });

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    const url = await uploadImage(file);
    setImageUrl(url);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.ticker || !imageUrl) return;
    setLoading(true);
    const r = await reserveLaunch({ ...form, image_url: imageUrl });
    if (r.ok) {
      setPayInfo(r);
      setStep('pay');
    }
    setLoading(false);
  };

  if (step === 'pay' && payInfo) return (
    <div className="p-4 space-y-4">
      <div className="bg-[#1A1A1A] rounded-xl p-5 border border-[#FFD700]/30">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🥚</div>
          <h2 className="text-[#FFD700] font-bold text-lg">${payInfo.ticker} reserved!</h2>
          <p className="text-[#888] text-sm mt-1">Send 1 TON to launch</p>
        </div>
        <div className="space-y-3">
          <div className="bg-[#0D0D0D] rounded-lg p-3">
            <p className="text-[#666] text-xs mb-1">Send to</p>
            <p className="text-white text-xs font-mono break-all">{payInfo.payment_address}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-lg p-3">
            <p className="text-[#666] text-xs mb-1">Comment (required!)</p>
            <p className="text-[#FFD700] font-mono font-bold">{payInfo.comment}</p>
          </div>
          <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3 text-xs text-[#F5A623]">
            ⚡ Include the comment exactly. Your token will deploy automatically within 60 seconds of payment.
          </div>
        </div>
        <button
          onClick={() => setStep('done')}
          className="w-full mt-4 py-3 bg-[#FFD700] text-black font-bold rounded-xl"
        >
          I sent the payment ✓
        </button>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🐣</div>
      <h2 className="text-[#FFD700] font-bold text-xl mb-2">Hatching...</h2>
      <p className="text-[#888] text-sm">Your token is being deployed on-chain.</p>
      <p className="text-[#555] text-xs mt-2">Check back in ~60 seconds.</p>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] space-y-4">
        <h2 className="text-[#FFD700] font-bold text-lg">🚀 Launch a Token</h2>
        <p className="text-[#666] text-xs">1 TON launch fee · 0.2% creator fees forever</p>

        {/* Image upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#2A2A2A] rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700]/50 transition-colors"
        >
          {preview
            ? <img src={preview} className="h-full w-full object-cover rounded-xl" alt="" />
            : <><div className="text-3xl">🖼️</div><p className="text-[#666] text-xs mt-1">Tap to upload image</p></>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

        {/* Fields */}
        {[
          { key: 'name',   label: 'Token Name',   placeholder: 'Pepe the Egg' },
          { key: 'ticker', label: 'Ticker',        placeholder: 'PEPE' },
          { key: 'description', label: 'Description', placeholder: 'The most based egg on TON' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-[#888] text-xs mb-1 block">{label}</label>
            <input
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#FFD700]/50 outline-none"
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: key === 'ticker' ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8) : e.target.value }))}
            />
          </div>
        ))}

        {/* DEX choice */}
        <div>
          <label className="text-[#888] text-xs mb-1 block">Graduate to</label>
          <div className="flex gap-2">
            {['dedust', 'stonfi'].map(dex => (
              <button
                key={dex}
                onClick={() => setForm(f => ({ ...f, dex_choice: dex }))}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  form.dex_choice === dex
                    ? 'border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10'
                    : 'border-[#2A2A2A] text-[#666]'
                }`}
              >
                {dex === 'dedust' ? '🌀 DeDust' : '🪨 STON.fi'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.ticker || !imageUrl}
          className="w-full py-3 bg-[#FFD700] text-black font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? '...' : '🥚 Launch Token — 1 TON'}
        </button>
      </div>
    </div>
  );
}
