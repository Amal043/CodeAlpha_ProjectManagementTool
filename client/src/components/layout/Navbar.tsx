import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, Sun, Moon, Menu, Bell, Search, Command } from 'lucide-react';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Left: Logo + Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="TaskFlow Logo"
            className="w-8 h-8 object-contain"
          />
          <h1 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight leading-none hidden sm:block">
            Task<span className="text-brand-600 dark:text-brand-400">Flow</span>
          </h1>
        </div>

        <div className="hidden md:block border-l border-slate-200 dark:border-slate-700 h-6 mx-2" />

        {/* Center Search Bar */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search projects, tasks, or members..."
            className="pl-9 pr-16 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-72 lg:w-96 transition-all"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <Command className="w-3 h-3" />K
          </div>
        </div>
      </div>

      {/* Right: Theme, Notifications, User */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Light / Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
        </button>

        <NotificationDropdown />

        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=7c3aed&textColor=ffffff`}
              alt={user.name}
              className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 border-2 border-brand-200 dark:border-brand-700 object-cover"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Member</p>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
