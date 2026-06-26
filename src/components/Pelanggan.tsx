"use client";

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from './Modal';

const IDR = (n: number) => 'Rp' + (n || 0).toLocaleString('id-ID');

type Props = {
  settings: any;
  services: any[];
  customers: any[];
  transactions: any[];
  showToast: (m: string, k?: 'success' | 'error' | 'info') => void;
  refreshData: () => Promise<void> | void;
};

export default function Pelanggan({ settings, services, customers, transactions, showToast, refreshData }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newMotor, setNewMotor] = useState({ plate: '', vehicle: '' });
  const [busy, setBusy] = useState(false);

  const threshold = settings?.point_for_free_wash || 150;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c: any) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const vehicleCounts = useMemo(() => {
    const m = new Map<string, number>();
    transactions.forEach((t: any) => {
      const k = String(t.customer_id || '');
      if (!k) return;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }, [transactions]);

  useEffect(() => {
    if (!selected) {
      setVehicles([]);
      return;
    }
    supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', selected.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setVehicles(data || []));
  }, [selected]);

  const custTx = useMemo(
    () => (selected ? transactions.filter((t: any) => String(t.customer_id) === String(selected.id)) : []),
    [transactions, selected]
  );

  const serviceById = useMemo(() => {
    const m = new Map<string, any>();
    services.forEach((s: any) => m.set(String(s.id), s));
    return m;
  }, [services]);

  const saveMotor = async () => {
    if (!selected) return;
    if (!newMotor.plate || !newMotor.vehicle) return showToast('Lengkapi No. Polisi & Jenis Kendaraan', 'error');
    setBusy(true);
    const { error } = await supabase.from('vehicles').insert({
      customer_id: selected.id,
      plate: newMotor.plate,
      vehicle_type: newMotor.vehicle,
    });
    setBusy(false);
    if (error) return showToast(error.message, 'error');
    setAddOpen(false);
    setNewMotor({ plate: '', vehicle: '' });
    showToast('Motor berhasil didaftarkan', 'success');
    const vRes = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', selected.id)
      .order('created_at', { ascending: false });
    setVehicles(vRes.data || []);
    refreshData();
  };

  return (
    <div className="animate-up flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] sm:text-[28px] tracking-tight">Pelanggan</h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-brand-ink2 mt-1">Database pelanggan, poin & riwayat.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-3.5 items-start">
        {/* LIST */}
        <section className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-3.5 border-b border-brand-border">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <span className="msr text-[20px]">group</span>
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-[14.5px]">Daftar Pelanggan</div>
              <div className="text-[11px] text-brand-ink2">{filtered.length} dari {customers.length}</div>
            </div>
            <div className="flex items-center gap-2 bg-background border border-brand-border rounded-xl px-3 h-10 w-full max-w-[240px]">
              <span className="msr text-[18px] text-brand-ink2">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / WA…"
                className="focus-ring flex-1 border-none bg-transparent text-[13px] h-full"
              />
            </div>
          </div>
          <div className="max-h-[640px] overflow-auto">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-brand-ink2">
                <span className="msr text-[40px]">person_off</span>
                <div className="mt-2 text-[13px]">Tidak ada pelanggan</div>
              </div>
            )}
            <ul className="flex flex-col">
              {filtered.map((c: any) => {
                const sel = selected?.id === c.id;
                const initials = c.name
                  .split(' ')
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      aria-pressed={sel}
                      className={`focus-ring w-full text-left flex items-center gap-3 p-3.5 border-b border-brand-border transition ${
                        sel ? 'bg-brand-primary/8' : 'bg-white hover:bg-[#FAFBFC]'
                      }`}
                      style={sel ? { backgroundColor: '#E7ECFD' } : undefined}
                    >
                      <div className="w-11 h-11 rounded-xl bg-brand-primary text-white flex items-center justify-center font-display font-bold text-[14px]">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[14px] truncate">{c.name}</div>
                        <div className="text-[11.5px] text-brand-ink2 truncate">
                          {c.phone || '—'} • {vehicleCounts.get(String(c.id)) || 0} motor • {c.points} poin
                        </div>
                      </div>
                      <span className={`msr text-[20px] ${sel ? 'text-brand-primary' : 'text-brand-ink2'}`}>
                        chevron_right
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* DETAIL PANEL */}
        <aside className="lg:sticky lg:top-[80px]">
          {!selected && (
            <div className="bg-white border border-brand-border rounded-2xl p-6 text-center">
              <span className="msr text-[44px] text-brand-ink2">person_search</span>
              <div className="mt-2 font-bold text-[14px]">Pilih pelanggan</div>
              <div className="text-[12px] text-brand-ink2 mt-1">Detail, history, dan invoice akan tampil di sini.</div>
            </div>
          )}
          {selected && (
            <div className="bg-white border border-brand-border rounded-2xl overflow-hidden animate-slide-in">
              <div className="bg-brand-mutedDark text-white p-5 relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-lime text-brand-mutedDark flex items-center justify-center font-display font-bold text-[18px]">
                    {selected.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-[17px] truncate">{selected.name}</div>
                    <div className="text-[12px] text-white/65 flex items-center gap-1 mt-0.5">
                      <span className="msr text-[14px]">call</span>{selected.phone || '—'}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Tutup detail"
                    className="focus-ring w-9 h-9 border-none rounded-xl bg-white/10 text-white flex items-center justify-center lg:hidden"
                  >
                    <span className="msr text-[20px]">close</span>
                  </button>
                </div>
                <div className="mt-4 bg-white/5 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-white/60 font-semibold">Poin Loyalti</span>
                    <span className="font-display font-bold text-[17px] text-brand-lime">
                      {selected.points} <span className="text-[11px] text-white/45">/ {threshold}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-lime"
                      style={{ width: `${Math.min(100, (selected.points / threshold) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-white/55 mt-2">
                    {selected.points >= threshold
                      ? '✓ Bisa ditukar 1× cuci gratis'
                      : `Kurang ${Math.max(0, threshold - selected.points)} poin lagi`}
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3.5 max-h-[480px] overflow-auto">
                {/* Motors */}
                <Block title="Motor Terdaftar" icon="two_wheeler" right={
                  <button
                    onClick={() => setAddOpen(true)}
                    className="focus-ring flex items-center gap-1 border-none bg-[#F2FBC9] text-brand-limeTextDark font-bold text-[12px] px-3 py-1.5 rounded-xl"
                  >
                    <span className="msr text-[16px]">add</span>Tambah
                  </button>
                }>
                  {vehicles.length === 0 ? (
                    <EmptyMini text="Belum ada motor terdaftar" />
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {vehicles.map((m: any) => (
                        <li key={m.id} className="flex items-center gap-3 p-2.5 border border-brand-border rounded-xl">
                          <div className="w-9 h-9 rounded-xl bg-[#E7ECFD] text-brand-primary flex items-center justify-center">
                            <span className="msr text-[20px]">two_wheeler</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-bold text-[13.5px]">{m.plate}</div>
                            <div className="text-[11.5px] text-brand-ink2">{m.vehicle_type || 'Motor'}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Block>

                {/* History */}
                <Block title="Riwayat Pencucian" icon="local_car_wash">
                  {custTx.filter((t: any) => t.status === 'selesai').length === 0 ? (
                    <EmptyMini text="Belum ada pencucian selesai" />
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {custTx
                        .filter((t: any) => t.status === 'selesai')
                        .slice(0, 8)
                        .map((h: any) => {
                          const svc = serviceById.get(String(h.service_id));
                          const dateStr = new Date(h.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                          return (
                            <li key={h.id} className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: svc?.color || '#1535D4' }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold truncate">{svc?.name || 'Jasa'}</div>
                                <div className="text-[11px] text-brand-ink2">{dateStr}</div>
                              </div>
                              {!!h.cleanliness_rating && (
                                <div className="flex items-center gap-0.5 text-brand-star">
                                  <span className="msr text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                  <span className="font-bold text-[12px]">{Number(h.cleanliness_rating).toFixed(1)}</span>
                                </div>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </Block>

                {/* Invoices */}
                <Block title="Riwayat Invoice" icon="receipt_long">
                  {custTx.length === 0 ? (
                    <EmptyMini text="Belum ada invoice." />
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {custTx.slice(0, 8).map((iv: any) => {
                        const dateStr = new Date(iv.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                        return (
                          <li
                            key={iv.id}
                            className="flex items-center justify-between p-2.5 bg-[#FAFBFC] border border-brand-border rounded-xl"
                          >
                            <div>
                              <div className="font-display font-bold text-[12.5px]">{iv.invoice_no || '—'}</div>
                              <div className="text-[11px] text-brand-ink2">{dateStr}</div>
                            </div>
                            <div className="font-display font-bold text-[13.5px] text-brand-primary">
                              {IDR(Number(iv.total || 0))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Block>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        contentClassName="w-[min(94vw,400px)] bg-white rounded-2xl p-6 animate-pop shadow-[0_40px_100px_rgba(8,16,42,.45)]"
      >
        <div className="font-display font-bold text-[18px] mb-1">Tambah Motor</div>
        <div className="text-[12.5px] text-brand-ink2 mb-4">Daftarkan motor lain milik {selected?.name}.</div>
        <label className="block text-[11.5px] font-semibold text-brand-ink2 mb-1.5">No. Polisi</label>
        <input
          value={newMotor.plate}
          onChange={(e) => setNewMotor({ ...newMotor, plate: e.target.value })}
          placeholder="B 1234 ABC"
          className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] font-display font-bold uppercase mb-3"
        />
        <label className="block text-[11.5px] font-semibold text-brand-ink2 mb-1.5">Jenis Kendaraan</label>
        <input
          value={newMotor.vehicle}
          onChange={(e) => setNewMotor({ ...newMotor, vehicle: e.target.value })}
          placeholder="Honda Beat"
          className="focus-ring w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] mb-4"
        />
        <div className="flex gap-2.5">
          <button
            onClick={() => setAddOpen(false)}
            disabled={busy}
            className="focus-ring flex-1 h-12 border border-brand-border bg-white rounded-xl font-bold text-[14px] text-brand-ink2 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={saveMotor}
            disabled={busy}
            className="focus-ring flex-1 h-12 border-none rounded-xl bg-brand-primary text-white font-bold text-[14px] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {busy && <span className="msr text-[18px] animate-spin">progress_activity</span>}
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Block({ title, icon, right, children }: any) {
  return (
    <div className="bg-[#FAFBFC] border border-brand-border rounded-2xl p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <span className="msr text-[16px]">{icon}</span>
        </span>
        <span className="font-display font-bold text-[14px]">{title}</span>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return <div className="text-[12.5px] text-brand-ink2 py-2">{text}</div>;
}