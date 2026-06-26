"use client";

import { useState } from 'react';

export default function Teknisi({ technicians, settings }: any) {
  const [range, setRange] = useState('7'); // 7 or 30

  const techMul = range === '7' ? 6 : 26;
  const techList = technicians?.map((tk: any) => {
    // Mocking data logic based on HTML prototype
    const washed = (tk.present ? 8 : 0) * techMul + (range === '7' ? (tk.present ? 8 : 0) : 0);
    const comm = washed * (settings?.commission_per_wash || 7000);
    return {
      ...tk,
      initials: tk.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
      todayStr: (tk.present ? 8 : 0) + ' motor',
      washedStr: washed + ' motor',
      commStr: 'Rp' + comm.toLocaleString('id-ID'),
      rating: tk.present ? '4.8' : '0.0'
    };
  }) || [];

  return (
    <div className="animate-up">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="font-display font-bold text-[clamp(24px,3.4vw,32px)] tracking-tight">Data Teknisi</div>
          <div className="text-brand-ink2 text-[13.5px] mt-1">Kinerja tim & komisi • {range === '7' ? '7 Hari Terakhir' : '1 Bulan Terakhir'}</div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-brand-border rounded-xl px-3 py-2">
            <span className="msr text-[19px] text-brand-ink2">calendar_month</span>
            <span className="text-[13px] font-semibold">{range === '7' ? '7 Hari Terakhir' : '1 Bulan Terakhir'}</span>
          </div>
          <div className="flex gap-1 bg-[#EBEDF1] border border-[#E2E4E9] p-1 rounded-xl">
            <button onClick={() => setRange('7')} className={`px-4 py-2 rounded-[10px] text-[12.5px] font-bold ${range === '7' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-ink2'}`}>7 Hari</button>
            <button onClick={() => setRange('30')} className={`px-4 py-2 rounded-[10px] text-[12.5px] font-bold ${range === '30' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-ink2'}`}>1 Bulan</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-brand-border rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] gap-2.5 p-3.5 px-4.5 bg-[#FAFBFC] border-b border-[#EDEFF2] text-[11px] font-bold tracking-wider uppercase text-brand-ink2">
          <span>Teknisi</span>
          <span className="text-center">Hari Ini</span>
          <span className="text-center">Periode</span>
          <span className="text-center">Rating</span>
          <span className="text-right">Komisi</span>
        </div>
        {techList.map((t: any) => (
          <div key={t.id} className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] gap-2.5 items-center p-3.5 px-4.5 border-b border-[#F2F3F5] last:border-b-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-[14px] ${t.present ? 'bg-[#171a22] text-brand-lime' : 'bg-[#EDEFF2] text-[#A6AAB2]'}`}>
                  {t.initials}
                </div>
                <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white ${t.present ? 'bg-[#3FBF6A]' : 'bg-[#C9CCD2]'}`} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[13.5px] truncate">{t.name}</div>
                <div className={`text-[11px] font-semibold ${t.present ? 'text-[#3FBF6A]' : 'text-[#A6AAB2]'}`}>{t.present ? 'Hadir' : 'Tidak hadir'}</div>
              </div>
            </div>
            <div className="text-center font-display font-bold text-[15px]">{t.todayStr}</div>
            <div className="text-center text-[13px] text-brand-muted font-semibold">{t.washedStr}</div>
            <div className="flex items-center justify-center gap-1 text-brand-star">
              <span className="msr text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-display font-bold text-[14px] text-brand-ink">{t.rating}</span>
            </div>
            <div className="text-right font-display font-bold text-[14px] text-brand-primary">{t.commStr}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[12px] text-[#A6AAB2] flex items-center gap-1.5">
        <span className="msr text-[16px]">info</span>
        History pencucian & rating kebersihan dihitung dari rentang tanggal yang dipilih.
      </div>
    </div>
  );
}
