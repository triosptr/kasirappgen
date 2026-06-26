"use client";

import { useMemo, useState } from 'react';

const IDR = (n: number) => 'Rp' + (n || 0).toLocaleString('id-ID');

type Props = {
  settings: any;
  technicians: any[];
  transactions: any[];
};

export default function Teknisi({ settings, technicians, transactions }: Props) {
  const [range, setRange] = useState<'7' | '30'>('7');
  const days = parseInt(range, 10);
  const commission = Number(settings?.commission_per_wash || 0);
  const todayKey = new Date().toDateString();

  const techList = useMemo(() => {
    return technicians.map((t: any) => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));
      const inRange = transactions.filter(
        (tx: any) =>
          String(tx.technician_id) === String(t.id) &&
          new Date(tx.created_at) >= start &&
          tx.status === 'selesai'
      );
      const todayTx = transactions.filter(
        (tx: any) =>
          String(tx.technician_id) === String(t.id) &&
          new Date(tx.created_at).toDateString() === todayKey &&
          tx.status === 'selesai'
      );
      const ratings = inRange
        .map((x: any) => Number(x.cleanliness_rating || 0))
        .filter((n: number) => n > 0);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      return {
        ...t,
        todayCount: todayTx.length,
        periodCount: inRange.length,
        rating: avg.toFixed(1),
        commission: inRange.length * commission,
      };
    });
  }, [technicians, transactions, days, commission, todayKey]);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const rangeLabel = `${start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} – ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`;

  const totalCommission = techList.reduce((s: number, t: any) => s + t.commission, 0);
  const totalMotors = techList.reduce((s: number, t: any) => s + t.periodCount, 0);
  const presentCount = techList.filter((t: any) => t.present).length;

  return (
    <div className="animate-up flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] sm:text-[28px] tracking-tight">Data Teknisi</h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-brand-ink2 mt-1">Kinerja tim, history & komisi.</p>
        </div>
        <div className="flex bg-white border border-brand-border rounded-xl p-1">
          {(['7', '30'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`focus-ring h-9 px-3 sm:px-4 rounded-lg text-[12px] font-bold transition ${
                range === r ? 'bg-brand-primary text-white' : 'text-brand-ink2'
              }`}
            >
              {r === '7' ? '7 Hari' : '1 Bulan'}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon="engineering" color="#1535D4" bg="#E7ECFD" label="Teknisi Hadir" value={`${presentCount}/${technicians.length}`} />
        <Kpi icon="two_wheeler" color="#7FA000" bg="#F2FBC9" label="Motor Dicuci" value={`${totalMotors}`} sub={rangeLabel} />
        <Kpi icon="payments" color="#C68A00" bg="#FFF4D6" label="Total Komisi" value={IDR(totalCommission)} sub={`@ ${IDR(commission)}/cuci`} />
        <Kpi icon="star" color="#E8A400" bg="#FFF6DC" label="Avg Rating" value={(techList.reduce((s: number, t: any) => s + Number(t.rating || 0), 0) / Math.max(1, techList.length)).toFixed(1) || '—'} />
      </section>

      <section className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1.6fr_1fr_1fr_1.2fr_1fr] gap-2.5 px-4 py-3 bg-[#FAFBFC] border-b border-brand-border text-[11px] font-bold uppercase tracking-wider text-brand-ink2">
          <span>Teknisi</span>
          <span className="text-center">Hari Ini</span>
          <span className="text-center">Periode</span>
          <span className="text-center">Rating</span>
          <span className="text-right">Komisi</span>
        </div>

        <ul>
          {techList.map((t: any) => {
            const initials = t.name
              .split(' ')
              .map((w: string) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <li
                key={t.id}
                className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr_1.2fr_1fr] items-center gap-2.5 px-4 py-3.5 border-b border-brand-border last:border-b-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-[13.5px] ${
                        t.present ? 'bg-[#171a22] text-brand-lime' : 'bg-[#EDEFF2] text-brand-ink2'
                      }`}
                    >
                      {initials}
                    </div>
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        t.present ? 'bg-[#3FBF6A]' : 'bg-[#C9CCD2]'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[13.5px] truncate">{t.name}</div>
                    <div className={`text-[11px] font-semibold ${t.present ? 'text-[#3FBF6A]' : 'text-brand-ink2'}`}>
                      {t.present ? 'Hadir' : 'Tidak hadir'}
                    </div>
                  </div>
                </div>
                <div className="text-center font-display font-bold text-[15px]">{t.todayCount}</div>
                <div className="text-center text-[13px] text-brand-muted font-semibold">{t.periodCount}</div>
                <div className="flex items-center justify-center gap-1 text-brand-star">
                  <span className="msr text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-display font-bold text-[14px] text-brand-ink">{t.rating}</span>
                </div>
                <div className="text-right font-display font-bold text-[14px] text-brand-primary">
                  {IDR(t.commission)}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="text-[11.5px] text-brand-ink2 flex items-center gap-1.5">
        <span className="msr text-[16px]">info</span>
        Rating & komisi dihitung otomatis dari transaksi selesai pada rentang tanggal.
      </div>
    </div>
  );
}

function Kpi({ icon, color, bg, label, value, sub }: any) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
          <span className="msr text-[20px]" style={{ color }}>{icon}</span>
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-ink2">{label}</span>
      </div>
      <div className="mt-2 font-display font-bold text-[20px] sm:text-[22px] leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-brand-ink2 mt-1">{sub}</div>}
    </div>
  );
}