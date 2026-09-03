export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-white border border-[#e5e5e5] rounded-2xl p-6 ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-base font-semibold text-[#1a1a1a]">{title}</h3>
        {subtitle && <p className="text-sm text-[#6b7280] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
