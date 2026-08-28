import React from 'react';
import { Kanban, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Kanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1">
              Task<span className="text-brand-600">Flow</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Collaborative Workspace
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Notification Engine */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile Menu */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-full py-1 px-3 shadow-2xs">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-brand-100 object-cover border border-brand-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {user.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
