"use client";

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';

function rp(n: number) {
  return `Rp${Math.round(n || 0).toLocaleString('id-ID')}`;
}

function sameDay(aIso?: string, dayIso?: string) {
  if (!aIso || !dayIso) return false;
  return aIso.slice(0, 10) === dayIso;
}

function isoDateDaysAgo(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard({ transactions, technicians, services, settings, showToast, refreshData }: any) {
  const [variant, setVariant] = useState('a');
  const [ratingFor, setRatingFor] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const todayIso = isoDateDaysAgo(0);
  const yesterdayIso = isoDateDaysAgo(1);

  const todayTransactions = useMemo(() => {
    return (transactions || []).filter((t: any) => sameDay(t.created_at, todayIso));
  }, [transactions, todayIso]);

  const completedToday = useMemo(() => {
    return todayTransactions.filter((t: any) => t.status === 'selesai');
  }, [todayTransactions]);

  const queueToday = useMemo(() => {
    return todayTransactions.filter((t: any) => t.status !== 'selesai');
  }, [todayTransactions]);

  const waitToday = useMemo(() => {
    return queueToday.filter((t: any) => t.status === 'antri');
  }, [queueToday]);

  const processToday = useMemo(() => {
    return queueToday.filter((t: any) => t.status === 'proses');
  }, [queueToday]);

  const presentTechs = useMemo(() => {
    return (technicians || []).filter((t: any) => t.present);
  }, [technicians]);

  const getService = (id: string) => {
    return (services || []).find((s: any) => s.id === id) || {
      name: 'Service',
      color: '#ccc',
      soft_color: '#eee',
    };
  };

  const getServiceByKey = (key: string) => {
    return (services || []).find((s: any) => s.key === key) || null;
  };

  const getTech = (id: string) => {
    return (technicians || []).find((t: any) => t.id === id)?.name || 'Belum ada';
  };

  const techWashedToday = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of completedToday) {
      if (!t.technician_id) continue;
      const k = String(t.technician_id);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [completedToday]);

  const todayRevenue = useMemo(() => {
    return completedToday.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
  }, [completedToday]);

  const yesterdayRevenue = useMemo(() => {
    const yTxs = (transactions || []).filter((t: any) => sameDay(t.created_at, yesterdayIso) && t.status === 'selesai');
    return yTxs.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
  }, [transactions, yesterdayIso]);

  const trendPct = useMemo(() => {
    if (!yesterdayRevenue) return 0;
    return ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
  }, [todayRevenue, yesterdayRevenue]);

  const rev7 = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => isoDateDaysAgo(6 - i));
    const totals = days.map((d) => {
      const dayTxs = (transactions || []).filter((t: any) => sameDay(t.created_at, d) && t.status === 'selesai');
      return dayTxs.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
    });
    return { days, totals };
  }, [transactions]);

  const week7Sum = useMemo(() => {
    return rev7.totals.reduce((a, b) => a + b, 0);
  }, [rev7]);

  const max7 = useMemo(() => {
    return Math.max(1, ...rev7.totals);
  }, [rev7]);

  const bars7 = useMemo(() => {
    const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return rev7.totals.map((v, i) => {
      const h = Math.round((v / max7) * 100);
      return {
        h: `${h}%`,
        label: labels[i] || '',
        fill: i === rev7.totals.length - 1 ? '#C8F400' : 'rgba(255,255,255,.28)',
      };
    });
  }, [rev7, max7]);

  const openRating = (tx: any) => {
    setRatingFor(tx);
    setRatingValue(5);
  };

  const closeRating = () => setRatingFor(null);

  const submitRating = async () => {
    if (!ratingFor) return;
    if (ratingSubmitting) return;
    setRatingSubmitting(true);
    const nowIso = new Date().toISOString();
    const txRes = await supabase
      .from('transactions')
      .update({
        status: 'selesai',
        cleanliness_rating: ratingValue,
        completed_at: nowIso,
      })
      .eq('id', ratingFor.id);

    if (txRes.error) {
      showToast('Gagal menyimpan rating');
      setRatingSubmitting(false);
      return;
    }

    if (ratingFor.customer_id && !ratingFor.points_redeemed) {
      const addPoints = settings?.point_per_tx ?? 10;
      const currRes = await supabase.from('gen_customers').select('points').eq('id', ratingFor.customer_id).single();
      if (!currRes.error) {
        const nextPoints = (currRes.data?.points ?? 0) + addPoints;
        await supabase.from('gen_customers').update({ points: nextPoints }).eq('id', ratingFor.customer_id);
      }
    }

    setRatingFor(null);
    setRatingSubmitting(false);
    showToast(`Motor ${ratingFor.vehicle_plate} selesai • rating ${ratingValue.toFixed(1)}`);
    refreshData();
  };

  const ratingStars = [1, 2, 3, 4, 5].map((v) => {
    const on = v <= ratingValue;
    return { v, on, color: on ? '#FFB400' : '#E2E4E9', fill: on ? 1 : 0 };
  });

  return (
    <div className="animate-up">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="font-display font-bold text-[clamp(24px,3.4vw,32px)] tracking-tight">
            Dashboard
          </div>
          <div className="text-brand-ink2 text-[13.5px] mt-1">
            Ringkasan operasional cucian hari ini.
          </div>
        </div>
        <div className="flex gap-1 bg-[#EBEDF1] border border-[#E2E4E9] p-1 rounded-[13px]">
          {[
            { id: 'a', label: 'Operasional' },
            { id: 'b', label: 'Ringkas' },
            { id: 'c', label: 'Antrian' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              className={`border-none cursor-pointer px-[14px] py-[7px] rounded-[10px] text-[12.5px] font-bold transition-all ${
                variant === v.id
                  ? 'bg-white text-[#14161B] shadow-[0_2px_6px_rgba(0,0,0,.08)]'
                  : 'bg-transparent text-[#8A8F99]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[14px] mb-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-dark text-white rounded-[20px] p-5 shadow-[0_16px_34px_rgba(21,53,212,.26)]">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-white/70">Pendapatan Hari Ini</span>
            <span className="msr text-[20px] text-brand-lime">payments</span>
          </div>
          <div className="font-display font-bold text-[30px] mt-3 tracking-tight">
            {rp(todayRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 bg-brand-lime/20 text-brand-lime font-bold text-[12px] px-2 py-0.5 rounded-full">
              <span className="msr text-[15px]">trending_up</span>
              {(trendPct >= 0 ? '+' : '') + trendPct.toFixed(1) + '%'}
            </span>
            <span className="text-[11.5px] text-white/60">
              vs kemarin {rp(yesterdayRevenue)}
            </span>
          </div>
          <div className="absolute -right-[30px] -bottom-[30px] w-[120px] h-[120px] rounded-full bg-white/5" />
        </div>

        <div className="bg-white border border-brand-border rounded-[20px] p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-brand-ink2">Motor Selesai</span>
            <span className="msr text-[20px] text-brand-primary">task_alt</span>
          </div>
          <div className="font-display font-bold text-[30px] mt-3">{completedToday.length}</div>
          <div className="text-[11.5px] text-brand-ink2 mt-2.5">{completedToday.length} motor rampung hari ini</div>
        </div>

        <div className="bg-white border border-brand-border rounded-[20px] p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-brand-ink2">Dalam Antrian</span>
            <span className="msr text-[20px] text-brand-muted">pending_actions</span>
          </div>
          <div className="font-display font-bold text-[30px] mt-3">{queueToday.length}</div>
          <div className="text-[11.5px] text-brand-ink2 mt-2.5">menunggu & sedang proses</div>
        </div>

        <div className="bg-brand-mutedDark text-white rounded-[20px] p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-white/60">Teknisi Hadir</span>
            <span className="msr text-[20px] text-brand-lime">groups</span>
          </div>
          <div className="font-display font-bold text-[30px] mt-3">
            {presentTechs.length}<span className="text-[16px] text-white/40">/{technicians?.length || 0}</span>
          </div>
          <div className="text-[11.5px] text-white/55 mt-2.5">tim siap melayani</div>
        </div>
      </div>

      {variant === 'a' && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5 items-start">
            <div className="bg-white border border-brand-border rounded-[20px] p-4.5">
              <div className="flex items-center gap-2 mb-3.5">
                <span className="msr text-[20px] text-brand-muted">pending_actions</span>
                <span className="font-display font-bold text-[16px]">Antrian Motor</span>
                <span className="ml-auto bg-[#F0F1F4] text-[#6A6F7A] text-[12px] font-bold px-2.5 py-0.5 rounded-full">{queueToday.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {queueToday.length === 0 ? (
                  <div className="text-center text-[#A6AAB2] text-[13px] py-4">Tidak ada antrian 🎉</div>
                ) : queueToday.map((q: any) => {
                  const svc = getService(q.service_id);
                  return (
                    <div key={q.id} className="flex items-center gap-3 p-2.5 border border-[#EDEFF2] rounded-xl">
                      <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: svc.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-[14.5px]">{q.vehicle_plate}</span>
                          <span className="text-[11px] font-bold px-2 py-px rounded-full" style={{ color: svc.color, backgroundColor: svc.soft_color }}>{svc.name}</span>
                        </div>
                        <div className="text-[12px] text-brand-ink2 mt-1 truncate">
                          {q.vehicle_type} • {q.owner_name} • {getTech(q.technician_id)}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: q.status === 'proses' ? '#1535D4' : '#A6AAB2' }}>
                        {q.status === 'proses' ? 'Proses' : 'Menunggu'}
                      </span>
                      <button
                        onClick={() => openRating(q)}
                        className="border-none cursor-pointer bg-brand-lime text-[#171a12] font-bold text-[12px] px-3 py-2 rounded-[11px] flex items-center gap-1 whitespace-nowrap"
                      >
                        <span className="msr text-[16px]">check</span>
                        Selesai
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-brand-border rounded-[20px] p-4.5">
              <div className="flex items-center gap-2 mb-3.5">
                <span className="msr text-[20px] text-brand-primary">task_alt</span>
                <span className="font-display font-bold text-[16px]">Selesai Hari Ini</span>
                <span className="ml-auto bg-[#F0F1F4] text-[#6A6F7A] text-[12px] font-bold px-2.5 py-0.5 rounded-full">{completedToday.length}</span>
              </div>
              <div className="flex flex-col gap-2.5 max-h-[340px] overflow-auto">
                {completedToday.length === 0 ? (
                  <div className="text-center text-[#A6AAB2] text-[13px] py-4">Belum ada motor selesai</div>
                ) : completedToday.map((d: any) => {
                  const svc = getService(d.service_id);
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-2.5 border border-[#EDEFF2] rounded-xl bg-[#FCFCFD]">
                      <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center" style={{ backgroundColor: svc.soft_color, color: svc.color }}>
                        <span className="msr text-[21px]">two_wheeler</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-[14px]">
                          {d.vehicle_plate} <span className="font-medium text-brand-ink2 text-[12px]">{d.owner_name}</span>
                        </div>
                        <div className="text-[12px] text-brand-ink2 mt-0.5">
                          {svc.name} • {getTech(d.technician_id)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 justify-end text-brand-star">
                          <span className="msr text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-display font-bold text-[13.5px] text-brand-ink">{d.cleanliness_rating || 0}</span>
                        </div>
                        <div className="text-[10.5px] text-[#A6AAB2] mt-px">kebersihan</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[20px] p-4.5 mt-3.5">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="msr text-[20px] text-brand-muted">engineering</span>
              <span className="font-display font-bold text-[16px]">Teknisi Hadir</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
              {presentTechs.map((tk: any) => (
                <div key={tk.id} className="flex items-center gap-2.5 p-2.5 border border-[#EDEFF2] rounded-xl">
                  <div className="relative">
                    <div className="w-[38px] h-[38px] rounded-xl bg-[#E7ECFD] text-brand-primary flex items-center justify-center font-display font-bold text-[14px]">
                      {tk.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white bg-[#3FBF6A]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] truncate">{tk.name}</div>
                    <div className="text-[11px] text-brand-ink2">{techWashedToday.get(String(tk.id)) || 0} motor</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {variant === 'b' && (
        <div className="animate-up">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[14px] items-start">
            <div className="col-span-full bg-brand-mutedDark text-white rounded-[22px] p-[22px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 items-center">
              <div>
                <div className="text-[12.5px] text-white/55 font-semibold">Pendapatan 7 Hari Terakhir</div>
                <div className="font-display font-bold text-[34px] mt-2">{rp(week7Sum)}</div>
                <div className="inline-flex items-center gap-1 mt-2.5 bg-brand-lime/15 text-brand-lime font-bold text-[12.5px] px-2.5 py-1 rounded-full">
                  <span className="msr text-[16px]">trending_up</span>
                  {(trendPct >= 0 ? '+' : '') + trendPct.toFixed(1) + '%'} hari ini
                </div>
              </div>
              <div className="flex items-end gap-2 h-[120px]">
                {bars7.map((b: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                    <div className="flex-1 flex items-end w-full">
                      <div className="w-full rounded-[6px] rounded-b-[3px]" style={{ background: b.fill, height: b.h }} />
                    </div>
                    <span className="text-[10px] text-white/50">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-brand-border rounded-[20px] p-[18px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="msr text-[20px] text-brand-muted">pending_actions</span>
                <span className="font-display font-bold text-[15px]">Antrian</span>
              </div>
              <div className="flex flex-col gap-2">
                {queueToday.slice(0, 3).map((q: any) => {
                  const svc = getService(q.service_id);
                  return (
                    <div key={q.id} className="flex items-center gap-2.5 p-2.5 border border-[#EDEFF2] rounded-[12px]">
                      <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: svc.color }} />
                      <div className="flex-1">
                        <div className="font-display font-bold text-[13.5px]">{q.vehicle_plate}</div>
                        <div className="text-[11.5px] text-brand-ink2">{svc.name} • {q.status === 'proses' ? 'Proses' : 'Menunggu'}</div>
                      </div>
                      <button
                        onClick={() => openRating(q)}
                        className="border-none cursor-pointer bg-brand-mutedDark text-brand-lime font-bold text-[11.5px] px-2.5 py-2 rounded-[10px]"
                      >
                        Selesai
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-brand-border rounded-[20px] p-[18px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="msr text-[20px] text-brand-primary">task_alt</span>
                <span className="font-display font-bold text-[15px]">Selesai Terakhir</span>
              </div>
              <div className="flex flex-col gap-2">
                {completedToday.slice(0, 3).map((d: any) => {
                  const svc = getService(d.service_id);
                  return (
                    <div key={d.id} className="flex items-center gap-2.5 p-2.5 border border-[#EDEFF2] rounded-[12px] bg-[#FCFCFD]">
                      <div className="flex-1">
                        <div className="font-display font-bold text-[13.5px]">{d.vehicle_plate}</div>
                        <div className="text-[11.5px] text-brand-ink2">{d.owner_name} • {getTech(d.technician_id)}</div>
                      </div>
                      <div className="flex items-center gap-0.5 text-brand-star">
                        <span className="msr text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-bold text-[13px] text-brand-ink">{(d.cleanliness_rating || 0).toFixed ? d.cleanliness_rating.toFixed(1) : d.cleanliness_rating || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === 'c' && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
          <div className="bg-white border border-brand-border rounded-[20px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-muted" />
              <span className="font-display font-bold text-[14px]">Menunggu</span>
              <span className="ml-auto text-brand-ink2 font-bold text-[12px]">{waitToday.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {waitToday.map((q: any) => {
                const svc = getService(q.service_id);
                return (
                  <div key={q.id} className="p-3 border border-[#EDEFF2] border-l-4 rounded-[12px]" style={{ borderLeftColor: svc.color }}>
                    <div className="font-display font-bold text-[15px]">{q.vehicle_plate}</div>
                    <div className="text-[12px] text-brand-ink2 mt-1">{q.vehicle_type} • {svc.name}</div>
                    <button
                      onClick={() => openRating(q)}
                      className="mt-2.5 w-full border-none cursor-pointer bg-brand-lime text-[#171a12] font-bold text-[12px] py-2 rounded-[10px]"
                    >
                      Tandai Selesai
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[20px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
              <span className="font-display font-bold text-[14px]">Sedang Proses</span>
              <span className="ml-auto text-brand-ink2 font-bold text-[12px]">{processToday.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {processToday.map((q: any) => {
                const svc = getService(q.service_id);
                return (
                  <div key={q.id} className="p-3 border border-[#EDEFF2] border-l-4 rounded-[12px]" style={{ borderLeftColor: svc.color }}>
                    <div className="font-display font-bold text-[15px]">{q.vehicle_plate}</div>
                    <div className="text-[12px] text-brand-ink2 mt-1">{getTech(q.technician_id)} • {svc.name}</div>
                    <button
                      onClick={() => openRating(q)}
                      className="mt-2.5 w-full border-none cursor-pointer bg-brand-lime text-[#171a12] font-bold text-[12px] py-2 rounded-[10px]"
                    >
                      Tandai Selesai
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-brand-mutedDark text-white rounded-[20px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-lime" />
              <span className="font-display font-bold text-[14px]">Selesai</span>
              <span className="ml-auto text-white/50 font-bold text-[12px]">{completedToday.length}</span>
            </div>
            <div className="flex flex-col gap-2.5 max-h-[360px] overflow-auto">
              {completedToday.map((d: any) => (
                <div key={d.id} className="p-3 border border-white/10 rounded-[12px] bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-[14px]">{d.vehicle_plate}</span>
                    <span className="flex items-center gap-0.5 text-brand-lime">
                      <span className="msr text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-bold text-[12.5px]">{(d.cleanliness_rating || 0).toFixed ? d.cleanliness_rating.toFixed(1) : d.cleanliness_rating || 0}</span>
                    </span>
                  </div>
                  <div className="text-[11.5px] text-white/50 mt-1">{d.owner_name} • {getTech(d.technician_id)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!ratingFor}
        onClose={() => {
          if (!ratingSubmitting) closeRating();
        }}
        contentClassName="w-[min(94vw,420px)] bg-white rounded-[26px] p-[26px] animate-pop shadow-[0_40px_100px_rgba(8,16,42,.45)]"
      >
            <div className="flex flex-col items-center text-center">
              <div className="w-[56px] h-[56px] rounded-[16px] bg-brand-lime flex items-center justify-center mb-3.5">
                <span className="msr text-[30px] text-[#171a12]">cleaning_services</span>
              </div>
              <div className="font-display font-bold text-[20px]">Penilaian Kebersihan</div>
              <div className="text-[13px] text-brand-ink2 mt-1">
                {ratingFor.vehicle_plate} • {ratingFor.owner_name}
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-[22px] mb-2">
              {ratingStars.map((s) => (
                <button key={s.v} aria-label={`Rating ${s.v}`} onClick={() => setRatingValue(s.v)} className="focus-ring border-none bg-transparent cursor-pointer p-0.5 rounded-[12px]">
                  <span className="msr text-[40px]" style={{ color: s.color, fontVariationSettings: `'FILL' ${s.fill}` }}>
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
              disabled={ratingSubmitting}
              className="focus-ring w-full mt-5 h-[52px] border-none rounded-[14px] bg-brand-primary text-white font-display font-bold text-[15px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {ratingSubmitting ? 'Menyimpan…' : 'Simpan & Pindahkan ke Selesai'}
            </button>
            <div className="text-center text-[11.5px] text-[#A6AAB2] mt-3">
              Rating tersimpan ke database pelanggan
            </div>
      </Modal>
    </div>
  );
}
