export const Card = ({ children, className = '', title, action }) => {
  return (
    <section className={`overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h3>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
};
