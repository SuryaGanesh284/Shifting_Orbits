export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f0] flex items-center justify-center mb-4">
          <Icon size={28} className="text-[#d1d1d1]" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[#1a1a1a] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6b7280] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
