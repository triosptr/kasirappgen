"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Transaksi({ customers, technicians, services, settings, showToast, refreshData }: any) {
  const [query, setQuery] = useState('');
  const [hasCust, setHasCust] = useState(false);
  
  const [form, setForm] = useState({
    customerId: null as string | null,
    owner: '',
    plate: '',
    vehicle: 'Motor',
    phone: '',
    techId: '',
    serviceId: 'biasa',
    discount: 0,
    usePoints: false,
  });

  const [step, setStep] = useState('form'); // form, verify, invoice
  const [invoice, setInvoice] = useState<any>(null);

  const searchCust = () => {
    const q = query.toLowerCase().trim();
    if (!q) return;
    const c = customers.find((x: any) => 
      x.name.toLowerCase().includes(q) || 
      (x.phone && x.phone.includes(q))
    );
    if (c) {
      setHasCust(true);
      setForm({ ...form, customerId: c.id, owner: c.name, phone: c.phone || '' });
      showToast('Data ' + c.name + ' ditemukan');
    } else {
      setHasCust(false);
      setForm({ ...form, customerId: null });
      showToast('Pelanggan baru — silakan isi data');
    }
  };

  const getService = (id: string) => services?.find((s: any) => s.key === id) || services?.[0];
  const custPoints = customers?.find((c: any) => c.id === form.customerId)?.points || 0;
  
  const selectedSvc = getService(form.serviceId);
  const subtotal = selectedSvc?.price || 0;
  const discAmt = Math.round(subtotal * form.discount / 100);
  const canRedeem = form.usePoints && custPoints >= (settings?.point_for_free_wash || 150);
  const total = canRedeem ? 0 : (subtotal - discAmt);

  const handleVerify = () => {
    if (!form.plate || !form.owner) return showToast('Lengkapi No. Polisi & Nama Pemilik');
    if (!form.techId) return showToast('Pilih teknisi terlebih dahulu');
    setStep('verify');
  };

  const handleConfirm = async () => {
    const invNo = `INV-${new Date().toISOString().slice(2,10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    
    let custId = form.customerId;
    
    // Create customer if new
    if (!custId) {
      const { data: newCust } = await supabase.from('gen_customers').insert({
        name: form.owner,
        phone: form.phone,
        points: canRedeem ? 0 : (settings?.point_per_tx || 10)
      }).select().single();
      if (newCust) custId = newCust.id;
    } else {
      // Update points
      const newPoints = canRedeem 
        ? custPoints - (settings?.point_for_free_wash || 150) 
        : custPoints + (settings?.point_per_tx || 10);
      await supabase.from('gen_customers').update({ points: newPoints }).eq('id', custId);
    }

    // Insert transaction
    const { data: tx } = await supabase.from('transactions').insert({
      invoice_no: invNo,
      customer_id: custId,
      owner_name: form.owner,
      vehicle_plate: form.plate,
      vehicle_type: form.vehicle,
      phone: form.phone,
      service_id: selectedSvc.id,
      technician_id: form.techId,
      subtotal,
      discount_pct: form.discount,
      discount_amt: discAmt,
      total,
      points_earned: canRedeem ? 0 : (settings?.point_per_tx || 10),
      points_redeemed: canRedeem,
      status: 'antri'
    }).select().single();

    setInvoice(tx);
    setStep('invoice');
    showToast(`Invoice ${invNo} tersimpan`);
    refreshData();
  };

  if (step === 'invoice') {
    return (
      <div className="fixed inset-0 z-[90] bg-[rgba(12,18,40,.6)] backdrop-blur-sm flex items-center justify-center p-5 overflow-auto animate-pop">
        <div className="w-[min(94vw,440px)] bg-white rounded-[24px] overflow-hidden m-auto">
          <div className="bg-brand-mutedDark text-white p-5.5 relative">
            <div className="flex items-center justify-between">
              <img src="/assets/logo.png" className="h-[30px]" alt="logo" />
              <span className="bg-brand-lime/15 text-brand-lime text-[11px] font-bold px-2.5 py-1 rounded-full">LUNAS</span>
            </div>
            <div className="mt-3.5 text-[12px] text-white/50">No. Invoice</div>
            <div className="font-display font-bold text-[18px]">{invoice?.invoice_no}</div>
          </div>
          <div className="p-5.5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px]"><span className="text-brand-ink2">Pelanggan</span><span className="font-bold">{invoice?.owner_name}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-brand-ink2">No. Polisi</span><span className="font-bold font-display">{invoice?.vehicle_plate}</span></div>
              <div className="h-px bg-[#EDEFF2] my-1" />
              <div className="flex justify-between text-[13px]"><span className="text-[#6A6F7A]">{selectedSvc?.name}</span><span className="font-bold font-display">Rp{subtotal.toLocaleString('id-ID')}</span></div>
              {form.discount > 0 && <div className="flex justify-between text-[13px] text-brand-primary"><span>Diskon {form.discount}%</span><span className="font-bold font-display">-Rp{discAmt.toLocaleString('id-ID')}</span></div>}
              {canRedeem && <div className="flex justify-between text-[13px] text-brand-limeText"><span>Tukar poin (gratis)</span><span className="font-bold">✓</span></div>}
            </div>
            <div className="flex justify-between items-center mt-3.5 p-3.5 bg-[#F2FBC9] rounded-xl">
              <div>
                <div className="text-[12px] text-brand-limeTextDark font-semibold">Total Bayar</div>
                <div className="text-[11px] text-brand-limeText mt-0.5">+{invoice?.points_earned} poin diterima</div>
              </div>
              <div className="font-display font-bold text-[26px] text-[#171a12]">Rp{total.toLocaleString('id-ID')}</div>
            </div>
            <button onClick={() => { setStep('form'); setForm({ ...form, owner: '', plate: '', phone: '', customerId: null, discount: 0, usePoints: false }); }} className="w-full mt-4 h-12 border border-brand-border bg-white rounded-xl font-bold text-[14px] text-brand-muted">Transaksi Baru</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="fixed inset-0 z-[90] bg-[rgba(12,18,40,.55)] backdrop-blur-sm flex items-center justify-center p-5">
        <div className="w-[min(94vw,420px)] bg-white rounded-[24px] p-6.5 animate-pop">
          <div className="flex items-center gap-2.5 mb-4.5">
            <div className="w-[46px] h-[46px] rounded-xl bg-brand-primary flex items-center justify-center text-white"><span className="msr text-[24px]">fact_check</span></div>
            <div>
              <div className="font-display font-bold text-[18px]">Verifikasi Data</div>
              <div className="text-[12.5px] text-brand-ink2">Pastikan data sudah benar</div>
            </div>
          </div>
          <div className="bg-[#F6F7F9] rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between text-[13px]"><span className="text-brand-ink2">No. Polisi</span><span className="font-bold font-display">{form.plate}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-brand-ink2">Kendaraan</span><span className="font-semibold">{form.vehicle}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-brand-ink2">Pemilik</span><span className="font-semibold">{form.owner}</span></div>
            <div className="h-px bg-brand-border my-1" />
            <div className="flex justify-between text-[13px]"><span className="text-brand-ink2">Subtotal</span><span className="font-semibold font-display">Rp{subtotal.toLocaleString('id-ID')}</span></div>
            {form.discount > 0 && <div className="flex justify-between text-[13px] text-brand-primary"><span>Diskon {form.discount}%</span><span className="font-bold font-display">-Rp{discAmt.toLocaleString('id-ID')}</span></div>}
            <div className="flex justify-between items-center mt-0.5"><span className="font-bold text-[14px]">Total</span><span className="font-bold font-display text-[20px] text-brand-primary">Rp{total.toLocaleString('id-ID')}</span></div>
          </div>
          <div className="flex gap-2.5 mt-4.5">
            <button onClick={() => setStep('form')} className="flex-1 h-[50px] border border-brand-border bg-white rounded-xl font-bold text-[14px] text-[#6A6F7A]">Kembali</button>
            <button onClick={handleConfirm} className="flex-[2] h-[50px] border-none bg-brand-primary text-white rounded-xl font-display font-bold text-[14.5px]">Konfirmasi & Simpan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-up">
      <div className="mb-5">
        <div className="font-display font-bold text-[clamp(24px,3.4vw,32px)] tracking-tight">Transaksi</div>
        <div className="text-brand-ink2 text-[13.5px] mt-1">Buat transaksi cuci motor & generate invoice.</div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3.5 items-start">
        {/* FORM */}
        <div className="flex flex-col gap-3.5">
          <div className="bg-white border border-brand-border rounded-[20px] p-4.5">
            <div className="text-[11.5px] font-bold tracking-wider uppercase text-brand-ink2 mb-2.5">Cari Pelanggan</div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-background border border-brand-border rounded-xl px-3 h-12">
                <span className="msr text-[20px] text-[#A6AAB2]">search</span>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nama / No. WA / No. Polisi" className="flex-1 border-none bg-transparent text-[14px] h-full focus:outline-none" />
              </div>
              <button onClick={searchCust} className="border-none bg-brand-primary text-white font-bold text-[13.5px] px-4.5 rounded-xl">Cari</button>
            </div>
            {hasCust && (
              <div className="flex items-center gap-2 mt-2.5 bg-[#F2FBC9] border border-[#DEF06B] rounded-xl px-3 py-2">
                <span className="msr text-[18px] text-brand-limeTextDark">how_to_reg</span>
                <span className="text-[12.5px] font-semibold text-[#3d5000]">Pelanggan terdaftar • {form.owner} • {custPoints} poin</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-brand-border rounded-[20px] p-4.5">
            <div className="text-[11.5px] font-bold tracking-wider uppercase text-brand-ink2 mb-3.5">Data Kendaraan & Pemilik</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#6A6F7A] mb-1.5">No. Polisi</label>
                <input value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} placeholder="B 1234 ABC" className="w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] font-display font-semibold bg-[#FAFBFC] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6A6F7A] mb-1.5">Jenis Kendaraan</label>
                <input value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} placeholder="Honda Vario" className="w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6A6F7A] mb-1.5">Nama Pemilik</label>
                <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} placeholder="Nama pelanggan" className="w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6A6F7A] mb-1.5">No. WhatsApp</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0812xxxx" className="w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC] focus:outline-none" />
              </div>
            </div>
            <div className="mt-3.5">
              <label className="block text-[12px] font-semibold text-[#6A6F7A] mb-1.5">Teknisi</label>
              <select value={form.techId} onChange={e => setForm({...form, techId: e.target.value})} className="w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC] cursor-pointer focus:outline-none">
                <option value="">Pilih teknisi…</option>
                {technicians?.map((t: any) => (
                  <option key={t.id} value={t.id} disabled={!t.present}>{t.name} {!t.present && '(libur)'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-[20px] p-4.5">
            <div className="text-[11.5px] font-bold tracking-wider uppercase text-brand-ink2 mb-3.5">Pilih Jasa Cuci</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
              {services?.map((s: any) => {
                const sel = form.serviceId === s.key;
                return (
                  <button key={s.id} onClick={() => setForm({...form, serviceId: s.key})} className="relative cursor-pointer text-left p-3.5 rounded-2xl border-2 transition-all" style={{ borderColor: sel ? s.color : '#E6E8EC', backgroundColor: sel ? s.soft_color : '#fff' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="msr text-[20px]" style={{ color: sel ? s.color : 'transparent', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div className="font-display font-bold text-[14.5px]">{s.name}</div>
                    <div className="text-[11px] text-brand-ink2 mt-0.5">{s.duration_min} mnt</div>
                    <div className="font-display font-bold text-[16px] mt-2">Rp{s.price.toLocaleString('id-ID')}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* INVOICE PREVIEW */}
        <div className="sticky top-[84px] bg-brand-mutedDark text-white rounded-[22px] p-5.5 shadow-[0_18px_40px_rgba(23,26,34,.25)]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display font-bold text-[17px]">Ringkasan Invoice</span>
            <span className="msr text-[22px] text-brand-lime">receipt_long</span>
          </div>
          <div className="text-[12px] text-white/50 mb-4">Detail tagihan akan terbentuk otomatis.</div>

          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <div className="text-[13.5px] font-bold">{selectedSvc?.name || 'Pilih Jasa'}</div>
              <div className="text-[11.5px] text-white/50">Subtotal jasa</div>
            </div>
            <div className="font-display font-bold text-[15px]">Rp{subtotal.toLocaleString('id-ID')}</div>
          </div>

          <div className="flex items-center justify-between py-3.5 pb-1.5">
            <span className="text-[13px] text-white/70">Diskon</span>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2 py-1">
              <input type="number" value={form.discount} onChange={e => setForm({...form, discount: Math.min(100, Math.max(0, Number(e.target.value)))})} className="w-11 border-none bg-transparent text-white text-[14px] font-display font-bold text-right focus:outline-none" />
              <span className="text-[13px] text-white/60">%</span>
            </div>
          </div>
          {form.discount > 0 && (
            <div className="flex justify-between text-[12.5px] text-brand-lime pb-2">
              <span>Potongan diskon</span>
              <span className="font-display font-bold">-Rp{discAmt.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5 mt-2 p-3 bg-white/5 rounded-xl">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="msr text-[17px] text-brand-lime">loyalty</span>
                <span className="text-[13px] font-bold">Tukar Poin</span>
              </div>
              <div className="text-[11px] text-white/50 mt-1">{settings?.point_for_free_wash || 150} poin = 1x cuci gratis</div>
            </div>
            <button onClick={() => setForm({...form, usePoints: !form.usePoints})} className="relative w-11 h-6 rounded-full transition-all" style={{ backgroundColor: form.usePoints ? '#1535D4' : '#D5D8DE' }}>
              <span className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all shadow-[0_1px_3px_rgba(0,0,0,.3)]" style={{ left: form.usePoints ? '23px' : '3px' }} />
            </button>
          </div>
          {canRedeem && (
            <div className="text-[12px] text-brand-lime mt-2 flex items-center gap-1">
              <span className="msr text-[15px]">check_circle</span>Cuci gratis diterapkan
            </div>
          )}

          <div className="flex items-end justify-between mt-4.5 pt-4 border-t border-dashed border-white/20">
            <div>
              <div className="text-[12px] text-white/50">Total Bayar</div>
              <div className="text-[11px] text-brand-lime mt-0.5">+{canRedeem ? 0 : (settings?.point_per_tx || 10)} poin pelanggan</div>
            </div>
            <div className="font-display font-bold text-[28px]">Rp{total.toLocaleString('id-ID')}</div>
          </div>

          <button onClick={handleVerify} className="w-full mt-4.5 h-[52px] border-none rounded-xl bg-brand-lime text-brand-mutedDark font-display font-bold text-[15px] cursor-pointer flex items-center justify-center gap-2">
            <span className="msr text-[20px]">verified</span>Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
