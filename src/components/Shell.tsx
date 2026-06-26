"use client";

import IconButton from './IconButton';

const NAV = [
  { id: 'dashboard', icon: 'space_dashboard', label: 'Home' },
  { id: 'transaksi', icon: 'point_of_sale', label: 'Transaksi' },
  { id: 'pendapatan', icon: 'monitoring', label: 'Income' },
  { id: 'pelanggan', icon: 'group', label: 'Customer' },
  { id: 'teknisi', icon: 'engineering', label: 'Teknisi' },
];

export default function Shell({
  screen,
  setScreen,
  todayLabel,
  onLogout,
  children,
}: {
  screen: string;
  setScreen: (s: string) => void;
  todayLabel: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#F4F5F8]">
      {/* Top header (sticky, modern) */}
      <header className="sticky top-0 z-40 bg-brand-primary text-white border-b border-brand-dark">
        <div className="max-w-[1180px] mx-auto flex items-center gap-3 px-3 sm:px-5 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="GEN Auto Care" className="h-9 sm:h-11 w-auto object-contain" />
            <div className="leading-tight">
              <div className="font-display font-bold text-[13.5px] sm:text-[15px]">GEN Auto Care</div>
              <div className="text-[10.5px] sm:text-[11px] text-white/65">{todayLabel}</div>
            </div>
          </div>
          <div className="flex-1" />
          <IconButton
            icon="settings"
            label="Pengaturan"
            onClick={() => setScreen('setting')}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-brand-border bg-white flex items-center justify-center text-brand-muted"
            iconClassName="text-[20px] sm:text-[22px]"
          />
          <button
            onClick={onLogout}
            aria-label="Keluar"
            className="focus-ring flex items-center gap-2 bg-white border border-brand-border rounded-xl p-1.5 pr-3 h-10 sm:h-11"
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-display font-bold text-[12px] sm:text-[13px]">
              KA
            </span>
            <span className="leading-tight text-left">
              <span className="block text-[12px] sm:text-[12.5px] font-bold text-brand-ink">Kasir A</span>
              <span className="block text-[10px] sm:text-[10.5px] text-brand-ink2">Shift Pagi</span>
            </span>
            <span className="msr text-[18px] text-[#B0B4BC] ml-1">logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1180px] mx-auto px-3 sm:px-5 pt-4 pb-[calc(110px+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* Bottom navigation: floating glass pill on iPad, full-width on phone */}
      <nav
        className="fixed left-0 right-0 bottom-0 z-50 px-3 sm:px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pointer-events-none"
        aria-label="Navigasi utama"
      >
        <div className="max-w-[1180px] mx-auto flex justify-center">
          <ul className="pointer-events-auto grid grid-cols-5 w-full sm:w-auto sm:flex sm:gap-1 bg-brand-primary/95 backdrop-blur border border-white/10 rounded-2xl sm:rounded-[22px] p-1.5 shadow-[0_18px_44px_rgba(21,53,212,.34)]">
            {NAV.map((n) => {
              const active = screen === n.id;
              return (
                <li key={n.id} className="contents">
                  <button
                    onClick={() => {
                      setScreen(n.id);
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={`focus-ring relative flex flex-col items-center justify-center gap-0.5 sm:min-w-[72px] px-2 sm:px-3 py-2 border-none cursor-pointer rounded-xl transition-all duration-200 ${
                      active ? 'bg-brand-lime text-[#171a12]' : 'bg-transparent text-white'
                    }`}
                  >
                    <span
                      className="msr"
                      style={{
                        fontSize: '21px',
                        color: active ? '#171a12' : 'rgba(255,255,255,.85)',
                        fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {n.icon}
                    </span>
                    <span className={`text-[10px] sm:text-[10.5px] font-bold ${active ? 'text-[#171a12]' : 'text-white/85'}`}>
                      {n.label}
                    </span>
                    {active && (
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-brand-mutedDark/80" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}