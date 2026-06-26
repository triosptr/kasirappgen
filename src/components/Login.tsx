"use client";

import { useState } from 'react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password) {
      setErr('Username dan password wajib diisi');
      return;
    }
    setErr('');
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onLogin();
    }, 350);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a1230]">
      {/* Background soap bubbles image */}
      <div
        className="absolute inset-0 bg-[url('/assets/soap-bubbles.png')] bg-cover bg-center"
        style={{ filter: 'saturate(1.05) contrast(1.05)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(8,16,42,.55)] via-[rgba(8,16,42,.82)] to-[rgba(8,14,36,.96)]" />

      {/* Floating bubbles animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { l: '6%', b: '8%', size: 60, dur: '5.5s', tint: 'rgba(200,244,0,.15)' },
          { l: '22%', b: '18%', size: 34, dur: '6.8s', tint: 'rgba(21,53,212,.15)', delay: '.8s' },
          { l: '84%', b: '12%', size: 46, dur: '6s', tint: 'rgba(200,244,0,.1)', delay: '1.6s' },
          { l: '70%', b: '62%', size: 22, dur: '7.4s', tint: 'rgba(255,255,255,.6)', delay: '2.1s' },
          { l: '12%', b: '70%', size: 28, dur: '8s', tint: 'rgba(255,255,255,.5)', delay: '3.2s' },
          { l: '50%', b: '5%', size: 18, dur: '7s', tint: 'rgba(255,255,255,.55)', delay: '4s' },
        ].map((b, i) => (
          <span
            key={i}
            className="absolute rounded-full blur-[0.4px]"
            style={{
              left: b.l,
              bottom: b.b,
              width: `${b.size}px`,
              height: `${b.size}px`,
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,.85), ${b.tint})`,
              animation: `genBub ${b.dur} ease-in ${b.delay || '0s'} infinite`,
            }}
          />
        ))}
      </div>

      {/* Center card */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-[420px] animate-up flex flex-col items-center">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center mb-7 animate-float">
            <img
              src="/assets/logo.png"
              alt="GEN Auto Care"
              className="w-[230px] sm:w-[260px] h-auto drop-shadow-[0_8px_30px_rgba(200,244,0,.35)]"
            />
            <div className="mt-3 font-display font-medium tracking-[.42em] text-[11.5px] sm:text-xs text-brand-lime uppercase pl-[.42em]">
              Groom Every Need
            </div>
          </div>

          {/* Login card */}
          <div className="w-full bg-[rgba(21,53,212,.46)] backdrop-blur-[20px] border border-white/20 rounded-[26px] px-6 sm:px-7 py-7 sm:py-8 shadow-[0_30px_80px_rgba(8,16,42,.5)]">
            <div className="font-display font-bold text-[22px] text-white mb-1">Masuk Kasir</div>
            <div className="text-[13px] text-white/55 mb-5 sm:mb-6">
              Silakan masuk untuk memulai shift hari ini.
            </div>

            <label className="block text-[11.5px] font-semibold tracking-wider text-white/60 uppercase mb-2">
              Username
            </label>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/15 rounded-[14px] px-3.5 mb-4 h-[50px]">
              <span className="msr text-[20px] text-white/45">person</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="focus-ring flex-1 border-none bg-transparent text-white text-[15px] h-full placeholder:text-white/30"
              />
            </div>

            <label className="block text-[11.5px] font-semibold tracking-wider text-white/60 uppercase mb-2">
              Password
            </label>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/15 rounded-[14px] px-3.5 mb-2 h-[50px]">
              <span className="msr text-[20px] text-white/45">lock</span>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="focus-ring flex-1 border-none bg-transparent text-white text-[15px] h-full placeholder:text-white/30"
              />
              <button
                type="button"
                aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
                onClick={() => setShowPwd((v) => !v)}
                className="focus-ring border-none bg-transparent cursor-pointer text-white/50"
              >
                <span className="msr text-[20px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>

            {!!err && (
              <div className="flex items-center gap-1.5 text-[#ffb4b4] text-[12.5px] mb-1 mt-1">
                <span className="msr text-[16px]">error</span>
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="focus-ring relative overflow-hidden w-full h-[54px] mt-4 border-none rounded-[14px] bg-brand-lime text-brand-mutedDark font-display font-bold text-[16px] tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(200,244,0,.3)] disabled:opacity-70"
            >
              {busy ? (
                <span className="msr text-[20px] animate-spin">progress_activity</span>
              ) : (
                <>
                  Masuk
                  <span className="msr text-[20px]">arrow_forward</span>
                </>
              )}
              <span
                className="absolute top-0 left-0 w-[35%] h-full pointer-events-none"
                style={{
                  background:
                    'linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent)',
                  animation: 'genSheen 3.4s ease-in-out infinite',
                }}
              />
            </button>
            <div className="text-center text-[12px] text-white/35 mt-4">Demo: tekan Masuk untuk lanjut</div>
          </div>

          <div className="mt-6 text-center text-[11px] text-white/35 tracking-widest uppercase">
            © {new Date().getFullYear()} GEN Auto Care
          </div>
        </form>
      </div>
    </div>
  );
}