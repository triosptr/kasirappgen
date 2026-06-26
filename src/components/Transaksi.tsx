"use client";

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from './Modal';

const IDR = (n: number) => 'Rp' + (n || 0).toLocaleString('id-ID');

type Props = {
  settings: any;
  services: any[];
  technicians: any[];
  customers: any[];
  showToast: (m: string, k?: 'success' | 'error' | 'info') => void;
  refreshData: () => Promise<void> | void;
};

export default function Transaksi({ settings, services, technicians, customers, showToast, refreshData }: Props) {
  const [query, setQuery] = useState('');
  const [hasCust, setHasCust] = useState(false);
  const [form, setForm] = useState({
    customerId: null as string | null,
    owner: '',
    plate: '',
    vehicle: 'Motor',
    phone: '',
    techId: '',
    serviceKey: services?.[0]?.key || '',
    discount: 0,
    usePoints: false,
  });
  const [step, setStep] = useState<'form' | 'verify' | 'invoice'>('form');
  const [invoice, setInvoice] = useState<any>(null);
  const [waCopied, setWaCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const svc = useMemo(() => services.find((s: any) => s.key === form.serviceKey) || services[0], [services, form.serviceKey]);
  const tech = useMemo(() => technicians.find((t: any) => String(t.id) === String(form.techId)), [technicians, form.techId]);
  const cust = useMemo(() => customers.find((c: any) => c.id === form.customerId), [customers, form.customerId]);
  const custPoints = cust?.points || 0;
  const pointPerTx = settings?.point_per_tx || 10;
  const threshold = settings?.point_for_free_wash || 150;
  const canRedeem = form.usePoints && custPoints >= threshold;

  const subtotal = svc?.price || 0;
  const discAmt = Math.round(subtotal * form.discount / 100);
  const total = canRedeem ? 0 : Math.max(0, subtotal - discAmt);

  const reset = () => {
    setForm({
      customerId: null,
      owner: '',
      plate: '',
      vehicle: 'Motor',
      phone: '',
      techId: '',
      serviceKey: services?.[0]?.key || '',
      discount: 0,
      usePoints: false,
    });
    setHasCust(false);
    setQuery('');
    setInvoice(null);
    setWaCopied(false);
    setStep('form');
  };

  const searchCust = async () => {
    const q = query.toLowerCase().trim();
    if (!q) return showToast('Masukkan nama / No. WA / No. Polisi', 'info');
    let found: any = null;
    let vehicleHit: any = null;
    const { data: c } = await supabase
      .from('gen_customers')
      .select('*')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(1)
      .maybeSingle();
    found = c;
    if (!found) {
      const { data: v } = await supabase
        .from('vehicles')
        .select('customer_id, plate, vehicle_type')
        .ilike('plate', `%${q}%`)
        .limit(1)
        .maybeSingle();
      if (v?.customer_id) {
        const { data: c2 } = await supabase.from('gen_customers').select('*').eq('id', v.customer_id).single();
        found = c2;
        vehicleHit = v;
      }
    }
    if (found) {
      setHasCust(true);
      setForm((prev) => ({
        ...prev,
        customerId: found.id,
        owner: found.name,
        phone: found.phone || '',
        plate: vehicleHit?.plate || prev.plate,
        vehicle: vehicleHit?.vehicle_type || prev.vehicle,
      }));
      showToast(`Pelanggan ditemukan • ${found.name}`, 'success');
    } else {
      setHasCust(false);
      setForm((prev) => ({ ...prev, customerId: null }));
      showToast('Pelanggan baru — silakan isi data', 'info');
    }
  };

  const handleVerify = () => {
    if (!form.plate || !form.owner) return showToast('Lengkapi No. Polisi & Nama Pemilik', 'error');
    if (!form.techId) return showToast('Pilih teknisi terlebih dahulu', 'error');
    setStep('verify');
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const invNo = `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      let custId = form.customerId;

      if (!custId) {
        const { data: newCust, error } = await supabase
          .from('gen_customers')
          .insert({
            name: form.owner,
            phone: form.phone,
            points: canRedeem ? 0 : pointPerTx,
          })
          .select()
          .single();
        if (error) throw error;
        custId = newCust?.id || null;
      } else {
        const newPoints = canRedeem ? Math.max(0, custPoints - threshold) : custPoints + pointPerTx;
        await supabase.from('gen_customers').update({ points: newPoints }).eq('id', custId);
      }

      const { data: tx, error } = await supabase
        .from('transactions')
        .insert({
          invoice_no: invNo,
          customer_id: custId,
          owner_name: form.owner,
          vehicle_plate: form.plate,
          vehicle_type: form.vehicle,
          phone: form.phone,
          service_id: svc?.id,
          technician_id: form.techId,
          subtotal,
          discount_pct: form.discount,
          discount_amt: discAmt,
          total,
          points_earned: canRedeem ? 0 : pointPerTx,
          points_redeemed: canRedeem,
          status: 'antri',
        })
        .select()
        .single();
      if (error) throw error;

      // Insert/update vehicle
      if (custId && form.plate) {
        const { data: existing } = await supabase
          .from('vehicles')
          .select('id')
          .eq('customer_id', custId)
          .eq('plate', form.plate)
          .maybeSingle();
        if (!existing) {
          await supabase.from('vehicles').insert({
            customer_id: custId,
            plate: form.plate,
            vehicle_type: form.vehicle,
          });
        }
      }

      setInvoice(tx);
      setStep('invoice');
      showToast(`Invoice ${invNo} tersimpan`, 'success');
      await refreshData();
    } catch (e: any) {
      showToast(e?.message || 'Gagal membuat invoice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const waText = () => {
    const dt = new Date();
    const dateStr = dt.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const lines: string[] = [];
    lines.push('*GEN AUTO CARE*');
    lines.push('_Groom Every Need_');
    lines.push('--------------------------------');
    lines.push(`No Invoice : ${invoice?.invoice_no || '-'}`);
    lines.push(`Tanggal    : ${dateStr}`);
    lines.push('--------------------------------');
    lines.push(`Pelanggan  : ${form.owner || '-'}`);
    lines.push(`No. Polisi : ${form.plate || '-'}`);
    lines.push(`Kendaraan  : ${form.vehicle || '-'}`);
    lines.push(`Teknisi    : ${tech?.name || '-'}`);
    lines.push('--------------------------------');
    lines.push(`${svc?.name || '-'}  ${IDR(subtotal)}`);
    if (form.discount > 0) lines.push(`Diskon ${form.discount}%   -${IDR(discAmt)}`);
    if (canRedeem) lines.push('Tukar Poin (cuci gratis)');
    lines.push('--------------------------------');
    lines.push(`*TOTAL : ${IDR(total)}*`);
    lines.push(`Poin   : +${invoice?.points_earned ?? 0}`);
    lines.push('--------------------------------');
    lines.push('Terima kasih sudah mencuci di GEN! 🏍️✨');
    return lines.join('\n');
  };

  const copyWA = async () => {
    try {
      await navigator.clipboard.writeText(waText());
      setWaCopied(true);
      showToast('Teks invoice disalin — siap kirim WhatsApp', 'success');
      setTimeout(() => setWaCopied(false), 2500);
    } catch {
      showToast('Gagal menyalin teks', 'error');
    }
  };

  const presets = settings?.discount_presets?.length ? settings.discount_presets : [0, 5, 10, 15, 20];

  return (
    <div className="animate-up flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-[22px] sm:text-[28px] tracking-tight">Transaksi</h1>
        <p className="text-[12.5px] sm:text-[13.5px] text-brand-ink2 mt-1">Buat transaksi cuci motor & generate invoice.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3.5 items-start">
        {/* FORM */}
        <div className="flex flex-col gap-3.5">
          {/* Cari Pelanggan */}
          <Card title="Cari Pelanggan" icon="search" tint="#1535D4">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-background border border-brand-border rounded-xl px-3 h-12">
                <span className="msr text-[20px] text-brand-ink2">search</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchCust()}
                  placeholder="Nama / No. WA / No. Polisi"
                  className="focus-ring flex-1 border-none bg-transparent text-[14px] h-full"
                />
              </div>
              <button
                onClick={searchCust}
                className="focus-ring border-none bg-brand-primary text-white font-bold text-[13.5px] px-4 sm:px-5 rounded-xl"
              >
                Cari
              </button>
            </div>
            {hasCust && cust && (
              <div className="flex items-center gap-2 mt-2.5 bg-[#F2FBC9] border border-[#DEF06B] rounded-xl px-3 py-2">
                <span className="msr text-[18px] text-brand-limeTextDark">how_to_reg</span>
                <span className="text-[12.5px] font-semibold text-[#3d5000]">
                  Pelanggan terdaftar • {cust.name} • {custPoints} poin
                </span>
              </div>
            )}
          </Card>

          {/* Data Kendaraan & Pemilik */}
          <Card title="Data Kendaraan & Pemilik" icon="directions_car" tint="#1535D4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <Field label="No. Polisi">
                <input
                  value={form.plate}
                  onChange={(e) => setForm({ ...form, plate: e.target.value })}
                  placeholder="B 1234 ABC"
                  className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] font-display font-bold uppercase"
                />
              </Field>
              <Field label="Jenis Kendaraan">
                <input
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  placeholder="Honda Vario"
                  className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC]"
                />
              </Field>
              <Field label="Nama Pemilik">
                <input
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  placeholder="Nama pelanggan"
                  className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC]"
                />
              </Field>
              <Field label="No. WhatsApp">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812xxxx"
                  inputMode="tel"
                  className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC]"
                />
              </Field>
            </div>

            <Field label="Teknisi" className="mt-3">
              <select
                value={form.techId}
                onChange={(e) => setForm({ ...form, techId: e.target.value })}
                className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] bg-[#FAFBFC]"
              >
                <option value="">Pilih teknisi…</option>
                {technicians?.map((t: any) => (
                  <option key={t.id} value={t.id} disabled={!t.present}>
                    {t.name} {t.present ? '' : '(libur)'}
                  </option>
                ))}
              </select>
            </Field>
          </Card>

          {/* Pilih Jasa */}
          <Card title="Pilih Jasa Cuci" icon="local_car_wash" tint="#1535D4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {services?.map((s: any) => {
                const sel = form.serviceKey === s.key;
                return (
                  <button
                    key={s.id}
                    onClick={() => setForm({ ...form, serviceKey: s.key })}
                    className={`focus-ring relative text-left p-3.5 rounded-2xl border-2 transition-all ${
                      sel ? '' : 'border-brand-border bg-white hover:bg-[#FAFBFC]'
                    }`}
                    style={{
                      borderColor: sel ? s.color : undefined,
                      backgroundColor: sel ? s.soft_color : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span
                        className="msr text-[22px]"
                        style={{
                          color: sel ? s.color : 'transparent',
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        check_circle
                      </span>
                    </div>
                    <div className="font-display font-bold text-[14.5px]">{s.name}</div>
                    <div className="text-[11px] text-brand-ink2 mt-0.5">{s.duration_min} menit</div>
                    <div className="font-display font-bold text-[16px] mt-2">{IDR(s.price)}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* INVOICE PREVIEW (sticky only on large) */}
        <div className="lg:sticky lg:top-[80px] bg-brand-mutedDark text-white rounded-2xl p-5 shadow-[0_18px_40px_rgba(23,26,34,.25)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="msr text-[22px] text-brand-lime">receipt_long</span>
            <span className="font-display font-bold text-[17px]">Ringkasan Invoice</span>
          </div>
          <div className="text-[12px] text-white/50 mb-4">Detail tagihan terbentuk otomatis.</div>

          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <div className="text-[13.5px] font-bold">{svc?.name || 'Pilih Jasa'}</div>
              <div className="text-[11.5px] text-white/50">Subtotal jasa</div>
            </div>
            <div className="font-display font-bold text-[15px]">{IDR(subtotal)}</div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-white/70">Preset Diskon</span>
              <span className="text-[11px] text-white/45">{form.discount}% dipilih</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2 pb-1">
              {presets.map((v: number) => {
                const sel = form.discount === v;
                return (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, discount: v })}
                    className={`focus-ring shrink-0 h-9 min-w-12 px-3 rounded-lg text-[12.5px] font-bold transition ${
                      sel ? 'bg-brand-lime text-[#171a12]' : 'bg-white/10 text-white/85'
                    }`}
                  >
                    {v}%
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 py-2">
            <span className="text-[12.5px] text-white/70">Diskon Manual</span>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2 py-1">
              <input
                type="number"
                value={form.discount}
                onChange={(e) =>
                  setForm({ ...form, discount: Math.min(100, Math.max(0, Number(e.target.value))) })
                }
                className="focus-ring w-12 border-none bg-transparent text-white text-[14px] font-display font-bold text-right"
              />
              <span className="text-[12.5px] text-white/60">%</span>
            </div>
          </div>
          {form.discount > 0 && (
            <div className="flex justify-between text-[12.5px] text-brand-lime pb-1">
              <span>Potongan diskon</span>
              <span className="font-display font-bold">-{IDR(discAmt)}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5 mt-3 p-3 bg-white/5 rounded-xl">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="msr text-[17px] text-brand-lime">loyalty</span>
                <span className="text-[13px] font-bold">Tukar Poin</span>
              </div>
              <div className="text-[11px] text-white/50 mt-1">
                {threshold} poin = 1× cuci gratis • Poin saat ini: {custPoints}
              </div>
            </div>
            <button
              onClick={() => {
                if (!cust) return showToast('Cari/daftarkan pelanggan dulu', 'info');
                if (!form.usePoints && custPoints < threshold) {
                  return showToast(`Poin belum cukup (${custPoints}/${threshold})`, 'error');
                }
                setForm({ ...form, usePoints: !form.usePoints });
              }}
              className="focus-ring relative w-12 h-7 rounded-full transition-all"
              style={{ backgroundColor: form.usePoints ? '#1535D4' : '#D5D8DE' }}
              aria-label="Tukar poin"
            >
              <span
                className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all shadow"
                style={{ left: form.usePoints ? '25px' : '3px' }}
              />
            </button>
          </div>
          {canRedeem && (
            <div className="text-[12px] text-brand-lime mt-2 flex items-center gap-1">
              <span className="msr text-[15px]">check_circle</span>Cuci gratis diterapkan
            </div>
          )}

          <div className="flex items-end justify-between mt-4 pt-4 border-t border-dashed border-white/20">
            <div>
              <div className="text-[12px] text-white/50">Total Bayar</div>
              <div className="text-[11px] text-brand-lime mt-0.5">+{canRedeem ? 0 : pointPerTx} poin pelanggan</div>
            </div>
            <div className="font-display font-bold text-[28px]">{IDR(total)}</div>
          </div>

          <button
            onClick={handleVerify}
            className="focus-ring w-full mt-4 h-[52px] border-none rounded-xl bg-brand-lime text-brand-mutedDark font-display font-bold text-[15px] cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="msr text-[20px]">verified</span>Generate Invoice
          </button>
        </div>
      </div>

      {/* VERIFY */}
      <Modal
        open={step === 'verify'}
        onClose={() => setStep('form')}
        contentClassName="w-[min(94vw,440px)] bg-white rounded-[24px] p-6 sm:p-7 animate-pop shadow-[0_40px_100px_rgba(8,16,42,.45)]"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center text-white">
            <span className="msr text-[24px]">fact_check</span>
          </div>
          <div>
            <div className="font-display font-bold text-[18px]">Verifikasi Data</div>
            <div className="text-[12.5px] text-brand-ink2">Pastikan data sudah benar</div>
          </div>
        </div>
        <div className="bg-[#F6F7F9] rounded-2xl p-4 flex flex-col gap-1.5 text-[13px]">
          <Row label="No. Polisi" value={form.plate} mono />
          <Row label="Kendaraan" value={form.vehicle} />
          <Row label="Pemilik" value={form.owner} />
          <Row label="Teknisi" value={tech?.name || '-'} />
          <Row label="Jasa" value={svc?.name} />
          <div className="h-px bg-brand-border my-1.5" />
          <Row label="Subtotal" value={IDR(subtotal)} mono />
          {form.discount > 0 && <Row label={`Diskon ${form.discount}%`} value={`-${IDR(discAmt)}`} mono primary />}
          {canRedeem && <Row label="Tukar Poin" value="✓ GRATIS" primary />}
          <div className="flex justify-between items-center mt-1">
            <span className="font-bold text-[14px]">Total</span>
            <span className="font-display font-bold text-[20px] text-brand-primary">{IDR(total)}</span>
          </div>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={() => setStep('form')}
            disabled={submitting}
            className="focus-ring flex-1 h-[50px] border border-brand-border bg-white rounded-xl font-bold text-[14px] text-brand-ink2 disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="focus-ring flex-[2] h-[50px] border-none bg-brand-primary text-white rounded-xl font-display font-bold text-[14.5px] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <span className="msr text-[18px] animate-spin">progress_activity</span>}
            Konfirmasi & Simpan
          </button>
        </div>
      </Modal>

      {/* INVOICE */}
      <Modal
        open={step === 'invoice'}
        onClose={() => {}}
        closeOnBackdrop={false}
        closeOnEsc={false}
        contentClassName="w-[min(94vw,440px)] bg-white rounded-[24px] overflow-hidden animate-pop shadow-[0_40px_100px_rgba(8,16,42,.45)]"
      >
        {invoice && (
          <>
            <div className="bg-brand-mutedDark text-white p-5 relative">
              <div className="flex items-center justify-between">
                <img src="/assets/logo.png" className="h-7" alt="logo" />
                <span className="bg-brand-lime/15 text-brand-lime text-[11px] font-bold px-2.5 py-1 rounded-full">LUNAS</span>
              </div>
              <div className="mt-3 text-[12px] text-white/55">No. Invoice</div>
              <div className="font-display font-bold text-[18px]">{invoice.invoice_no}</div>
              <div className="text-[12px] text-white/55 mt-0.5">
                {new Date(invoice.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-1.5">
                <Row label="Pelanggan" value={invoice.owner_name} />
                <Row label="No. Polisi" value={invoice.vehicle_plate} mono />
                <Row label="Teknisi" value={tech?.name} />
                <div className="h-px bg-[#EDEFF2] my-1" />
                <Row label={svc?.name || ''} value={IDR(subtotal)} mono />
                {form.discount > 0 && (
                  <Row label={`Diskon ${form.discount}%`} value={`-${IDR(discAmt)}`} mono primary />
                )}
                {canRedeem && <Row label="Tukar Poin" value="✓ GRATIS" primary />}
              </div>

              <div className="flex justify-between items-center mt-3 p-3.5 bg-[#F2FBC9] rounded-xl">
                <div>
                  <div className="text-[12px] text-brand-limeTextDark font-semibold">Total Bayar</div>
                  <div className="text-[11px] text-brand-limeText mt-0.5">+{invoice.points_earned} poin diterima</div>
                </div>
                <div className="font-display font-bold text-[26px] text-[#171a12]">{IDR(total)}</div>
              </div>

              <div className="mt-4 bg-[#0f3d1a] rounded-xl p-3.5 relative">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="msr text-[18px] text-brand-wa">chat</span>
                  <span className="text-[12.5px] font-bold text-white">Pesan WhatsApp</span>
                </div>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/80 font-mono m-0 max-h-[150px] overflow-auto">
                  {waText()}
                </pre>
              </div>

              <button
                onClick={copyWA}
                className="focus-ring w-full mt-3 h-[50px] border-none rounded-xl bg-brand-wa text-[#063d1a] font-bold text-[14.5px] cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="msr text-[20px]">content_copy</span>
                {waCopied ? 'Tersalin ✓' : 'Salin Teks & Kirim WhatsApp'}
              </button>
              <button
                onClick={reset}
                className="focus-ring w-full mt-3 h-12 border border-brand-border bg-white rounded-xl font-bold text-[14px] text-brand-muted"
              >
                Transaksi Baru
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function Card({ title, icon, tint = '#1535D4', children }: any) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E7ECFD' }}>
          <span className="msr text-[18px]" style={{ color: tint }}>{icon}</span>
        </span>
        <span className="font-display font-bold text-[14.5px]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-[11.5px] font-semibold text-brand-ink2 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, mono, primary }: any) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className={primary ? 'text-brand-primary font-semibold' : 'text-brand-ink2'}>{label}</span>
      <span
        className={`${mono ? 'font-display font-bold' : 'font-semibold'} ${
          primary ? 'text-brand-primary' : 'text-brand-ink'
        }`}
      >
        {value}
      </span>
    </div>
  );
}