"use client";

import { useState } from 'react';

export default function Pendapatan({ transactions, settings }: any) {
  const [range, setRange] = useState('7'); // 7 or 30

  // Mock calculation based on HTML prototype
  const revSeries = range === '7' ? [1850000, 2100000, 1750000, 2400000, 2250000, 2680000, 2950000] : 
    [1900000,2050000,1700000,2200000,2400000,2600000,2800000,1950000,2100000,2300000,2150000,2500000,2700000,2900000,2050000,2250000,2400000,1800000,2350000,2550000,2750000,2950000,2100000,2300000,2500000,2680000,2900000,3050000,2700000,2950000];
  
  const revMax = Math.max(...revSeries);
  const gross = revSeries.reduce((a, b) => a + b, 0);
  const perWash = settings?.commission_per_wash || 7000;
  
  // Mock top 3
  const top3 = [
    { rank: 1, name: 'Rizky Maulana', washed: '124 motor', commStr: 'Rp868.000', barW: '100%', color: '#C8F400' },
    { rank: 2, name: 'Budi Santoso', washed: '110 motor', commStr: 'Rp770.000', barW: '88%', color: '#1535D4' },
    { rank: 3, name: 'Andi Pratama', washed: '98 motor', commStr: 'Rp686.000', barW: '79%', color: '#373A4A' }
  ];

  const totalComm = top3.reduce((acc, curr) => acc + parseInt(curr.commStr.replace(/\D/g, '')), 0) * 2; // rough estimate
  const net = gross - totalComm;

  const dayLabels = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

  return (
    <div className="animate-up">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="font-display font-bold text-[clamp(24px,3.4vw,32px)] tracking-tight">Pendapatan</div>
          <div className="text-brand-ink2 text-[13.5px] mt-1">{range === '7' ? '7 Hari Terakhir' : '1 Bulan Terakhir'}</div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex gap-1 bg-[#EBEDF1] border border-[#E2E4E9] p-1 rounded-xl">
            <button onClick={() => setRange('7')} className={`px-4 py-2 rounded-[10px] text-[12.5px] font-bold ${range === '7' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-ink2'}`}>7 Hari</button>
            <button onClick={() => setRange('30')} className={`px-4 py-2 rounded-[10px] text-[12.5px] font-bold ${range === '30' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-ink2'}`}>1 Bulan</button>
          </div>
          <button className="flex items-center gap-1.5 border border-brand-border bg-white font-bold text-[12.5px] px-3.5 py-2 rounded-xl text-brand-muted">
            <span className="msr text-[18px] text-brand-primary">picture_as_pdf</span>Laporan Harian
          </button>
          <button className="flex items-center gap-1.5 border-none bg-brand-primary text-white font-bold text-[12.5px] px-3.5 py-2 rounded-xl">
            <span className="msr text-[18px] text-brand-lime">picture_as_pdf</span>Laporan Bulanan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 mb-3.5">
        <div className="bg-white border border-brand-border rounded-[20px] p-4.5">
          <div className="text-[12.5px] text-brand-ink2 font-semibold">Pendapatan Kotor</div>
          <div className="font-display font-bold text-[26px] mt-2">Rp{gross.toLocaleString('id-ID')}</div>
        </div>
        <div className="bg-white border border-brand-border rounded-[20px] p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-brand-ink2 font-semibold">Komisi Teknisi</span>
            <span className="text-[11px] text-[#A6AAB2] font-semibold">Rp{perWash.toLocaleString('id-ID')}/cuci</span>
          </div>
          <div className="font-display font-bold text-[26px] mt-2 text-brand-muted">- Rp{totalComm.toLocaleString('id-ID')}</div>
        </div>
        <div className="bg-gradient-to-br from-brand-primary to-brand-dark text-white rounded-[20px] p-4.5">
          <div className="text-[12.5px] text-white/70 font-semibold">Pendapatan Bersih</div>
          <div className="font-display font-bold text-[26px] mt-2">Rp{net.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5 items-start">
        <div className="bg-white border border-brand-border rounded-[20px] p-5">
          <div className="flex items-center justify-between mb-4.5">
            <span className="font-display font-bold text-[16px]">Grafik Pendapatan</span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-brand-ink2">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-lime" />Hari ini
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-[200px]">
            {revSeries.map((v, i) => {
              const isLast = i === revSeries.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="flex-1 flex items-end w-full">
                    <div className="w-full min-w-[4px] rounded-t-[5px]" style={{ backgroundColor: isLast ? '#C8F400' : '#1535D4', height: Math.round(v / revMax * 100) + '%' }} />
                  </div>
                  <span className="text-[10px] text-[#A6AAB2]">{range === '7' ? dayLabels[i] : ((i + 1) % 5 === 0 || i === 0 ? String(i + 1) : '')}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-brand-mutedDark text-white rounded-[20px] p-5">
          <div className="flex items-center gap-2 mb-4.5">
            <span className="msr text-[20px] text-brand-lime">emoji_events</span>
            <span className="font-display font-bold text-[16px]">Top 3 Teknisi</span>
          </div>
          <div className="flex flex-col gap-4">
            {top3.map((t) => (
              <div key={t.rank}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7.5 h-7.5 rounded-lg text-[#171a12] flex items-center justify-center font-display font-bold text-[13px]" style={{ backgroundColor: t.color }}>{t.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13.5px] truncate">{t.name}</div>
                    <div className="text-[11px] text-white/45">{t.washed}</div>
                  </div>
                  <div className="font-display font-bold text-[14px] text-brand-lime">{t.commStr}</div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ backgroundColor: t.color, width: t.barW }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
