import {
  BookOpen, Brain, Briefcase, ChevronLeft, ChevronRight,
  ClipboardList, GraduationCap, LayoutDashboard, LogOut,
  MessageSquare, Star, Target, Users, AlertTriangle,
  TrendingUp, HelpCircle, Compass
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentNav = [
  { to: '/student/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/journey',          icon: Compass,          label: 'My Journey' },
  { to: '/student/profile',          icon: GraduationCap,   label: 'My Profile' },
  { to: '/student/academic-records', icon: BookOpen,         label: 'Academics' },
  { to: '/student/skills',           icon: Star,             label: 'Skills' },
  { to: '/student/goals',            icon: Target,           label: 'Goals' },
  { to: '/student/career',           icon: Briefcase,        label: 'Career' },
  { to: '/student/support',          icon: HelpCircle,       label: 'Support' },
  { to: '/student/ai',               icon: Brain,            label: 'AI Insights' },
];

const coordinatorNav = [
  { to: '/coordinator/dashboard',    icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/coordinator/students',     icon: Users,            label: 'Students' },
  { to: '/coordinator/attention',    icon: AlertTriangle,    label: 'Needs Attention' },
  { to: '/coordinator/interactions', icon: MessageSquare,    label: 'Interactions' },
  { to: '/coordinator/followups',    icon: ClipboardList,    label: 'Follow-ups' },
  { to: '/coordinator/analytics',    icon: TrendingUp,       label: 'Analytics' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const nav = user?.role === 'student' ? studentNav : coordinatorNav;

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col border-r border-[#e5e5e5] bg-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#e5e5e5] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
          <span className="text-[#AAFF00] font-black text-sm">SO</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-xs font-black text-[#1a1a1a] leading-tight tracking-tight">SHIFTING</p>
            <p className="text-xs font-black text-[#AAFF00] leading-tight tracking-tight">ORBITS</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <li key={to}>
                <Link
                  to={to}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${active
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#6b7280] hover:bg-[#f5f5f0] hover:text-[#1a1a1a]'}
                    ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={18} className={active ? 'text-[#AAFF00]' : ''} />
                  {!collapsed && label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-[#e5e5e5] p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#AAFF00] flex items-center justify-center shrink-0">
              <span className="text-[#1a1a1a] font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1a1a1a] truncate">{user?.name}</p>
              <p className="text-[10px] text-[#6b7280] capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={17} />
          {!collapsed && 'Logout'}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#9ca3af] hover:bg-[#f5f5f0] transition-colors mt-1 ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
