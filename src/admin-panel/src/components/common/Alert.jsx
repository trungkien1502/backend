export const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`flex animate-fadeIn items-start rounded-xl border p-4 shadow-sm ${types[type]}`}>
      <span className="mr-3 text-xl">{icons[type]}</span>
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      )}
    </div>
  );
};
