import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, CalendarCheck, Clock, FilePlus,
  Megaphone, PartyPopper, Receipt, UserCircle, LogOut, X, KeyRound,
  CalendarDays, ClipboardList, Umbrella, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store';
import { logoutThunk } from '../../store/authSlice';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const adminGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Employees', path: '/admin/employees', icon: <Users className="w-5 h-5" /> },
      { label: 'Leave Requests', path: '/admin/leaves', icon: <ClipboardList className="w-5 h-5" /> },
      { label: 'Attendance', path: '/admin/attendance', icon: <Clock className="w-5 h-5" /> },
      { label: 'Payslips', path: '/admin/payslips', icon: <Receipt className="w-5 h-5" /> },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'Events', path: '/admin/events', icon: <PartyPopper className="w-5 h-5" /> },
      { label: 'Holidays', path: '/admin/holidays', icon: <Umbrella className="w-5 h-5" /> },
      { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Password Resets', path: '/admin/password-resets', icon: <KeyRound className="w-5 h-5" /> },
    ],
  },
];

const userGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    ],
  },
  {
    label: 'My Work',
    items: [
      { label: 'My Profile', path: '/profile', icon: <UserCircle className="w-5 h-5" /> },
      { label: 'Attendance', path: '/attendance', icon: <Clock className="w-5 h-5" /> },
      { label: 'Apply Leave', path: '/leaves/apply', icon: <FilePlus className="w-5 h-5" /> },
      { label: 'My Leaves', path: '/leaves', icon: <CalendarCheck className="w-5 h-5" />, end: true },
      { label: 'My Payslips', path: '/payslips', icon: <Receipt className="w-5 h-5" /> },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'Calendar', path: '/calendar', icon: <CalendarDays className="w-5 h-5" /> },
      { label: 'News & Events', path: '/news', icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { isAdmin, user } = useAuth();
  const dispatch = useAppDispatch();
  const groups = isAdmin ? adminGroups : userGroups;

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center">
          <img src="/sta-logo.svg" alt="STA" className="h-8 w-auto" />
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-4 py-2 border-b border-gray-100">
        <span className={clsx(
          'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
          isAdmin ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'
        )}>
          <ShieldCheck className="w-3 h-3" />
          {isAdmin ? 'Admin Panel' : 'Employee Portal'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="sidebar-section-label">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive')
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-200 space-y-1 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          {user?.profile_photo_url ? (
            <img src={user.profile_photo_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="avatar" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.first_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link sidebar-link-inactive w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
