import { clsx } from 'clsx';

const variants = {
  primary: 'bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] active:scale-95',
  lime: 'bg-[#AAFF00] text-[#1a1a1a] hover:bg-[#88DD00] active:scale-95 font-semibold',
  outline: 'border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#f5f5f0] active:scale-95',
  ghost: 'text-[#1a1a1a] hover:bg-[#f5f5f0] active:scale-95',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
