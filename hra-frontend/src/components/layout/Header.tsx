import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, KeyRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar } from '../../store/uiSlice';
import { logoutThunk } from '../../store/authSlice';
import { notificationService } from '../../services/notificationService';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const unread = useAppSelector((s) => s.ui.unreadNotifications);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        dispatch({ type: 'ui/setUnreadNotifications', payload: res.data.unread_count });
      } catch { /* ignore */ }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 flex-shrink-0">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:flex items-center gap-2" />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200" alt="avatar" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary-100">
                {user?.first_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 max-w-32 truncate leading-tight">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize leading-tight">{user?.role}</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  My Profile
                </button>
                <button
                  onClick={() => { navigate('/change-password-required'); setMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-gray-400" />
                  Change Password
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
