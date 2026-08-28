import React, { useState, useEffect } from 'react';
import { X, Send, Trash2, Calendar, User as UserIcon, MessageSquare, Loader2, Clock } from 'lucide-react';
import { Task, Comment, TaskStatus, TaskPriority, ProjectMember } from '../../types';
import { taskAPI, commentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface TaskDetailModalProps {
  task: Task | null;
  members: ProjectMember[];
  canEdit: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  members,
  canEdit,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  useEffect(() => {
    if (!task) return;

    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const data = await commentAPI.getByTask(task.id);
        setComments(data.comments);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [task?.id]);

  // Real-time socket comment updates
  useEffect(() => {
    if (!socket || !task) return;

    const handleCommentCreated = (data: { taskId: string; comment: Comment }) => {
      if (data.taskId === task.id) {
        setComments((prev) => {
          if (prev.some((c) => c.id === data.comment.id)) return prev;
          return [...prev, data.comment];
        });
      }
    };

    socket.on('comment:created', handleCommentCreated);

    return () => {
      socket.off('comment:created', handleCommentCreated);
    };
  }, [socket, task?.id]);

  if (!task) return null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!canEdit) return;
    const updated = { ...task, status: newStatus };
    onTaskUpdated(updated);
    try {
      await taskAPI.update(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
      onTaskUpdated(task);
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (!canEdit) return;
    const updated = { ...task, priority: newPriority };
    onTaskUpdated(updated);
    try {
      await taskAPI.update(task.id, { priority: newPriority });
    } catch (error) {
      console.error('Failed to update priority:', error);
      onTaskUpdated(task);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!canEdit) return;
    const assigneeObj = members.find((m) => m.userId === newAssigneeId)?.user;
    const updated = { ...task, assigneeId: newAssigneeId || null, assignee: assigneeObj };
    onTaskUpdated(updated);
    try {
      await taskAPI.update(task.id, { assigneeId: newAssigneeId || null });
    } catch (error) {
      console.error('Failed to update assignee:', error);
      onTaskUpdated(task);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !canEdit) return;

    setIsSubmittingComment(true);
    try {
      const data = await commentAPI.create(task.id, newComment.trim());
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      onTaskUpdated({
        ...task,
        _count: { comments: (task._count?.comments || 0) + 1 },
      });
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setIsDeletingTask(true);
    try {
      await taskAPI.delete(task.id);
      onTaskDeleted(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeletingTask(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-violet-100 text-violet-700">
                Task Card
              </span>
              <span className="text-xs text-slate-400">Created by {task.createdBy?.name || 'User'}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{task.title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={handleDelete}
                disabled={isDeletingTask}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* Metadata Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                disabled={!canEdit}
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-75"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                disabled={!canEdit}
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-75"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                disabled={!canEdit}
                value={task.assigneeId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-75"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Description
            </h4>
            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px]">
              {task.description || <span className="italic text-slate-400">No description provided for this task.</span>}
            </div>
          </div>

          {/* Real-time Discussion / Comments Feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Comments ({comments.length})
              </h4>
            </div>

            {/* Comment Form */}
            {canEdit && (
              <form onSubmit={handlePostComment} className="mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment or update..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" /> Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No comments yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <img
                      src={c.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${c.user.name}`}
                      alt={c.user.name}
                      className="w-7 h-7 rounded-full bg-violet-100 object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-800">{c.user.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-snug whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
