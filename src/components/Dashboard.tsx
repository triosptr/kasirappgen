"use client";

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import IconButton from './IconButton';
import Modal from './Modal';

type Props = {
  settings: any;
  services: any[];
  technicians: any[];
  transactions: any[];
  showToast: (m: string, k?: 'success' | 'error' | 'info') => void;
  refreshData: () => Promise<void> | void;
};

const IDR = (n: number) => 'Rp' + (n || 0).toLocaleString('id-ID');

export default function Dashboard({ settings, services, technicians, transactions, showToast, refreshData }: Props) {
  const [tab, setTab] = useState<'operasional' | 'ringkas' | 'antrian'>('operasional');
  const [ratingFor, setRatingFor] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const todayKey = today.toDateString();
  const yKey = new Date(today.getTime() - 86400000).toDateString();

  const todays = useMemo(() => transactions.filter((t: any) => new Date(t.created_at).toDateString() === todayKey), [transactions, todayKey]);
  const yesterdays = useMemo(() => transactions.filter((t: any) => new Date(t.created_at).toDateString() === yKey), [transactions, yKey]);

  const todayRev = todays.reduce((s: number, t: any) => s + Number(t.total || 0), 0);
  const yRev = yesterdays.reduce((s: number, t: any) => s + Number(t.total || 0), 0);
  const trend = yRev > 0 ? ((todayRev - yRev) / yRev) * 100 : todayRev > 0 ? 100 : 0;

  const queue = todays.filter((t: any) => t.status !== 'selesai').sort((a: any, b: any) => +new Date(a.created_at) - +new Date(b.created_at));
  const done = todays.filter((t: any) => t.status === 'selesai').sort((a: any, b: any) => +new Date(b.completed_at || b.created_at) - +new Date(a.completed_at || a.created_at));

  const commission = settings?.commission_per_wash || 0;
  const todayCommission = todays.filter((t: any) => t.status === 'selesai').length * Number(commission || 0);
  const netRevenue = todayRev - todayCommission;

  const techName = (id: any) => technicians.find((t: any) => String(t.id) === String(id))?.name || '—';
  const svcName = (id: any) => services.find((s: any) => String(s.id) === String(id))?.name || '—';

  const presentTechs = technicians.filter((t: any) => t.present && t.active !== false);
  const presentCount = presentTechs.length;
  const totalTechs = technicians.filter((t: any) => t.active !== false).length;

  const ratingStars = [1, 2, 3, 4, 5].map((v) => ({
    v,
    color: ratingValue >= v - 0.25 ? '#E8A400' : ratingValue >= v - 0.75 ? '#E8A400' : '#D5D8DE',
    fill: ratingValue >= v - 0.5 ? 1 : 0,
  }));

  const openRating = (t: any) => {
    setRatingFor(t);
    setRatingValue(5);
  };
  const closeRating = () => {
    setRatingFor(null);
    setSubmitting(false);
  };

  const submitRating = async () => {
    if (!ratingFor) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'selesai', cleanliness_rating: ratingValue, completed_at: now })
      .eq('id', ratingFor.id);
    if (error) {
      setSubmitting(false);
      return showToast(error.message, 'error');
    }
    showToast(`Motor ${ratingFor.vehicle_plate} selesai • rating ${ratingValue.toFixed(1)}`, 'success');
    closeRating();
    await refreshData();
  };

  // Mini bar chart 7 days
  const weekly = useMemo(() => {
    const arr: { d: Date; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const dayTx = transactions.filter((t: any) => new Date(t.created_at).toDateString() === key);
      arr.push({ d, total: dayTx.reduce((s: number, t: any) => s + Number(t.total || 0), 0), count: dayTx.length });
    }
    return arr;
  }, [transactions]);
  const maxBar = Math.max(1, ...weekly.map((w) => w.total));

  return (
    <div className="animate-up flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] sm:text-[28px] tracking-tight leading-tight">Halo, Kasir A 👋</h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-brand-ink2 mt-1">
            {done.length} motor selesai • {queue.length} antrian • {presentCount} teknisi hadir
          </p>
        </div>
        <div className="flex bg-white border border-brand-border rounded-xl p-1">
          {(['operasional', 'ringkas', 'antrian'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`focus-ring px-3 sm:px-4 h-9 rounded-lg text-[12px] font-bold capitalize transition ${
                tab === t ? 'bg-brand-primary text-white' : 'text-brand-ink2'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          tint="#E7ECFD"
          icon="payments"
          iconColor="#1535D4"
          label="Pendapatan hari ini"
          value={IDR(todayRev)}
          trend={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
          trendUp={trend >= 0}
        />
        <KpiCard
          tint="#F2FBC9"
          icon="task_alt"
          iconColor="#7FA000"
          label="Motor selesai"
          value={`${done.length}`}
          sub={`dari ${todays.length} transaksi`}
        />
        <KpiCard
          tint="#FFF4D6"
          icon="engineering"
          iconColor="#C68A00"
          label="Teknisi hadir"
          value={`${presentCount}/${totalTechs}`}
          sub={`${queue.length} motor dalam antrian`}
        />
        <KpiCard
          tint="#E5F4EA"
          icon="savings"
          iconColor="#2E7D32"
          label="Pendapatan bersih"
          value={IDR(netRevenue)}
          sub={`setelah komisi ${IDR(todayCommission)}`}
        />
      </section>

      {tab === 'operasional' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Antrian */}
          <div className="lg:col-span-2 bg-white border border-brand-border rounded-2xl overflow-hidden">
            <Header2 icon="schedule" title="Antrian Cuci" badge={queue.length} tint="#1535D4" />
            <div className="p-3 flex flex-col gap-2 max-h-[460px] overflow-auto">
              {queue.length === 0 && <EmptyState icon="checklist" title="Tidak ada antrian" sub="Semua motor sudah selesai 🚀" />}
              {queue.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-brand-border bg-[#FAFBFC] hover:bg-[#F4F5F8] transition">
                  <div className="w-11 h-11 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                    <span className="msr text-[22px]">two_wheeler</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-[14.5px]">{t.vehicle_plate}</div>
                    <div className="text-[11.5px] text-brand-ink2 truncate">
                      {svcName(t.service_id)} • {techName(t.technician_id)} • {t.owner_name}
                    </div>
                  </div>
                  <button
                    onClick={() => openRating(t)}
                    className="focus-ring h-10 px-3.5 rounded-xl border-none bg-brand-lime text-brand-mutedDark font-bold text-[12.5px] cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="msr text-[18px]">check_circle</span>
                    Selesai
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selesai */}
          <div className="bg-brand-mutedDark text-white rounded-2xl overflow-hidden">
            <Header2 icon="task_alt" title="Selesai" badge={done.length} tint="#C8F400" dark />
            <div className="p-3 flex flex-col gap-2 max-h-[460px] overflow-auto">
              {done.length === 0 && (
                <div className="text-center text-white/55 py-10">
                  <span className="msr text-[36px]">hourglass_empty</span>
                  <div className="mt-2 text-[12.5px]">Belum ada motor yang selesai hari ini</div>
                </div>
              )}
              {done.map((d: any) => {
                const r = Number(d.cleanliness_rating || 0).toFixed(1);
                return (
                  <div key={d.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="font-display font-bold text-[14px]">{d.vehicle_plate}</div>
                      <div className="flex items-center gap-1 text-brand-lime">
                        <span className="msr text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-bold text-[12.5px]">{r}</span>
                      </div>
                    </div>
                    <div className="text-[11.5px] text-white/55 mt-1">{d.owner_name} • {techName(d.technician_id)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {tab === 'ringkas' && (
        <section className="bg-white border border-brand-border rounded-2xl p-4">
          <Header2 icon="monitoring" title="Pendapatan 7 Hari Terakhir" tint="#1535D4" />
          <div className="grid grid-cols-7 gap-2 mt-4 h-[180px] items-end">
            {weekly.map((w, i) => {
              const h = (w.total / maxBar) * 100;
              const day = w.d.toLocaleDateString('id-ID', { weekday: 'short' });
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="text-[10px] text-brand-ink2 font-semibold">
                    {w.total > 0 ? Math.round(w.total / 1000) + 'k' : '—'}
                  </div>
                  <div className="w-full bg-[#EDEFF2] rounded-md overflow-hidden" style={{ height: '140px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-brand-primary to-[#5b6cf0] rounded-md animate-bar"
                      style={{ height: `${Math.max(4, h)}%`, animationDelay: `${i * 60}ms` }}
                    />
                  </div>
                  <div className="text-[10.5px] font-bold text-brand-ink2 uppercase">{day}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-[12.5px] text-brand-ink2">
            <span>Total 7 hari</span>
            <span className="font-display font-bold text-[15px] text-brand-ink">{IDR(weekly.reduce((s, w) => s + w.total, 0))}</span>
          </div>
        </section>
      )}

      {tab === 'antrian' && (
        <section className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <Header2 icon="list_alt" title="Antrean Lengkap" badge={queue.length} tint="#1535D4" />
          <div className="p-3 flex flex-col gap-2">
            {queue.length === 0 && <EmptyState icon="celebration" title="Antrean kosong" sub="Semua cucian sudah selesai" />}
            {queue.map((t: any, i: number) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-brand-border">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-display font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[14px]">{t.vehicle_plate}</div>
                  <div className="text-[11.5px] text-brand-ink2 truncate">{svcName(t.service_id)} • {techName(t.technician_id)}</div>
                </div>
                <button onClick={() => openRating(t)} className="focus-ring h-10 px-3.5 rounded-xl border-none bg-brand-primary text-white font-bold text-[12.5px] cursor-pointer">
                  Selesai
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rating modal */}
      <Modal
        open={!!ratingFor}
        onClose={closeRating}
        contentClassName="w-[min(94vw,420px)] bg-white rounded-[24px] p-6 sm:p-7 animate-pop shadow-[0_40px_100px_rgba(8,16,42,.45)]"
      >
        {ratingFor && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-lime flex items-center justify-center mb-3.5">
                <span className="msr text-[30px] text-[#171a12]">cleaning_services</span>
              </div>
              <div className="font-display font-bold text-[19px]">Penilaian Kebersihan</div>
              <div className="text-[13px] text-brand-ink2 mt-1">{ratingFor.vehicle_plate} • {ratingFor.owner_name}</div>
            </div>

            <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 mb-2">
              {ratingStars.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setRatingValue(s.v)}
                  aria-label={`Beri rating ${s.v} dari 5`}
                  className="focus-ring border-none bg-transparent cursor-pointer p-1"
                >
                  <span
                    className="msr text-[36px] sm:text-[44px]"
                    style={{ color: s.color, fontVariationSettings: `'FILL' ${s.fill}` }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            <div className="text-center font-display font-bold text-[15px] text-brand-ink">
              {ratingValue.toFixed(1)} <span className="text-brand-ink2 font-medium text-[13px]">/ 5.0</span>
            </div>

            <button
              onClick={submitRating}
              disabled={submitting}
              className="focus-ring w-full mt-5 h-[52px] border-none rounded-xl bg-brand-primary text-white font-display font-bold text-[15px] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting && <span className="msr text-[18px] animate-spin">progress_activity</span>}
              Simpan & Pindahkan ke Selesai
            </button>
            <div className="text-center text-[11.5px] text-brand-ink2 mt-3">Rating tersimpan ke database pelanggan</div>
          </>
        )}
      </Modal>
    </div>
  );
}

function KpiCard({ tint, icon, iconColor, label, value, sub, trend, trendUp }: any) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: tint }}>
          <span className="msr text-[20px]" style={{ color: iconColor }}>{icon}</span>
        </span>
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-brand-ink2">{label}</span>
      </div>
      <div className="font-display font-bold text-[20px] sm:text-[24px] leading-tight">{value}</div>
      <div className="flex items-center gap-2">
        {trend && (
          <span
            className={`text-[11px] font-bold flex items-center gap-0.5 ${
              trendUp ? 'text-[#2E7D32]' : 'text-[#D62828]'
            }`}
          >
            <span className="msr text-[14px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
            {trend}
          </span>
        )}
        {sub && <span className="text-[11px] text-brand-ink2">{sub}</span>}
      </div>
    </div>
  );
}

function Header2({ icon, title, badge, tint = '#1535D4', dark = false }: any) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dark ? 'border-white/10' : 'border-brand-border'}`}>
      <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: dark ? 'rgba(200,244,0,.15)' : '#E7ECFD' }}>
        <span className="msr text-[18px]" style={{ color: dark ? '#C8F400' : tint }}>{icon}</span>
      </span>
      <span className={`font-display font-bold text-[14.5px] ${dark ? 'text-white' : 'text-brand-ink'}`}>{title}</span>
      {badge != null && (
        <span className={`ml-auto text-[11.5px] font-bold px-2.5 py-0.5 rounded-full ${dark ? 'bg-white/10 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }: any) {
  return (
    <div className="text-center py-10">
      <span className="msr text-[40px] text-brand-ink2">{icon}</span>
      <div className="font-bold text-[14px] mt-2">{title}</div>
      <div className="text-[12px] text-brand-ink2">{sub}</div>
    </div>
  );
}