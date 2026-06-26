"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Setting({ settings, services, showToast, refreshData }: any) {
  const [pointPerTx, setPointPerTx] = useState(settings?.point_per_tx || 10);
  const [freeWashVal, setFreeWashVal] = useState(settings?.point_for_free_wash || 150);
  const [commissionVal, setCommissionVal] = useState(settings?.commission_per_wash || 7000);
  const [discPresets, setDiscPresets] = useState<number[]>(settings?.discount_presets || [0, 5, 10, 15, 20]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [svcPrices, setSvcPrices] = useState<any>(
    services?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.price }), {}) || {}
  );
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!settings) return;
    setPointPerTx(settings.point_per_tx ?? 10);
    setFreeWashVal(settings.point_for_free_wash ?? 150);
    setCommissionVal(settings.commission_per_wash ?? 7000);
    setDiscPresets(settings.discount_presets ?? [0, 5, 10, 15, 20]);
  }, [settings]);

  useEffect(() => {
    if (!services) return;
    setSvcPrices(services.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.price }), {}));
  }, [services]);

  const handleSave = async (next?: {
    pointPerTx?: number;
    freeWashVal?: number;
    commissionVal?: number;
    discPresets?: number[];
    svcPrices?: Record<string, number>;
  }) => {
    setSaveStatus('saving');
    const payload = {
      pointPerTx: next?.pointPerTx ?? pointPerTx,
      freeWashVal: next?.freeWashVal ?? freeWashVal,
      commissionVal: next?.commissionVal ?? commissionVal,
      discPresets: next?.discPresets ?? discPresets,
      svcPrices: next?.svcPrices ?? svcPrices,
    };

    const setRes = await supabase.from('settings').update({
      point_per_tx: payload.pointPerTx,
      point_for_free_wash: payload.freeWashVal,
      commission_per_wash: payload.commissionVal,
      discount_presets: payload.discPresets
    }).eq('id', 1);

    if (setRes.error) {
      setSaveStatus('error');
      showToast('Gagal menyimpan pengaturan');
      return;
    }

    const svcKeys = Object.keys(payload.svcPrices || {});
    const svcRes = await Promise.all(
      svcKeys.map((key) =>
        supabase.from('services').update({ price: payload.svcPrices[key] }).eq('key', key)
      )
    );

    const svcErr = svcRes.find((r) => r.error)?.error;
    if (svcErr) {
      setSaveStatus('error');
      showToast('Gagal menyimpan harga jasa');
      return;
    }

    setSaveStatus('saved');
    refreshData();
    window.setTimeout(() => setSaveStatus('idle'), 1400);
  };

  const scheduleSave = (next: {
    pointPerTx?: number;
    freeWashVal?: number;
    commissionVal?: number;
    discPresets?: number[];
    svcPrices?: Record<string, number>;
  }) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      handleSave(next);
      saveTimer.current = null;
    }, 700);
    setSaveStatus('saving');
  };

  return (
    <div className="animate-up max-w-[680px]">
      <div className="mb-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-display font-bold text-[clamp(24px,3.4vw,32px)] tracking-tight">Pengaturan</div>
            <div className="text-brand-ink2 text-[13.5px] mt-1">Atur harga, diskon & sistem poin.</div>
          </div>
          <div className="text-[12px] font-semibold">
            {saveStatus === 'saving' && <span className="text-brand-ink2">Menyimpan…</span>}
            {saveStatus === 'saved' && <span className="text-[#3FBF6A]">Tersimpan</span>}
            {saveStatus === 'error' && <span className="text-[#D62828]">Gagal</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="bg-white border border-brand-border rounded-[20px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="msr text-[20px] text-brand-primary">sell</span>
            <span className="font-display font-bold text-[16px]">Harga Menu Jasa</span>
          </div>
          <div className="flex flex-col gap-3">
            {services?.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-[4px]" style={{ backgroundColor: s.color }} />
                <span className="flex-1 font-semibold text-[14px]">{s.name}</span>
                <div className="flex items-center gap-1.5 bg-[#F6F7F9] border border-brand-border rounded-xl px-3.5 h-[46px]">
                  <span className="text-[13px] text-brand-ink2 font-semibold">Rp</span>
                  <input 
                    type="number" 
                    value={svcPrices[s.key] || 0} 
                    onChange={e => {
                      const v = parseInt(e.target.value) || 0;
                      const next = { ...svcPrices, [s.key]: v };
                      setSvcPrices(next);
                      scheduleSave({ svcPrices: next });
                    }} 
                    className="focus-ring w-[100px] border-none bg-transparent text-[15px] font-display font-bold text-right rounded-[10px]" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-[20px] p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="msr text-[20px] text-brand-limeText">percent</span>
            <span className="font-display font-bold text-[16px]">Preset Diskon</span>
          </div>
          <div className="text-[12.5px] text-brand-ink2 mb-3.5">Pilih nilai diskon yang tersedia di transaksi.</div>
          <div className="flex flex-wrap gap-2">
            {[0, 5, 10, 15, 20, 25, 30].map(v => (
              <button 
                key={v} 
                onClick={() => {
                  const has = discPresets.includes(v);
                  const next = has ? discPresets.filter(x => x !== v) : [...discPresets, v].sort((a, b) => a - b);
                  setDiscPresets(next);
                  scheduleSave({ discPresets: next });
                }}
                className={`focus-ring px-3.5 py-2.5 rounded-xl font-bold text-[13px] font-display transition-colors ${
                  discPresets.includes(v) ? 'bg-brand-primary text-white' : 'bg-[#F0F1F4] text-[#6A6F7A]'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-[20px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="msr text-[20px] text-brand-primary">loyalty</span>
            <span className="font-display font-bold text-[16px]">Sistem Poin & Komisi</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
            <div>
              <label className="block text-[12.5px] font-semibold text-[#6A6F7A] mb-1.5">Poin / transaksi</label>
              <input
                type="number"
                value={pointPerTx}
                onChange={e => {
                  const v = parseInt(e.target.value) || 0;
                  setPointPerTx(v);
                  scheduleSave({ pointPerTx: v });
                }}
                className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3.5 text-[15px] font-display font-bold bg-[#F6F7F9]"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-[#6A6F7A] mb-1.5">Poin = cuci gratis</label>
              <input
                type="number"
                value={freeWashVal}
                onChange={e => {
                  const v = parseInt(e.target.value) || 0;
                  setFreeWashVal(v);
                  scheduleSave({ freeWashVal: v });
                }}
                className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3.5 text-[15px] font-display font-bold bg-[#F6F7F9]"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-[#6A6F7A] mb-1.5">Komisi per cuci (Rp)</label>
              <div className="flex items-center gap-1.5 h-[46px] border border-brand-border rounded-xl px-3.5 bg-[#F6F7F9]">
                <span className="text-[13px] text-brand-ink2 font-semibold">Rp</span>
                <input
                  type="number"
                  value={commissionVal}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 0;
                    setCommissionVal(v);
                    scheduleSave({ commissionVal: v });
                  }}
                  className="focus-ring flex-1 min-w-0 border-none bg-transparent text-[15px] font-display font-bold rounded-[10px]"
                />
              </div>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2 bg-[#F2FBC9] rounded-xl px-3.5 py-2.5">
            <span className="msr text-[18px] text-brand-limeTextDark">info</span>
            <span className="text-[12.5px] text-[#3d5000] font-semibold">Pelanggan mendapat {pointPerTx} poin/transaksi. {freeWashVal} poin = 1x cuci gratis.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
