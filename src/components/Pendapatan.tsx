"use client";

import { useMemo, useState } from 'react';

function isoDateDaysAgo(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function sameDay(aIso?: string, dayIso?: string) {
  if (!aIso || !dayIso) return false;
  return aIso.slice(0, 10) === dayIso;
}

function rp(n: number) {
  return `Rp${Math.round(n || 0).toLocaleString('id-ID')}`;
}

export default function Pendapatan({ transactions, technicians, settings, showToast }: any) {
  const [range, setRange] = useState('7');

  const days = useMemo(() => {
    const n = range === '7' ? 7 : 30;
    return Array.from({ length: n }).map((_, i) => isoDateDaysAgo(n - 1 - i));
  }, [range]);

  const revSeries = useMemo(() => {
    const done = (transactions || []).filter((t: any) => t.status === 'selesai');
    return days.map((d) => {
      const dayTxs = done.filter((t: any) => sameDay(t.created_at, d));
      return dayTxs.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
    });
  }, [transactions, days]);

  const revMax = useMemo(() => Math.max(1, ...revSeries), [revSeries]);

  const gross = useMemo(() => revSeries.reduce((a, b) => a + b, 0), [revSeries]);

  const perWash = settings?.commission_per_wash || 7000;

  const doneInRange = useMemo(() => {
    const done = (transactions || []).filter((t: any) => t.status === 'selesai');
    const set = new Set(days);
    return done.filter((t: any) => set.has(String(t.created_at).slice(0, 10)));
  }, [transactions, days]);

  const totalComm = useMemo(() => {
    const washed = doneInRange.length;
    return washed * perWash;
  }, [doneInRange, perWash]);

  const net = useMemo(() => gross - totalComm, [gross, totalComm]);

  const top3 = useMemo(() => {
    const techName = new Map<string, string>();
    for (const t of technicians || []) techName.set(String(t.id), t.name);
    const m = new Map<string, { washed: number }>();
    for (const t of doneInRange) {
      const k = String(t.technician_id || '');
      if (!k) continue;
      m.set(k, { washed: (m.get(k)?.washed || 0) + 1 });
    }
    const rows = Array.from(m.entries())
      .map(([id, v]) => {
        const comm = v.washed * perWash;
        return { id, washed: v.washed, comm };
      })
      .sort((a, b) => b.comm - a.comm)
      .slice(0, 3);
    const maxComm = Math.max(1, ...rows.map((r) => r.comm));
    const podiumColors = ['#C8F400', '#1535D4', '#373A4A'];
    return rows.map((r, i) => ({
      rank: i + 1,
      name: techName.get(String(r.id)) || `Teknisi #${i + 1}`,
      washed: `${r.washed} motor`,
      commStr: rp(r.comm),
      barW: `${Math.round((r.comm / maxComm) * 100)}%`,
      color: podiumColors[i] || '#C8F400',
    }));
  }, [doneInRange, perWash, technicians]);

  const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const revRangeLabel = useMemo(() => {
    if (!days.length) return '';
    const start = new Date(days[0]);
    const end = new Date(days[days.length - 1]);
    const s = start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const e = end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${s} - ${e} (${days.length} hari)`;
  }, [days]);

  return (
    <div className="animate-up">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="font-display font-bold text-[clamp(24px,3.4vw,32px)] tracking-tight">Pendapatan</div>
          <div className="text-brand-ink2 text-[13.5px] mt-1">{revRangeLabel}</div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex gap-1 bg-[#EBEDF1] border border-[#E2E4E9] p-1 rounded-[12px]">
            <button onClick={() => setRange('7')} className={`border-none cursor-pointer px-4 py-2 rounded-[10px] text-[12.5px] font-bold ${range === '7' ? 'bg-white text-brand-ink shadow-[0_2px_6px_rgba(0,0,0,.08)]' : 'text-brand-ink2'}`}>7 Hari</button>
            <button onClick={() => setRange('30')} className={`border-none cursor-pointer px-4 py-2 rounded-[10px] text-[12.5px] font-bold ${range === '30' ? 'bg-white text-brand-ink shadow-[0_2px_6px_rgba(0,0,0,.08)]' : 'text-brand-ink2'}`}>1 Bulan</button>
          </div>
          <button onClick={() => showToast('Laporan Harian PDF sedang disiapkan…')} className="flex items-center gap-1.5 border border-brand-border bg-white cursor-pointer font-bold text-[12.5px] px-3.5 py-2 rounded-[12px] text-brand-muted">
            <span className="msr text-[18px] text-brand-primary">picture_as_pdf</span>Laporan Harian
          </button>
          <button onClick={() => showToast('Laporan Bulanan PDF sedang disiapkan…')} className="flex items-center gap-1.5 border-none bg-brand-primary text-white cursor-pointer font-bold text-[12.5px] px-3.5 py-2 rounded-[12px]">
            <span className="msr text-[18px] text-brand-lime">picture_as_pdf</span>Laporan Bulanan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px] mb-[14px]">
        <div className="bg-white border border-brand-border rounded-[20px] p-[18px]">
          <div className="text-[12.5px] text-brand-ink2 font-semibold">Pendapatan Kotor</div>
          <div className="font-display font-bold text-[26px] mt-2">{rp(gross)}</div>
        </div>
        <div className="bg-white border border-brand-border rounded-[20px] p-[18px]">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-brand-ink2 font-semibold">Komisi Teknisi</span>
            <span className="text-[11px] text-[#A6AAB2] font-semibold">{rp(perWash)}/cuci</span>
          </div>
          <div className="font-display font-bold text-[26px] mt-2 text-brand-muted">- {rp(totalComm)}</div>
        </div>
        <div className="bg-gradient-to-br from-brand-primary to-brand-dark text-white rounded-[20px] p-[18px]">
          <div className="text-[12.5px] text-white/70 font-semibold">Pendapatan Bersih</div>
          <div className="font-display font-bold text-[26px] mt-2">{rp(net)}</div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[14px] items-start">
        <div className="bg-white border border-brand-border rounded-[20px] p-5">
          <div className="flex items-center justify-between mb-[18px]">
            <span className="font-display font-bold text-[16px]">Grafik Pendapatan</span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-brand-ink2">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-brand-lime" />Hari ini
            </span>
          </div>
          <div className="flex items-end gap-[5px] h-[200px]">
            {revSeries.map((v: number, i: number) => {
              const isLast = i === revSeries.length - 1;
              const label = range === '7' ? dayLabels[i] : ((i + 1) % 5 === 0 || i === 0 ? String(i + 1) : '');
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-[7px] h-full">
                  <div className="flex-1 flex items-end w-full">
                    <div className="w-full min-w-[4px] rounded-t-[5px]" style={{ backgroundColor: isLast ? '#C8F400' : '#1535D4', height: Math.round((v / revMax) * 100) + '%' }} />
                  </div>
                  <span className="text-[10px] text-[#A6AAB2]">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-brand-mutedDark text-white rounded-[20px] p-5">
          <div className="flex items-center gap-2 mb-[18px]">
            <span className="msr text-[20px] text-brand-lime">emoji_events</span>
            <span className="font-display font-bold text-[16px]">Top 3 Teknisi</span>
          </div>
          <div className="flex flex-col gap-4">
            {top3.map((t: any) => (
              <div key={t.rank}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-[30px] h-[30px] rounded-[9px] text-[#171a12] flex items-center justify-center font-display font-bold text-[13px]" style={{ backgroundColor: t.color }}>{t.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13.5px] truncate">{t.name}</div>
                    <div className="text-[11px] text-white/45">{t.washed}</div>
                  </div>
                  <div className="font-display font-bold text-[14px] text-brand-lime">{t.commStr}</div>
                </div>
                <div className="h-2 bg-white/10 rounded-[6px] overflow-hidden">
                  <div className="h-full rounded-[6px]" style={{ backgroundColor: t.color, width: t.barW }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
