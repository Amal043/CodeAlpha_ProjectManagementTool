import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { Notification } from '../../types';
import { notificationAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const data = await notificationAPI.getAll();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await notificationAPI.markAsRead(n.id);
      } catch (e) {}
    }
    onClose();
    if (n.link) {
      navigate(n.link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{notifications.filter((n) => !n.read).length} unread alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-brand-600" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  n.read
                    ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-75'
                    : 'bg-brand-50/40 dark:bg-brand-950/40 border-brand-200/60 dark:border-brand-800/60 shadow-xs'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{n.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
