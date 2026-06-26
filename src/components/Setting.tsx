"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Props = {
  settings: any;
  services: any[];
  showToast: (m: string, k?: 'success' | 'error' | 'info') => void;
  refreshData: () => Promise<void> | void;
};

export default function Setting({ settings, services, showToast, refreshData }: Props) {
  const [draft, setDraft] = useState({
    commission_per_wash: settings?.commission_per_wash || 0,
    discount_presets: (settings?.discount_presets || [0, 5, 10, 15, 20]) as number[],
    point_per_tx: settings?.point_per_tx || 10,
    point_for_free_wash: settings?.point_for_free_wash || 150,
    servicePrices: {} as Record<string, number>,
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [draftServices, setDraftServices] = useState<Record<string, number>>({});

  // Sync incoming settings
  useEffect(() => {
    if (!settings) return;
    setDraft((d) => ({
      ...d,
      commission_per_wash: settings.commission_per_wash || 0,
      discount_presets: settings.discount_presets || [0, 5, 10, 15, 20],
      point_per_tx: settings.point_per_tx || 10,
      point_for_free_wash: settings.point_for_free_wash || 150,
    }));
  }, [settings?.id]);

  // Sync incoming services → draft
  useEffect(() => {
    const m: Record<string, number> = {};
    services.forEach((s: any) => (m[String(s.id)] = s.price));
    setDraftServices(m);
  }, [services?.length]);

  useEffect(() => {
    if (!settings) return;
    setStatus('idle');
    const t = setTimeout(async () => {
      setStatus('saving');
      const { error } = await supabase
        .from('settings')
        .update({
          commission_per_wash: Number(draft.commission_per_wash) || 0,
          discount_presets: draft.discount_presets,
          point_per_tx: Number(draft.point_per_tx) || 0,
          point_for_free_wash: Number(draft.point_for_free_wash) || 0,
        })
        .eq('id', settings.id);
      if (error) {
        setStatus('error');
        showToast(error.message, 'error');
      } else {
        setStatus('saved');
        refreshData();
        setTimeout(() => setStatus('idle'), 1400);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [
    draft.commission_per_wash,
    draft.discount_presets.join(','),
    draft.point_per_tx,
    draft.point_for_free_wash,
    settings?.id,
  ]);

  // Service prices autosave
  useEffect(() => {
    if (!services?.length) return;
    const t = setTimeout(async () => {
      const updates = services
        .map((s: any) => ({ id: s.id, price: Number(draftServices[String(s.id)] ?? s.price) }))
        .filter((u: any) => services.find((s: any) => s.id === u.id)?.price !== u.price);
      if (!updates.length) return;
      setStatus('saving');
      await Promise.all(updates.map((u: any) => supabase.from('services').update({ price: u.price }).eq('id', u.id)));
      setStatus('saved');
      refreshData();
      setTimeout(() => setStatus('idle'), 1400);
    }, 700);
    return () => clearTimeout(t);
  }, [JSON.stringify(draftServices)]);

  const setPreset = (idx: number, val: string) => {
    const next = [...draft.discount_presets];
    next[idx] = Math.min(100, Math.max(0, Number(val) || 0));
    setDraft({ ...draft, discount_presets: next });
  };

  return (
    <div className="animate-up flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] sm:text-[28px] tracking-tight">Pengaturan</h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-brand-ink2 mt-1">Otomatis tersimpan.</p>
        </div>
        <StatusPill status={status} />
      </div>

      {/* Diskon & Poin */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Diskon & Poin Loyalti" icon="loyalty" tint="#1535D4">
          <Field label="Poin per Transaksi">
            <input
              type="number"
              value={draft.point_per_tx}
              onChange={(e) => setDraft({ ...draft, point_per_tx: Number(e.target.value) || 0 })}
              className="focus-ring w-full h-12 border border-brand-border rounded-xl px-3 text-[14px]"
            />
          </Field>
          <Field label="Poin untuk 1× Cuci Gratis">
            <input
              type="number"
              value={draft.point_for_free_wash}
              onChange={(e) => setDraft({ ...draft, point_for_free_wash: Number(e.target.value) || 0 })}
              className="focus-ring w-full h-12 border border-brand-border rounded-xl px-3 text-[14px]"
            />
          </Field>
          <Field label="Preset Diskon (%)">
            <div className="flex flex-wrap gap-2">
              {draft.discount_presets.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-white border border-brand-border rounded-xl px-2.5 h-11"
                >
                  <input
                    type="number"
                    value={p}
                    onChange={(e) => setPreset(i, e.target.value)}
                    className="focus-ring w-10 border-none bg-transparent text-[14px] font-display font-bold text-center"
                  />
                  <span className="text-[12.5px] text-brand-ink2">%</span>
                </div>
              ))}
            </div>
          </Field>
        </Card>

        <Card title="Komisi Teknisi" icon="engineering" tint="#1535D4">
          <Field label="Komisi per Motor Dicuci (Rp)">
            <input
              type="number"
              value={draft.commission_per_wash}
              onChange={(e) => setDraft({ ...draft, commission_per_wash: Number(e.target.value) || 0 })}
              className="focus-ring w-full h-12 border border-brand-border rounded-xl px-3 text-[14px]"
            />
          </Field>
          <div className="mt-3 p-3.5 bg-[#F2FBC9] border border-[#DEF06B] rounded-2xl text-[12.5px] text-[#3d5000]">
            Komisi dihitung otomatis dari jumlah motor yang berstatus <b>selesai</b> di rentang tanggal.
          </div>
        </Card>
      </section>

      {/* Service prices */}
      <section className="bg-white border border-brand-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <span className="msr text-[20px]">price_change</span>
          </span>
          <div>
            <div className="font-display font-bold text-[14.5px]">Harga Menu Jasa</div>
            <div className="text-[11px] text-brand-ink2">Ubah harga akan otomatis tersedia di menu Transaksi.</div>
          </div>
        </div>
        <ul className="flex flex-col gap-2.5">
          {services?.map((s: any) => (
            <li key={s.id} className="flex items-center gap-3 p-3 rounded-2xl border border-brand-border bg-[#FAFBFC]">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: s.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px]">{s.name}</div>
                <div className="text-[11px] text-brand-ink2">{s.duration_min} menit</div>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-brand-border rounded-xl px-3 h-11">
                <span className="text-[12.5px] text-brand-ink2">Rp</span>
                <input
                  type="number"
                  value={draftServices[String(s.id)] ?? s.price}
                  onChange={(e) =>
                    setDraftServices({ ...draftServices, [String(s.id)]: Number(e.target.value) || 0 })
                  }
                  className="focus-ring w-24 border-none bg-transparent text-[14px] font-display font-bold text-right"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  const map = {
    saving: { c: '#1535D4', bg: '#E7ECFD', t: 'Menyimpan…', i: 'progress_activity' },
    saved: { c: '#2E7D32', bg: '#E5F4EA', t: 'Tersimpan', i: 'check_circle' },
    error: { c: '#D62828', bg: '#FCE6E6', t: 'Gagal', i: 'error' },
  } as const;
  const m = map[status as keyof typeof map];
  return (
    <span
      className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-[12px] font-bold ${status === 'saving' ? 'animate-pulse' : ''}`}
      style={{ backgroundColor: m.bg, color: m.c }}
    >
      <span className={`msr text-[16px] ${status === 'saving' ? 'animate-spin' : ''}`}>{m.i}</span>
      {m.t}
    </span>
  );
}

function Card({ title, icon, tint, children }: any) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <span className="msr text-[20px]" style={{ color: tint }}>{icon}</span>
        </span>
        <span className="font-display font-bold text-[14.5px]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="block text-[11.5px] font-semibold text-brand-ink2 mb-1.5">{label}</label>
      {children}
    </div>
  );
}