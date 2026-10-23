'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InboxNotification } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Inbox,
  AtSign,
  UserCheck,
  CheckCheck,
  Trash2,
  Check,
  Loader2,
  ExternalLink,
  Sparkles,
  Bell,
  MessageSquare,
  Building2,
  UserPlus,
  Shield,
  X,
  Mail,
  CornerDownRight,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface InboxViewProps {
  onUnreadCountChange?: (count: number) => void;
}

export function InboxView({ onUnreadCountChange }: InboxViewProps) {
  const router = useRouter();
  const { refreshWorkspacesAndProjects, setWorkspace } = useAuth();
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'invitations' | 'assigned' | 'mentioned' | 'replies' | 'updates'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.inbox.get();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
      if (onUnreadCountChange) {
        onUnreadCountChange(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load inbox:', err);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    fetchInbox();
    // Poll every 10 seconds for new notifications in background
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoadingId(id);
    try {
      await api.inbox.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onUnreadCountChange) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.inbox.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.inbox.delete(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (onUnreadCountChange) {
          onUnreadCountChange(Math.max(0, unreadCount - 1));
        }
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleAcceptInvite = async (e: React.MouseEvent, notif: InboxNotification) => {
    e.stopPropagation();
    const tokenOrId = notif.invitation?.token || notif.invitationId || notif.id;
    if (!tokenOrId) return;

    try {
      setActionLoadingId(notif.id);
      const res = await api.invitations.accept(tokenOrId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                isRead: true,
                readAt: new Date().toISOString(),
                invitation: n.invitation ? { ...n.invitation, status: 'ACCEPTED' } : undefined,
              }
            : n,
        ),
      );
      if (!notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
      await refreshWorkspacesAndProjects();
      if (res.workspace) {
        setWorkspace(res.workspace);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (e: React.MouseEvent, notif: InboxNotification) => {
    e.stopPropagation();
    const tokenOrId = notif.invitation?.token || notif.invitationId || notif.id;
    if (!tokenOrId) return;

    try {
      setActionLoadingId(notif.id);
      await api.invitations.decline(tokenOrId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                isRead: true,
                readAt: new Date().toISOString(),
                invitation: n.invitation ? { ...n.invitation, status: 'DECLINED' } : undefined,
              }
            : n,
        ),
      );
      if (!notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenNotification = async (notif: InboxNotification) => {
    if (!notif.isRead) {
      api.inbox.markAsRead(notif.id).catch(() => {});
    }
    if (notif.type === 'WORKSPACE_INVITATION') {
      if (notif.invitation?.token) {
        router.push(`/invitation/${notif.invitation.token}`);
      }
      return;
    }
    if (notif.taskId) {
      router.push(`/issue/${notif.taskId}`);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'invitations') return n.type === 'WORKSPACE_INVITATION';
    if (filter === 'assigned') return n.type === 'ASSIGNED';
    if (filter === 'mentioned') return n.type === 'MENTIONED';
    if (filter === 'replies') return n.type === 'COMMENT_REPLY';
    if (filter === 'updates') return n.type === 'TASK_UPDATE';
    return true;
  });

  const invitationCount = notifications.filter((n) => n.type === 'WORKSPACE_INVITATION' && !n.isRead).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] text-foreground overflow-y-auto">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-border/60 bg-[#0d0e15]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white tracking-tight">Inbox</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Workspace invitations, replies, and updates for tasks you are assigned or subscribed to
            </p>
          </div>
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#151622] p-1 rounded-lg border border-border/60 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                filter === 'all'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5',
                filter === 'unread'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setFilter('replies')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                filter === 'replies'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Replies
            </button>
            <button
              onClick={() => setFilter('updates')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                filter === 'updates'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Task Updates
            </button>
            <button
              onClick={() => setFilter('invitations')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5',
                filter === 'invitations'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <span>Invitations</span>
              {invitationCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                filter === 'assigned'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Assigned
            </button>
            <button
              onClick={() => setFilter('mentioned')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                filter === 'mentioned'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Mentions
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-secondary/70 border border-border/60 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs">Loading inbox updates...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed border-border/40 rounded-2xl bg-[#0f101a]/40 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-[0_0_24px_rgba(99,102,241,0.15)]">
              <Check className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">All caught up!</h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              {filter === 'unread'
                ? 'No unread notifications left. You are completely up to date!'
                : filter === 'invitations'
                ? 'You do not have any pending workspace invitations.'
                : filter === 'assigned'
                ? 'You have not been assigned to any new tasks recently.'
                : filter === 'mentioned'
                ? 'No one has tagged you in comments recently.'
                : 'Your inbox is clear. When team managers invite you or colleagues mention you, they will appear here.'}
            </p>
          </div>
        ) : (
          /* Notifications Feed */
          <div className="space-y-2.5">
            {filteredNotifications.map((notif) => {
              const isInvitation = notif.type === 'WORKSPACE_INVITATION';
              const isAssigned = notif.type === 'ASSIGNED';
              const isReply = notif.type === 'COMMENT_REPLY';
              const isUpdate = notif.type === 'TASK_UPDATE';
              const isDeclined = notif.invitation?.status === 'DECLINED';
              const isAccepted = notif.invitation?.status === 'ACCEPTED';
              const isActionLoading = actionLoadingId === notif.id;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenNotification(notif)}
                  className={cn(
                    'group relative rounded-xl border p-4 transition-all duration-150 cursor-pointer flex items-start gap-3.5',
                    isInvitation
                      ? notif.isRead
                        ? 'bg-[#0f1019]/70 border-border/50 hover:border-border/80'
                        : 'bg-gradient-to-r from-[#15172b] to-[#121320] border-indigo-500/40 shadow-[0_4px_24px_rgba(99,102,241,0.15)]'
                      : notif.isRead
                      ? 'bg-[#0e0f17]/60 border-border/40 hover:bg-[#13141f] hover:border-border/80 text-zinc-300'
                      : 'bg-[#141624] border-indigo-500/30 hover:border-indigo-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-white',
                  )}
                >
                  {/* Left: Type Icon Badge */}
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shadow-sm',
                        isInvitation
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                          : isAssigned
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                          : isReply
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : isUpdate
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-purple-500/15 border-purple-500/30 text-purple-400',
                      )}
                    >
                      {isInvitation ? (
                        <Building2 className="w-4 h-4" />
                      ) : isAssigned ? (
                        <UserCheck className="w-4 h-4" />
                      ) : isReply ? (
                        <CornerDownRight className="w-4 h-4" />
                      ) : isUpdate ? (
                        <Activity className="w-4 h-4" />
                      ) : (
                        <AtSign className="w-4 h-4" />
                      )}
                    </div>

                    {!notif.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-[#141624] animate-pulse" />
                    )}
                  </div>

                  {/* Center: Notification Details */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-1.5 truncate">
                        {notif.actor?.avatarUrl ? (
                          <img
                            src={notif.actor.avatarUrl}
                            alt={notif.actor.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-zinc-800 text-[9px] text-zinc-300 font-bold flex items-center justify-center">
                            {notif.actor?.name?.[0] || 'U'}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-white truncate">
                          {notif.actor?.name || 'Someone'}
                        </span>
                      </div>

                      <span className="text-zinc-500 text-[11px]">•</span>

                      <span className="text-[11px] font-medium text-zinc-400">
                        {isInvitation
                          ? 'invited you to join'
                          : isAssigned
                          ? 'assigned you to'
                          : isReply
                          ? 'replied to your comment on'
                          : isUpdate
                          ? 'updated subscribed task'
                          : 'mentioned you on'}
                      </span>

                      {/* Workspace name for invites */}
                      {isInvitation && notif.workspace && (
                        <span className="text-xs font-semibold text-indigo-300">
                          {notif.workspace.name}
                        </span>
                      )}

                      {/* Task identifier */}
                      {notif.task && (
                        <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 shrink-0">
                          {notif.task.identifier}
                        </span>
                      )}

                      <span className="text-zinc-500 text-[11px]">•</span>

                      <span className="text-[11px] text-zinc-500 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {/* Task Title */}
                    {notif.task && (
                      <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                        {notif.task.title}
                      </h4>
                    )}

                    {/* Invitation Card Body & Actions */}
                    {isInvitation && (
                      <div className="mt-2.5 space-y-3">
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {notif.body}
                        </p>

                        {/* Invitation Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Accepted & Joined</span>
                            </span>
                          ) : isDeclined ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-zinc-800 border border-border text-zinc-400">
                              <X className="w-3.5 h-3.5" />
                              <span>Declined</span>
                            </span>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                disabled={isActionLoading}
                                onClick={(e) => handleAcceptInvite(e, notif)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-7 px-3 flex items-center gap-1.5 shadow-sm shadow-primary/20"
                              >
                                {isActionLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                                <span>Accept Invitation</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isActionLoading}
                                onClick={(e) => handleDeclineInvite(e, notif)}
                                className="text-xs h-7 px-3 text-zinc-400 hover:text-white"
                              >
                                <span>Decline</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comment Body Snippet for Mentions */}
                    {notif.body && notif.type === 'MENTIONED' && (
                      <div className="mt-2 text-xs text-zinc-300 bg-[#090a0f]/80 rounded-lg p-2.5 border border-border/40 font-normal leading-relaxed">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] mb-1 font-medium">
                          <MessageSquare className="w-3 h-3 text-purple-400" />
                          <span>Comment:</span>
                        </div>
                        <p className="italic text-zinc-200">{notif.body}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Actions (Quick hover controls) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notif.id)}
                        disabled={actionLoadingId === notif.id}
                        className="p-1.5 rounded-md hover:bg-secondary text-zinc-400 hover:text-white transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/15 text-zinc-500 hover:text-destructive transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-1.5 text-zinc-500 group-hover:text-zinc-300">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
