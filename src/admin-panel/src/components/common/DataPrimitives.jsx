import { Search } from 'lucide-react';

const toneClasses = {
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  violet: 'border-violet-200 bg-violet-50 text-violet-800',
};

export const StatusBadge = ({ children, tone = 'slate' }) => (
  <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${toneClasses[tone] || toneClasses.slate}`}>
    {children}
  </span>
);

export const MetricPill = ({ label, value, tone = 'slate' }) => (
  <div className={`rounded-lg border px-3 py-2 ${toneClasses[tone] || toneClasses.slate}`}>
    <p className="text-[11px] font-semibold uppercase text-current/70">{label}</p>
    <p className="mt-1 text-base font-semibold">{value}</p>
  </div>
);

export const DataToolbar = ({ children, summary, columns = 'two' }) => (
  <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div
        className={`grid gap-3 ${
          columns === 'one'
            ? 'md:grid-cols-1'
            : columns === 'three'
              ? 'md:grid-cols-3'
              : 'md:grid-cols-[minmax(0,1fr)_220px]'
        }`}
      >
        {children}
      </div>
      {summary ? <div className="text-right text-xs font-medium text-slate-500">{summary}</div> : null}
    </div>
  </div>
);

export const EmptyState = ({ title = 'No data found', description = 'Try changing the filters or refreshing the page.' }) => (
  <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
      <Search size={18} />
    </div>
    <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </div>
);
