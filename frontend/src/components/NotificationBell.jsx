import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typeIcon = (type) => {
    const icons = { support_request: '🎫', followup_due: '📋', interaction: '💬', academic_update: '📚', goal_progress: '🎯', ai_insight: '🤖', system: '🔔' };
    return icons[type] || '🔔';
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-[#f5f5f0] transition-colors"
      >
        <Bell size={20} className="text-[#1a1a1a]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#AAFF00] text-[#1a1a1a] text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-[#e5e5e5] rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
            <h4 className="text-sm font-semibold text-[#1a1a1a]">Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#f5f5f5]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#9ca3af]">No notifications yet</div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-[#f9f9f9] transition-colors ${!n.isRead ? 'bg-[#AAFF00]/5' : ''}`}
                >
                  <div className="flex gap-3 items-start">
                    <span className="text-lg leading-none mt-0.5">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-[#1a1a1a]' : 'font-medium text-[#2d2d2d]'} truncate`}>{n.title}</p>
                      <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-[#9ca3af] mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#AAFF00] mt-1.5 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
