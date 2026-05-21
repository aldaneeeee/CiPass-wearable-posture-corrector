import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity, BarChart3, BluetoothSearching, Bell, User, Leaf,
} from 'lucide-react';
import ConnectionBadge from './ConnectionBadge';

const nav = [
  { to: '/',         label: 'Dashboard', Icon: Activity },
  { to: '/history',  label: 'History',   Icon: BarChart3 },
  { to: '/device',   label: 'Device',    Icon: BluetoothSearching },
  { to: '/alerts',   label: 'Alerts',    Icon: Bell },
  { to: '/profile',  label: 'Profile',   Icon: User },
];

export default function Layout() {
  return (
    <div className="min-h-full flex">
      <aside className="w-64 shrink-0 border-r border-slate-100 bg-white flex flex-col">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500 text-white grid place-items-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-ink leading-tight">CiPASS</div>
            <div className="text-xs text-sub leading-tight">Posture companion</div>
          </div>
        </div>

        <nav className="px-3 flex-1">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-1',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50',
                ].join(' ')
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <ConnectionBadge />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
