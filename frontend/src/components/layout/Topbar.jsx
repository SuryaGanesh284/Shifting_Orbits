import NotificationBell from '../NotificationBell';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title }) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-[#e5e5e5] bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-base font-semibold text-[#1a1a1a]">{title}</h1>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#e5e5e5]">
          <div className="w-8 h-8 rounded-full bg-[#AAFF00] flex items-center justify-center">
            <span className="text-[#1a1a1a] font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-[#1a1a1a] hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
