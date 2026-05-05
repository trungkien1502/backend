import { X } from 'lucide-react';

export const Modal = ({ isOpen, title, subtitle, children, footer, onClose, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClass = {
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />

      <section className={`relative flex max-h-[90vh] w-full ${sizeClass} flex-col overflow-hidden rounded-lg bg-white shadow-2xl shadow-slate-950/30`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</footer> : null}
      </section>
    </div>
  );
};
