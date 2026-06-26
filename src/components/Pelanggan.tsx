"use client";

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Pelanggan({ customers, services, settings, showToast, refreshData }: any) {
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [addMotorOpen, setAddMotorOpen] = useState(false);
  const [newMotor, setNewMotor] = useState({ plate: '', vehicle: '' });
  const [vehicleCounts, setVehicleCounts] = useState<Map<string, number>>(new Map());
  const [custVehicles, setCustVehicles] = useState<any[]>([]);
  const [custTxs, setCustTxs] = useState<any[]>([]);

  const threshold = settings?.point_for_free_wash || 150;

  const serviceById = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of services || []) m.set(String(s.id), s);
    return m;
  }, [services]);

  useEffect(() => {
    const run = async () => {
      const ids = (customers || []).map((c: any) => c.id).filter(Boolean);
      if (!ids.length) {
        setVehicleCounts(new Map());
        return;
      }
      const { data } = await supabase
        .from('vehicles')
        .select('customer_id')
        .in('customer_id', ids);
      const m = new Map<string, number>();
      for (const v of data || []) {
        const k = String(v.customer_id);
        m.set(k, (m.get(k) || 0) + 1);
      }
      setVehicleCounts(m);
    };
    run();
  }, [customers]);

  useEffect(() => {
    const run = async () => {
      if (!selectedCust?.id) {
        setCustVehicles([]);
        setCustTxs([]);
        return;
      }
      const [vRes, txRes] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*')
          .eq('customer_id', selectedCust.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('*')
          .eq('customer_id', selectedCust.id)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);
      setCustVehicles(vRes.data || []);
      setCustTxs(txRes.data || []);
    };
    run();
  }, [selectedCust]);

  const handleSaveMotor = async () => {
    if (!newMotor.plate) return showToast('Isi nomor polisi');
    
    await supabase.from('vehicles').insert({
      customer_id: selectedCust.id,
      plate: newMotor.plate,
      vehicle_type: newMotor.vehicle || 'Motor'
    });
    
    showToast('Motor ditambahkan');
    setAddMotorOpen(false);
    setNewMotor({ plate: '', vehicle: '' });
    refreshData();
    const vRes = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', selectedCust.id)
      .order('created_at', { ascending: false });
    setCustVehicles(vRes.data || []);
  };

  return (
    <div className="animate-up">
      <div className="mb-5">
        <div className="font-display font-bold text-[clamp(24px,3.4vw,32px)] tracking-tight">Pelanggan</div>
        <div className="text-brand-ink2 text-[13.5px] mt-1">Database pelanggan, poin & riwayat.</div>
      </div>

      <div className="bg-white border border-brand-border rounded-[20px] p-4">
        <div className="flex items-center gap-2 mb-3.5 px-1">
          <span className="msr text-[20px] text-brand-primary">group</span>
          <span className="font-display font-bold text-[15px]">Daftar Pelanggan</span>
          <span className="ml-auto text-[12px] text-[#A6AAB2]">Ketuk untuk lihat detail</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-2.5">
          {customers?.map((c: any) => (
            <div key={c.id} onClick={() => setSelectedCust(c)} className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer border border-[#EDEFF2] bg-white">
              <div className="w-[42px] h-[42px] rounded-xl bg-brand-primary text-white flex items-center justify-center font-display font-bold text-[15px]">
                {c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] truncate">{c.name}</div>
                <div className="text-[11.5px] text-brand-ink2">
                  {c.phone || '-'} • {(vehicleCounts.get(String(c.id)) || 0) + ' motor'}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#F2FBC9] text-brand-limeTextDark px-2 py-0.5 rounded-full">
                <span className="msr text-[14px]">loyalty</span>
                <span className="font-display font-bold text-[12px]">{c.points}</span>
              </div>
              <span className="msr text-[20px] text-[#C9CCD2]">chevron_right</span>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL POPUP */}
      {selectedCust && (
        <div onClick={() => setSelectedCust(null)} className="fixed inset-0 z-[88] bg-[rgba(12,18,40,.55)] backdrop-blur-sm flex items-start justify-center p-5 overflow-auto">
          <div onClick={(e) => e.stopPropagation()} className="w-[min(94vw,560px)] m-auto bg-background rounded-[24px] overflow-hidden animate-pop">
            <div className="bg-brand-mutedDark text-white p-5.5">
              <div className="flex items-center gap-3.5">
                <div className="w-[54px] h-[54px] rounded-2xl bg-brand-lime text-brand-mutedDark flex items-center justify-center font-display font-bold text-[20px]">
                  {selectedCust.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[19px]">{selectedCust.name}</div>
                  <div className="text-[12.5px] text-white/55 flex items-center gap-1 mt-0.5">
                    <span className="msr text-[15px]">call</span>{selectedCust.phone || '-'}
                  </div>
                </div>
                <button onClick={() => setSelectedCust(null)} className="w-9 h-9 border-none rounded-xl bg-white/10 text-white flex items-center justify-center">
                  <span className="msr text-[20px]">close</span>
                </button>
              </div>
              <div className="mt-4 bg-white/5 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12.5px] text-white/60 font-semibold">Poin Loyalti</span>
                  <span className="font-display font-bold text-[18px] text-brand-lime">
                    {selectedCust.points} <span className="text-[12px] text-white/45">/ {threshold}</span>
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-lime" style={{ width: `${Math.min(100, (selectedCust.points / threshold) * 100)}%` }} />
                </div>
                {selectedCust.points >= threshold ? (
                  <div className="text-[11.5px] text-brand-lime mt-2 flex items-center gap-1">
                    <span className="msr text-[15px]">redeem</span>Bisa ditukar 1x cuci gratis!
                  </div>
                ) : (
                  <div className="text-[11.5px] text-white/45 mt-2">Kurang {Math.max(0, threshold - selectedCust.points)} poin lagi untuk cuci gratis</div>
                )}
              </div>
            </div>
            
            <div className="p-4.5 flex flex-col gap-3.5">
              <div className="bg-white border border-brand-border rounded-[18px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold text-[15px]">Motor Terdaftar</span>
                  <button onClick={() => setAddMotorOpen(true)} className="flex items-center gap-1 border-none bg-[#F2FBC9] text-brand-limeTextDark font-bold text-[12px] px-3 py-1.5 rounded-xl">
                    <span className="msr text-[16px]">add</span>Tambah
                  </button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {custVehicles.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 border border-[#EDEFF2] rounded-[13px]">
                      <div className="w-[38px] h-[38px] rounded-xl bg-[#E7ECFD] text-brand-primary flex items-center justify-center">
                        <span className="msr text-[21px]">two_wheeler</span>
                      </div>
                      <div>
                        <div className="font-display font-bold text-[14px]">{m.plate}</div>
                        <div className="text-[12px] text-brand-ink2">{m.vehicle_type || 'Motor'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-brand-border rounded-[18px] p-4">
                <div className="font-display font-bold text-[15px] mb-3">Riwayat Pencucian</div>
                <div className="flex flex-col gap-2.5">
                  {custTxs.filter((t: any) => t.status === 'selesai').slice(0, 10).map((h: any) => {
                    const svc = serviceById.get(String(h.service_id));
                    const dateStr = new Date(h.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    const rating = h.cleanliness_rating ? Number(h.cleanliness_rating).toFixed(1) : '—';
                    return (
                      <div key={h.id} className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: svc?.color || '#1535D4' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold">{svc?.name || 'Jasa'}</div>
                          <div className="text-[11px] text-brand-ink2">{dateStr}</div>
                        </div>
                        {!!h.cleanliness_rating && (
                          <div className="flex items-center gap-0.5 text-brand-star">
                            <span className="msr text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="font-bold text-[12.5px] text-brand-ink">{rating}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-brand-border rounded-[18px] p-4">
                <div className="font-display font-bold text-[15px] mb-3">Riwayat Invoice</div>
                {custTxs.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {custTxs.slice(0, 10).map((iv: any) => {
                      const dateStr = new Date(iv.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                      return (
                        <div key={iv.id} className="flex items-center justify-between p-2.5 bg-[#FAFBFC] border border-[#EDEFF2] rounded-[12px]">
                          <div>
                            <div className="font-display font-bold text-[12.5px]">{iv.invoice_no || '-'}</div>
                            <div className="text-[11px] text-brand-ink2">{dateStr}</div>
                          </div>
                          <div className="font-display font-bold text-[13.5px] text-brand-primary">{'Rp' + Number(iv.total || 0).toLocaleString('id-ID')}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[12.5px] text-[#A6AAB2] py-2">Belum ada invoice.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {addMotorOpen && (
        <div onClick={() => setAddMotorOpen(false)} className="fixed inset-0 z-[90] bg-[rgba(12,18,40,.55)] backdrop-blur-sm flex items-center justify-center p-5">
          <div onClick={(e) => e.stopPropagation()} className="w-[min(94vw,380px)] bg-white rounded-[24px] p-6 animate-pop">
            <div className="font-display font-bold text-[18px] mb-1">Tambah Motor</div>
            <div className="text-[12.5px] text-brand-ink2 mb-4.5">Daftarkan motor lain milik {selectedCust?.name}.</div>
            
            <label className="block text-[12px] font-semibold text-[#6A6F7A] mb-1.5">No. Polisi</label>
            <input value={newMotor.plate} onChange={e => setNewMotor({...newMotor, plate: e.target.value})} placeholder="B 1234 ABC" className="w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] font-display font-semibold mb-3 focus:outline-none" />
            
            <label className="block text-[12px] font-semibold text-[#6A6F7A] mb-1.5">Jenis Kendaraan</label>
            <input value={newMotor.vehicle} onChange={e => setNewMotor({...newMotor, vehicle: e.target.value})} placeholder="Honda Beat" className="w-full h-[46px] border border-brand-border rounded-xl px-3 text-[14px] focus:outline-none" />
            
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setAddMotorOpen(false)} className="flex-1 h-12 border border-brand-border bg-white rounded-xl font-bold text-[14px] text-[#6A6F7A]">Batal</button>
              <button onClick={handleSaveMotor} className="flex-1 h-12 border-none rounded-xl bg-brand-primary text-white font-bold text-[14px]">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
