import React from 'react';
import { X, HelpCircle, Mail, MessageSquare, ExternalLink, ShieldAlert } from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Help & Documentation</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Guides, FAQs, and support contact</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* FAQs */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Frequently Asked Questions</h4>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-800 dark:text-slate-200">How do project invitations work?</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Enter an email address in the Invite modal. An automated email is dispatched via Brevo with a direct workspace join link. If the user doesn't have an account, they can register and automatically join your project!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-800 dark:text-slate-200">How do I change member roles?</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Project Owners and Admins can assign roles (Owner, Admin, Member, Viewer). Viewers have read-only access and cannot edit or delete tasks.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Is real-time updates enabled?</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Yes! TaskFlow uses Socket.IO. Any task creation, drag-and-drop position changes, or comment additions sync live across all active team members.
              </p>
            </div>
          </div>

          {/* Direct Support */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Need Direct Support?</h4>
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">srivastavaamal013@gmail.com</span>
              </div>
              <a
                href="mailto:srivastavaamal013@gmail.com"
                className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-semibold text-[11px] hover:bg-brand-700 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
