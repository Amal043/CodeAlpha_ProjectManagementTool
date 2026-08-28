import React from 'react';
import { X, Users, Shield, Mail } from 'lucide-react';
import { Project, ProjectMember } from '../../types';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

export const TeamMembersModal: React.FC<TeamMembersModalProps> = ({ isOpen, onClose, projects }) => {
  if (!isOpen) return null;

  // Collect unique members across all projects with their roles
  const memberMap = new Map<string, { name: string; email: string; avatarUrl?: string; projects: { name: string; role: string }[] }>();

  projects.forEach((project) => {
    (project.members || []).forEach((m) => {
      const existing = memberMap.get(m.user.id);
      if (existing) {
        existing.projects.push({ name: project.name, role: m.role });
      } else {
        memberMap.set(m.user.id, {
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
          projects: [{ name: project.name, role: m.role }],
        });
      }
    });
  });

  const allMembers = Array.from(memberMap.values());

  const ROLE_COLORS: Record<string, string> = {
    OWNER: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
    ADMIN: 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400',
    MEMBER: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    VIEWER: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-950/60">
              <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Team Members</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{allMembers.length} members across {projects.length} projects</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {allMembers.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">No team members found.</p>
          ) : (
            allMembers.map((member, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <img
                  src={member.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}&backgroundColor=7c3aed&textColor=ffffff`}
                  alt={member.name}
                  className="w-9 h-9 rounded-full bg-brand-100 border-2 border-white dark:border-slate-800 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{member.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" /> {member.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {member.projects.map((p, j) => (
                    <div key={j} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{p.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${ROLE_COLORS[p.role] || ROLE_COLORS.MEMBER}`}>
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
