export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 border rounded-xl text-sm text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#AAFF00] focus:border-transparent transition-all
          ${error ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] bg-white hover:border-[#d1d1d1]'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">{label}</label>
      )}
      <select
        className={`w-full px-4 py-2.5 border rounded-xl text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#AAFF00] focus:border-transparent transition-all
          ${error ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] bg-white hover:border-[#d1d1d1]'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">{label}</label>
      )}
      <textarea
        rows={4}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#AAFF00] focus:border-transparent resize-none transition-all
          ${error ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] bg-white hover:border-[#d1d1d1]'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
