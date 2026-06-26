"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import Dashboard from '@/components/Dashboard';
import Transaksi from '@/components/Transaksi';
import Teknisi from '@/components/Teknisi';
import Pendapatan from '@/components/Pendapatan';
import Pelanggan from '@/components/Pelanggan';
import Setting from '@/components/Setting';

export default function POSApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [screen, setScreen] = useState('dashboard');
  const [toast, setToast] = useState('');
  const [todayLabel, setTodayLabel] = useState('');

  // Data states
  const [settings, setSettings] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    setTodayLabel(format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id }));
    fetchData();
  }, []);

  const fetchData = async () => {
    const [
      { data: setts },
      { data: svcs },
      { data: techs },
      { data: custs },
      { data: txs }
    ] = await Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('services').select('*'),
      supabase.from('technicians').select('*'),
      supabase.from('gen_customers').select('*'),
      supabase.from('transactions').select('*')
    ]);

    if (setts) setSettings(setts);
    if (svcs) setServices(svcs);
    if (techs) setTechnicians(techs);
    if (custs) setCustomers(custs);
    if (txs) setTransactions(txs);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const doLogin = () => {
    setLoggedIn(true);
    setLoginError('');
    setScreen('dashboard');
  };

  const doLogout = () => {
    setLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  if (!loggedIn) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0a1230]">
        <div className="absolute inset-0 bg-[url('/assets/soap-bubbles.png')] bg-cover bg-center scale-105" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(8,16,42,.55)] via-[rgba(8,16,42,.82)] to-[rgba(8,14,36,.96)]" />
        <div
          className="absolute bottom-[9%] left-[8%] w-[60px] h-[60px] rounded-full blur-[0.4px]"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, rgba(255,255,255,.8), rgba(200,244,0,.15))',
            animation: 'genBub 5.5s ease-in infinite',
          }}
        />
        <div
          className="absolute bottom-[18%] left-[22%] w-[34px] h-[34px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, rgba(255,255,255,.75), rgba(21,53,212,.15))',
            animation: 'genBub 6.8s ease-in .8s infinite',
          }}
        />
        <div
          className="absolute bottom-[12%] right-[14%] w-[46px] h-[46px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, rgba(255,255,255,.8), rgba(200,244,0,.1))',
            animation: 'genBub 6s ease-in 1.6s infinite',
          }}
        />

        <div className="relative w-[min(92vw,420px)] animate-up">
          <div className="flex flex-col items-center mb-[26px]">
            <img
              src="/assets/logo.png"
              alt="GEN Auto Care"
              className="w-[230px] h-auto mb-1.5 drop-shadow-[0_6px_24px_rgba(200,244,0,.35)]"
            />
            <div className="font-display font-medium tracking-[.42em] text-xs text-brand-lime uppercase pl-[.42em]">
              Groom Every Need
            </div>
          </div>

          <div className="bg-[rgba(21,53,212,.46)] backdrop-blur-[20px] border border-white/20 rounded-[26px] px-[26px] py-[30px] shadow-[0_30px_80px_rgba(8,16,42,.5)]">
            <div className="font-display font-bold text-[22px] text-white mb-1">
              Masuk Kasir
            </div>
            <div className="text-[13px] text-white/55 mb-6">
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
                className="flex-1 border-none bg-transparent text-white text-[15px] h-full focus:outline-none"
              />
            </div>

            <label className="block text-[11.5px] font-semibold tracking-wider text-white/60 uppercase mb-2">
              Password
            </label>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/15 rounded-[14px] px-3.5 mb-2 h-[50px]">
              <span className="msr text-[20px] text-white/45">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 border-none bg-transparent text-white text-[15px] h-full focus:outline-none"
              />
            </div>

            {!!loginError && (
              <div className="flex items-center gap-1.5 text-[#ff8a8a] text-[12.5px] mb-2">
                <span className="msr text-[16px]">error</span>
                {loginError}
              </div>
            )}

            <button
              onClick={doLogin}
              className="relative overflow-hidden w-full h-[54px] mt-3.5 border-none rounded-[14px] bg-brand-lime text-brand-mutedDark font-display font-bold text-[16px] tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(200,244,0,.3)]"
            >
              Masuk
              <span className="msr text-[20px]">arrow_forward</span>
              <span
                className="absolute top-0 left-0 w-[35%] h-full"
                style={{
                  background:
                    'linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent)',
                  animation: 'genSheen 3.4s ease-in-out infinite',
                }}
              />
            </button>
            <div className="text-center text-[12px] text-white/35 mt-4">
              Demo: tekan Masuk untuk lanjut
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1160px] mx-auto pb-[120px]">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-brand-primary border-b border-brand-dark">
        <div className="flex items-center gap-3.5 py-3.5 px-[clamp(16px,3vw,28px)]">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="GEN Auto Care" className="h-[64px] w-auto object-contain" />
            <div className="border-l border-white/20 pl-3">
              <div className="font-display font-bold text-[16px] leading-none tracking-tight text-white">GEN Auto Care</div>
              <div className="text-[11px] text-white/70 mt-1 tracking-wide">{todayLabel}</div>
            </div>
          </div>
          <div className="flex-1" />
          <button 
            onClick={() => setScreen('setting')} 
            className="w-[42px] h-[42px] rounded-xl border border-brand-border bg-white cursor-pointer flex items-center justify-center text-brand-muted"
          >
            <span className="msr text-[22px]">settings</span>
          </button>
          <div className="flex items-center gap-2 bg-white border border-brand-border rounded-xl p-1.5 pr-3 h-[42px]">
            <div className="w-[30px] h-[30px] rounded-lg bg-brand-primary text-white flex items-center justify-center font-display font-bold text-[13px]">
              KA
            </div>
            <div className="leading-tight">
              <div className="text-[12.5px] font-bold">Kasir A</div>
              <div className="text-[10.5px] text-brand-ink2">Shift Pagi</div>
            </div>
            <button
              onClick={doLogout}
              title="Keluar"
              className="ml-1 border-none bg-transparent cursor-pointer text-[#B0B4BC] flex items-center"
            >
              <span className="msr text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-[clamp(16px,3vw,28px)] pt-[clamp(16px,3vw,26px)]">
        {screen === 'dashboard' && <Dashboard screen={screen} transactions={transactions} technicians={technicians} services={services} settings={settings} showToast={showToast} refreshData={fetchData} />}
        {screen === 'transaksi' && <Transaksi screen={screen} customers={customers} technicians={technicians} services={services} settings={settings} showToast={showToast} refreshData={fetchData} />}
        {screen === 'teknisi' && <Teknisi screen={screen} technicians={technicians} transactions={transactions} settings={settings} />}
        {screen === 'pendapatan' && <Pendapatan screen={screen} transactions={transactions} technicians={technicians} settings={settings} showToast={showToast} />}
        {screen === 'pelanggan' && <Pelanggan screen={screen} customers={customers} services={services} settings={settings} showToast={showToast} refreshData={fetchData} />}
        {screen === 'setting' && <Setting screen={screen} settings={settings} services={services} showToast={showToast} refreshData={fetchData} />}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed left-0 right-0 bottom-0 z-50 flex justify-center px-4 pb-[18px] pointer-events-none">
        <div className="pointer-events-auto flex gap-1 bg-brand-primary border border-white/15 rounded-[22px] p-1.5 shadow-[0_18px_44px_rgba(21,53,212,.34)]">
          {[
            { id: 'dashboard', icon: 'space_dashboard', label: 'Dashboard' },
            { id: 'transaksi', icon: 'point_of_sale', label: 'Transaksi' },
            { id: 'pendapatan', icon: 'monitoring', label: 'Pendapatan' },
            { id: 'pelanggan', icon: 'group', label: 'Pelanggan' },
            { id: 'teknisi', icon: 'engineering', label: 'Teknisi' },
          ].map(n => (
            <button 
              key={n.id} 
              onClick={() => { setScreen(n.id); window.scrollTo({top: 0}); }}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[62px] px-2.5 py-2 border-none cursor-pointer rounded-2xl transition-all duration-200 ${screen === n.id ? 'bg-brand-lime' : 'bg-transparent'}`}
            >
              <span 
                className="msr" 
                style={{ 
                  fontSize: '23px', 
                  color: screen === n.id ? '#171a12' : 'rgba(255,255,255,.72)',
                  fontVariationSettings: screen === n.id ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                {n.icon}
              </span>
              <span className={`text-[10.5px] font-bold ${screen === n.id ? 'text-[#171a12]' : 'text-white/60'}`}>
                {n.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed left-1/2 bottom-[96px] -translate-x-1/2 z-[80] bg-brand-mutedDark text-white px-4 py-3 rounded-xl text-[13.5px] font-semibold shadow-[0_14px_34px_rgba(0,0,0,.3)] flex items-center gap-2 animate-up">
          <span className="msr text-[18px] text-brand-lime">check_circle</span>
          {toast}
        </div>
      )}
    </div>
  );
}
