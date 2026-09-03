export default function StatCard({ title, value, subtitle, icon: Icon, accent = false }) {
  return (
    <div className={`rounded-2xl p-6 border ${accent ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${accent ? 'text-gray-400' : 'text-[#6b7280]'}`}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${accent ? 'text-[#AAFF00]' : 'text-[#1a1a1a]'}`}>{value}</p>
          {subtitle && (
            <p className={`text-xs mt-1 ${accent ? 'text-gray-400' : 'text-[#6b7280]'}`}>{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${accent ? 'bg-white/10' : 'bg-[#f5f5f0]'}`}>
            <Icon size={20} className={accent ? 'text-[#AAFF00]' : 'text-[#1a1a1a]'} />
          </div>
        )}
      </div>
    </div>
  );
}
