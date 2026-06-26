"use client";

type ToastState = { msg: string; kind: 'success' | 'error' | 'info' };

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast.msg) return null;
  const color =
    toast.kind === 'success' ? 'text-brand-lime' : toast.kind === 'error' ? 'text-[#ff8a8a]' : 'text-white';
  const icon =
    toast.kind === 'success' ? 'check_circle' : toast.kind === 'error' ? 'error' : 'info';
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 bottom-[110px] sm:bottom-[120px] -translate-x-1/2 z-[80] bg-brand-mutedDark text-white px-4 py-3 rounded-xl text-[13.5px] font-semibold shadow-[0_14px_34px_rgba(0,0,0,.3)] flex items-center gap-2 animate-up max-w-[92vw]"
    >
      <span className={`msr text-[18px] ${color}`}>{icon}</span>
      <span className="truncate">{toast.msg}</span>
    </div>
  );
}