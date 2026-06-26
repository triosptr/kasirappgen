"use client";

import { useMemo, useState } from 'react';

const IDR = (n: number) => 'Rp' + (n || 0).toLocaleString('id-ID');

type Props = {
  settings: any;
  technicians: any[];
  transactions: any[];
  showToast: (m: string, k?: 'success' | 'error' | 'info') => void;
};

export default function Pendapatan({ settings, technicians, transactions, showToast }: Props) {
  const [range, setRange] = useState<'7' | '30'>('7');
  const days = parseInt(range, 10);
  const commission = Number(settings?.commission_per_wash || 0);

  const start = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return d;
  }, [days]);

  const inRange = useMemo(
    () => transactions.filter((t: any) => new Date(t.created_at) >= start),
    [transactions, start]
  );

  const gross = inRange.reduce((s: number, t: any) => s + Number(t.total || 0), 0);
  const finished = inRange.filter((t: any) => t.status === 'selesai').length;
  const commissionTotal = finished * commission;
  const net = Math.max(0, gross - commissionTotal);
  const avgPerDay = gross / Math.max(1, days);

  // Bar/area chart data
  const dailySeries = useMemo(() => {
    const arr: { d: Date; total: number; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const tx = inRange.filter((t: any) => new Date(t.created_at).toDateString() === key);
      arr.push({
        d,
        total: tx.reduce((s: number, t: any) => s + Number(t.total || 0), 0),
        count: tx.length,
      });
    }
    return arr;
  }, [days, inRange]);

  const maxBar = Math.max(1, ...dailySeries.map((d) => d.total));

  // Build SVG area
  const W = 600;
  const H = 180;
  const stepX = W / Math.max(1, dailySeries.length - 1);
  const points = dailySeries.map((d, i) => {
    const x = i * stepX;
    const y = H - (d.total / maxBar) * (H - 12);
    return [x, y] as const;
  });
  const pathLine = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const pathArea = `${pathLine} L${W},${H} L0,${H} Z`;

  // Top 3 teknisi by commission
  const techStats = useMemo(() => {
    return technicians
      .map((t: any) => {
        const tx = inRange.filter((x: any) => String(x.technician_id) === String(t.id) && x.status === 'selesai');
        const ratings = tx.map((x: any) => Number(x.cleanliness_rating || 0)).filter((n: number) => n > 0);
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        return {
          ...t,
          count: tx.length,
          commission: tx.length * commission,
          rating: avg,
        };
      })
      .sort((a: any, b: any) => b.commission - a.commission)
      .slice(0, 3);
  }, [technicians, inRange, commission]);

  const maxComm = Math.max(1, ...techStats.map((t) => t.commission));

  const rangeLabel = `${start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} – ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const generatePDF = () => {
    showToast('Membuka laporan…', 'info');
    setTimeout(() => {
      try {
        window.print();
      } catch {
        showToast('Browser tidak mengizinkan cetak', 'error');
      }
    }, 250);
  };

  return (
    <div className="animate-up flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] sm:text-[28px] tracking-tight">Pendapatan</h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-brand-ink2 mt-1">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={generatePDF}
            className="focus-ring h-9 px-3 sm:px-4 rounded-xl bg-brand-lime text-brand-mutedDark font-bold text-[12.5px] flex items-center gap-1.5"
          >
            <span className="msr text-[18px]">picture_as_pdf</span>
            Generate PDF
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon="payments" color="#1535D4" bg="#E7ECFD" label="Pendapatan Kotor" value={IDR(gross)} />
        <Kpi icon="savings" color="#2E7D32" bg="#E5F4EA" label="Pendapatan Bersih" value={IDR(net)} sub={`setelah komisi`} />
        <Kpi icon="group" color="#7FA000" bg="#F2FBC9" label="Motor Selesai" value={`${finished}`} sub={rangeLabel} />
        <Kpi icon="trending_up" color="#C68A00" bg="#FFF4D6" label="Rata-rata / hari" value={IDR(avgPerDay)} />
      </section>

      {/* Modern chart */}
      <section className="bg-white border border-brand-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <span className="msr text-[20px]">monitoring</span>
            </span>
            <div>
              <div className="font-display font-bold text-[14.5px]">Tren Pendapatan</div>
              <div className="text-[11px] text-brand-ink2">{rangeLabel}</div>
            </div>
          </div>
        </div>

        <div className="relative w-full" style={{ height: 220 }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1535D4" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#1535D4" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="#EDEFF2" strokeDasharray="3 4" />
            ))}
            <path d={pathArea} fill="url(#gradArea)" />
            <path d={pathLine} fill="none" stroke="#1535D4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#1535D4" strokeWidth="2" />
            ))}
          </svg>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1 mt-2">
          {dailySeries.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-brand-ink2 font-semibold">
              {d.d.getDate()}
            </div>
          ))}
        </div>
      </section>

      {/* Top 3 Teknisi */}
      <section className="bg-white border border-brand-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-9 h-9 rounded-xl bg-brand-lime/30 text-brand-limeTextDark flex items-center justify-center">
            <span className="msr text-[20px]">emoji_events</span>
          </span>
          <div>
            <div className="font-display font-bold text-[14.5px]">Top 3 Teknisi</div>
            <div className="text-[11px] text-brand-ink2">Berdasarkan komisi {rangeLabel}</div>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {techStats.map((t: any, i: number) => {
            const initials = t.name
              .split(' ')
              .map((w: string) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            const medal = ['🥇', '🥈', '🥉'][i];
            const pct = Math.round((t.commission / maxComm) * 100);
            return (
              <li key={t.id} className="flex items-center gap-3 p-3 rounded-2xl border border-brand-border bg-[#FAFBFC]">
                <div className="text-2xl">{medal}</div>
                <div className="w-11 h-11 rounded-xl bg-[#171a22] text-brand-lime flex items-center justify-center font-display font-bold text-[14px]">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[14px] truncate">{t.name}</div>
                    <div className="font-display font-bold text-[14px] text-brand-primary">{IDR(t.commission)}</div>
                  </div>
                  <div className="mt-1 h-2 bg-brand-border rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-primary to-[#5b6cf0] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] text-brand-ink2 mt-1">
                    {t.count} motor • {t.rating > 0 ? `★ ${t.rating.toFixed(1)}` : '—'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Hidden printable report */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 text-brand-ink">
        <h1 className="text-2xl font-bold">Laporan Pendapatan</h1>
        <p className="text-sm">{rangeLabel}</p>
        <table className="w-full mt-4 text-sm">
          <tbody>
            <tr><td>Pendapatan Kotor</td><td className="text-right font-bold">{IDR(gross)}</td></tr>
            <tr><td>Komisi Teknisi</td><td className="text-right font-bold">-{IDR(commissionTotal)}</td></tr>
            <tr><td className="font-bold">Pendapatan Bersih</td><td className="text-right font-bold">{IDR(net)}</td></tr>
            <tr><td>Motor Selesai</td><td className="text-right font-bold">{finished}</td></tr>
          </tbody>
        </table>
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