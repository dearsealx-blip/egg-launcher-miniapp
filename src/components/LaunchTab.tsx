'use client';
import { useState, useRef, useEffect } from 'react';
import { uploadImage, reserveLaunch, fetchTokens } from '@/lib/api';

type Step = 'form' | 'pay' | 'done';

export default function LaunchTab() {
  const [step, setStep]       = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [payInfo, setPayInfo] = useState<{ ticker: string; payment_address: string; comment: string } | null>(null);
  const [deployed, setDeployed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<any>(null);

  const [form, setForm] = useState({ name: '', ticker: '', description: '', dex_choice: 'dedust' });

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch { alert('Image upload failed. Try again.'); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.ticker || !imageUrl) return;
    setLoading(true);
    try {
      const tg = (window as any).Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      const r = await reserveLaunch({
        ...form,
        image_url: imageUrl,
        creator_tg_id: user?.id,
        tg_username: user?.username || '',
      });
      if (r.ok) { setPayInfo(r); setStep('pay'); }
      else alert(r.error || 'Failed to reserve');
    } catch { alert('Network error. Try again.'); }
    setLoading(false);
  };

  // Poll for deployment after payment
  useEffect(() => {
    if (step !== 'pay' || !payInfo) return;
    pollRef.current = setInterval(async () => {
      try {
        const tokens = await fetchTokens();
        const found = tokens.find((t: any) => t.ticker === payInfo.ticker);
        if (found?.curve_address) {
          setDeployed(true);
          setStep('done');
          clearInterval(pollRef.current);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [step, payInfo]);

  if (step === 'pay' && payInfo) {
    const nanotons = 1_000_000_000;
    const payLink = `ton://transfer/${payInfo.payment_address}?amount=${nanotons}&text=${payInfo.comment}`;

    return (
      <div className="p-4 space-y-4">
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#FFD700]/30 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🥚</div>
            <h2 className="text-[#FFD700] font-bold text-xl">${payInfo.ticker} reserved!</h2>
            <p className="text-[#888] text-sm mt-1">Send 1 TON to launch your token</p>
          </div>

          {/* One-tap pay button */}
          <a
            href={payLink}
            className="block w-full text-center bg-[#FFD700] text-black font-bold py-4 rounded-xl text-lg"
          >
            Pay 1 TON with Tonkeeper
          </a>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-[#2A2A2A]"></div>
            <span className="px-3 text-[#555] text-xs">or pay manually</span>
            <div className="flex-grow border-t border-[#2A2A2A]"></div>
          </div>

          <div className="space-y-2">
            <div className="bg-[#0D0D0D] rounded-xl p-3">
              <p className="text-[#666] text-xs mb-1">Send to this address</p>
              <p className="text-white text-xs font-mono break-all">{payInfo.payment_address}</p>
            </div>
            <div className="bg-[#0D0D0D] rounded-xl p-3">
              <p className="text-[#666] text-xs mb-1">Comment — include exactly!</p>
              <p className="text-[#FFD700] font-mono font-bold text-lg">{payInfo.comment}</p>
            </div>
          </div>

          <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-xl p-3 text-xs text-[#F5A623]">
            Your token deploys automatically within 60s of payment. This page will update when it is live.
          </div>

          <div className="flex items-center justify-center gap-2 text-[#555] text-xs">
            <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse"></div>
            Waiting for payment...
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="text-7xl">🐣</div>
      <h2 className="text-[#FFD700] font-bold text-2xl">
        {deployed ? `$${payInfo?.ticker} is live!` : 'Hatching...'}
      </h2>
      <p className="text-[#888] text-sm">
        {deployed ? 'Your token is live on the bonding curve. Go buy some!' : 'Your token is being deployed on-chain. Check Trending in ~60 seconds.'}
      </p>
      {deployed && (
        <button
          onClick={() => { setStep('form'); setForm({ name:'', ticker:'', description:'', dex_choice:'dedust' }); setImageUrl(''); setPreview(''); }}
          className="bg-[#FFD700] text-black font-bold px-8 py-3 rounded-xl"
        >
          Launch another token
        </button>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] space-y-4">
        <div>
          <h2 className="text-[#FFD700] font-bold text-lg">Launch a Token</h2>
          <p className="text-[#666] text-xs">1 TON launch fee &middot; 0.2% creator fees forever</p>
        </div>

        {/* Image */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#2A2A2A] rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700]/50 transition-colors overflow-hidden"
        >
          {preview
            ? <img src={preview} className="h-full w-full object-cover" alt="" />
            : <div className="text-center"><div className="text-3xl">+</div><p className="text-[#666] text-xs mt-1">Tap to upload image</p></div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        {loading && !imageUrl && <p className="text-[#888] text-xs text-center">Uploading to IPFS...</p>}
        {imageUrl && <p className="text-green-500 text-xs text-center">Image uploaded</p>}

        {/* Fields */}
        {([
          ['name',        'Token Name',   'Pepe the Egg'],
          ['ticker',      'Ticker (max 8)', 'PEPE'],
          ['description', 'Description',  'The most based egg on TON'],
        ] as const).map(([key, label, placeholder]) => (
          <div key={key}>
            <label className="text-[#888] text-xs mb-1 block">{label}</label>
            <input
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#FFD700]/50 outline-none"
              placeholder={placeholder}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: key === 'ticker' ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8) : e.target.value }))}
            />
          </div>
        ))}

        {/* DEX */}
        <div>
          <label className="text-[#888] text-xs mb-1 block">Graduate to DEX</label>
          <div className="flex gap-2">
            {(['dedust', 'stonfi'] as const).map(dex => (
              <button
                key={dex}
                onClick={() => setForm(f => ({ ...f, dex_choice: dex }))}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  form.dex_choice === dex ? 'border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10' : 'border-[#2A2A2A] text-[#666]'
                }`}
              >
                {dex === 'dedust' ? 'DeDust' : 'STON.fi'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.ticker || !imageUrl}
          className="w-full py-3.5 bg-[#FFD700] text-black font-bold rounded-xl disabled:opacity-40 text-base"
        >
          {loading ? 'Preparing...' : 'Launch Token — 1 TON'}
        </button>
      </div>
    </div>
  );
}
