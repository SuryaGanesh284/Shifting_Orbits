export default function ProgressBar({ value = 0, max = 100, label, showPercent = true, color = 'lime' }) {
  const pct = Math.round((value / max) * 100);
  const colors = {
    lime:   'bg-[#AAFF00]',
    blue:   'bg-blue-500',
    green:  'bg-emerald-500',
    orange: 'bg-orange-400',
    red:    'bg-red-400',
  };

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-[#6b7280]">{label}</span>}
          {showPercent && <span className="text-sm font-medium text-[#1a1a1a]">{pct}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
