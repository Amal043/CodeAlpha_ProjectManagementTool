import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, User, Trash2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { Task, Comment, User as UserType, ProjectRole, TaskStatus, TaskPriority } from '../../types';
import { commentAPI, taskAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface TaskDetailModalProps {
  task: Task;
  members: UserType[];
  currentUserRole: ProjectRole | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  members,
  currentUserRole,
  onClose,
  onTaskUpdated,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchComments = async () => {
    try {
      const data = await commentAPI.getByTask(task.id);
      setComments(data.comments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [task.id]);

  useEffect(() => {
    if (!socket) return;

    const handleCommentCreated = (comment: Comment) => {
      if (comment.taskId === task.id) {
        setComments((prev) => [...prev, comment]);
      }
    };

    socket.on('comment:created', handleCommentCreated);
    return () => {
      socket.off('comment:created', handleCommentCreated);
    };
  }, [socket, task.id]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setStatus(newStatus);
    try {
      await taskAPI.update(task.id, { status: newStatus });
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setPriority(newPriority);
    try {
      await taskAPI.update(task.id, { priority: newPriority });
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    setAssigneeId(newAssigneeId);
    try {
      await taskAPI.update(task.id, { assigneeId: newAssigneeId || undefined });
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update assignee:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await commentAPI.create(task.id, newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await taskAPI.delete(task.id);
        onTaskUpdated();
      } catch (err) {
        console.error('Failed to delete task:', err);
        setIsDeleting(false);
      }
    }
  };

  const isViewer = currentUserRole === 'VIEWER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-200">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 text-[10px] font-extrabold uppercase tracking-wider">
              Task Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isViewer && (
              <button
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-snug">{task.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap">
              {task.description || 'No detailed description provided for this task.'}
            </p>
          </div>

          {/* Metadata Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Status
              </label>
              <select
                disabled={isViewer}
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Priority
              </label>
              <select
                disabled={isViewer}
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Assignee
              </label>
              <select
                disabled={isViewer}
                value={assigneeId}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comments Feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Comments & Activity ({comments.length})</h3>
            </div>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <img
                    src={c.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${c.user.name}`}
                    alt={c.user.name}
                    className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 object-cover mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{c.user.name}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4">No comments yet. Start the conversation below!</p>
              )}
            </div>

            {/* Comment Form Input */}
            {!isViewer && (
              <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
