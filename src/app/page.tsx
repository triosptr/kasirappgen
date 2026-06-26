"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import Login from '@/components/Login';
import Shell from '@/components/Shell';
import Dashboard from '@/components/Dashboard';
import Transaksi from '@/components/Transaksi';
import Teknisi from '@/components/Teknisi';
import Pendapatan from '@/components/Pendapatan';
import Pelanggan from '@/components/Pelanggan';
import Setting from '@/components/Setting';
import Toast from '@/components/Toast';

export default function POSApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState('dashboard');
  const [todayLabel, setTodayLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'error' | 'info' }>({ msg: '', kind: 'success' });

  // Data states
  const [settings, setSettings] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    setTodayLabel(format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id }));
  }, []);

  const fetchData = useCallback(async () => {
    setFatalError(null);
    setIsLoading(true);
    const [settsRes, svcsRes, techsRes, custsRes, txsRes] = await Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('services').select('*').order('price'),
      supabase.from('technicians').select('*'),
      supabase.from('gen_customers').select('*'),
      supabase.from('transactions').select('*'),
    ]);
    const err = settsRes.error || svcsRes.error || techsRes.error || custsRes.error || txsRes.error;
    if (err) {
      setFatalError(err.message);
      setIsLoading(false);
      return;
    }
    if (settsRes.data) setSettings(settsRes.data);
    if (svcsRes.data) setServices(svcsRes.data);
    if (techsRes.data) setTechnicians(techsRes.data);
    if (custsRes.data) setCustomers(custsRes.data);
    if (txsRes.data) setTransactions(txsRes.data);
    setIsLoading(false);
  }, []);

  const showToast = useCallback((msg: string, kind: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, kind });
  }, []);

  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ msg: '', kind: 'success' }), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogin = () => {
    setLoggedIn(true);
    setScreen('dashboard');
    fetchData();
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const ctx = {
    screen,
    settings,
    services,
    technicians,
    customers,
    transactions,
    showToast,
    refreshData: fetchData,
  };

  return (
    <Shell screen={screen} setScreen={setScreen} todayLabel={todayLabel} onLogout={() => setLoggedIn(false)}>
      {fatalError && (
        <div className="bg-white border border-[#F0A9A9] rounded-2xl p-4 mb-4 flex items-start gap-3">
          <span className="msr text-2xl text-[#D62828]">error</span>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm">Gagal memuat data</div>
            <div className="text-xs text-brand-ink2 mt-1 break-words">{fatalError}</div>
            <button onClick={fetchData} className="focus-ring mt-3 h-10 px-4 rounded-xl border border-brand-border bg-white font-bold text-xs">
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {isLoading && !fatalError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="bg-white border border-brand-border rounded-2xl p-5 animate-pulse">
            <div className="h-5 w-44 bg-[#EDEFF2] rounded mb-4" />
            <div className="h-10 w-3/4 bg-[#EDEFF2] rounded mb-3" />
            <div className="h-10 w-2/3 bg-[#EDEFF2] rounded" />
          </div>
          <div className="bg-white border border-brand-border rounded-2xl p-5 animate-pulse">
            <div className="h-5 w-40 bg-[#EDEFF2] rounded mb-4" />
            <div className="h-24 w-full bg-[#EDEFF2] rounded mb-3" />
            <div className="h-24 w-full bg-[#EDEFF2] rounded" />
          </div>
        </div>
      )}

      {!isLoading && !fatalError && (
        <>
          {screen === 'dashboard' && <Dashboard {...ctx} />}
          {screen === 'transaksi' && <Transaksi {...ctx} />}
          {screen === 'teknisi' && <Teknisi {...ctx} />}
          {screen === 'pendapatan' && <Pendapatan {...ctx} />}
          {screen === 'pelanggan' && <Pelanggan {...ctx} />}
          {screen === 'setting' && <Setting {...ctx} />}
        </>
      )}

      <Toast toast={toast} />
    </Shell>
  );
}