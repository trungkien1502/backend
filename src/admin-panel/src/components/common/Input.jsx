export const Input = ({
  label,
  error,
  type = 'text',
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`
          min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm shadow-slate-100
          placeholder:text-slate-400
          focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100
          disabled:cursor-not-allowed disabled:bg-slate-100
          ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
};
