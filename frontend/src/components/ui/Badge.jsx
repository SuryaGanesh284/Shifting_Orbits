const colors = {
  green:  'bg-[#AAFF00]/20 text-[#3a6e00] border border-[#AAFF00]/50',
  lime:   'bg-[#AAFF00] text-[#1a1a1a]',
  gray:   'bg-gray-100 text-gray-600 border border-gray-200',
  blue:   'bg-blue-50 text-blue-700 border border-blue-200',
  yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  red:    'bg-red-50 text-red-600 border border-red-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}

export function statusBadge(status) {
  const map = {
    pending:     { color: 'yellow', label: 'Pending' },
    in_progress: { color: 'blue',   label: 'In Progress' },
    completed:   { color: 'green',  label: 'Completed' },
    resolved:    { color: 'green',  label: 'Resolved' },
    cancelled:   { color: 'gray',   label: 'Cancelled' },
    overdue:     { color: 'red',    label: 'Overdue' },
    deferred:    { color: 'purple', label: 'Deferred' },
    active:      { color: 'green',  label: 'Active' },
    inactive:    { color: 'gray',   label: 'Inactive' },
  };
  const cfg = map[status] || { color: 'gray', label: status };
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}

export function priorityBadge(priority) {
  const map = {
    low:    { color: 'gray',   label: 'Low' },
    medium: { color: 'blue',   label: 'Medium' },
    high:   { color: 'orange', label: 'High' },
    urgent: { color: 'red',    label: 'Urgent' },
  };
  const cfg = map[priority] || { color: 'gray', label: priority };
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}
