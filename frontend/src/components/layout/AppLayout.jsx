import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/student/dashboard':        'Dashboard',
  '/student/profile':          'My Profile',
  '/student/academic-records': 'Academic Records',
  '/student/skills':           'Skills',
  '/student/goals':            'Goals',
  '/student/career':           'Career Profile',
  '/student/support':          'Support Requests',
  '/student/ai':               'AI Insights',
  '/coordinator/dashboard':    'Coordinator Dashboard',
  '/coordinator/students':     'My Students',
  '/coordinator/attention':    'Needs Attention',
  '/coordinator/interactions': 'Interactions',
  '/coordinator/followups':    'Follow-ups',
  '/coordinator/analytics':    'Analytics',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'Shifting Orbits';

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
