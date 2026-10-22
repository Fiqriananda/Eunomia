'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Workspace, WorkspaceMember, User, Task, WorkspaceInvitation } from '../../types';
import { api } from '../../lib/api';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Crown,
  Search,
  Mail,
  Calendar,
  CheckCircle2,
  Trash2,
  MoreVertical,
  Check,
  ChevronDown,
  Loader2,
  ArrowRight,
  X,
  ExternalLink,
  ListTodo,
  Clock,
  Copy,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { InviteMemberModal } from './InviteMemberModal';
import { ProfileHoverCard } from '../ui/ProfileHoverCard';
import { UserAvatar } from '../ui/UserAvatar';
import Link from 'next/link';

interface TeamViewProps {
  workspace: Workspace;
  currentUser: User | null;
  tasks?: Task[];
  onSelectMemberTasks?: (memberId: string) => void;
  onRefreshWorkspace?: () => void;
}

export function TeamView({
  workspace,
  currentUser,
  tasks = [],
  onSelectMemberTasks,
  onRefreshWorkspace,
}: TeamViewProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>(workspace.members || []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'ADMIN' | 'MEMBER'>('ALL');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Selected member for inspecting their assigned issues
  const [inspectingMember, setInspectingMember] = useState<WorkspaceMember | null>(null);

  // Role updating & deletion states
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<WorkspaceMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Fetch latest members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.workspaces.getMembers(workspace.id);
      setMembers(res);
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      console.error('Failed to fetch workspace members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [workspace.id]);

  // Check if current user is admin or owner
  const currentMember = useMemo(() => {
    if (!currentUser) return null;
    return members.find((m) => m.userId === currentUser.id || m.user?.id === currentUser.id);
  }, [members, currentUser]);

  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';

  // Pending invitations state
  const [pendingInvitations, setPendingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoadingInvites(true);
      const res = await api.workspaces.getInvitations(workspace.id);
      setPendingInvitations(res || []);
    } catch (err) {
      console.error('Failed to load pending invitations:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      fetchInvitations();
    }
  }, [workspace.id, canManage]);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await api.workspaces.cancelInvitation(workspace.id, invitationId);
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invitation');
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/invitation/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Tasks per member map
  const memberTaskMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.assigneeId && !t.isArchived) {
        const list = map.get(t.assigneeId) || [];
        list.push(t);
        map.set(t.assigneeId, list);
      }
    });
    return map;
  }, [tasks]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const name = m.user?.name?.toLowerCase() || '';
      const email = m.user?.email?.toLowerCase() || '';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || email.includes(q);
      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  // Stats
  const totalMembers = members.length;
  const ownerCount = members.filter((m) => m.role === 'OWNER').length;
  const adminCount = members.filter((m) => m.role === 'ADMIN').length;
  const totalAssignedTasks = tasks.filter((t) => t.assigneeId && !t.isArchived).length;

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      setUpdatingMemberId(memberId);
      await api.workspaces.updateMemberRole(workspace.id, memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
      setActiveMenuId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    try {
      setIsDeleting(true);
      await api.workspaces.removeMember(workspace.id, memberToDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      setMemberToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] text-zinc-100 overflow-y-auto">
      {/* Top Header */}
      <div className="border-b border-border/60 bg-[#0c0d14]/80 backdrop-blur px-4 sm:px-6 py-4 sm:py-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Team & Members</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your team roster, roles, and issue assignments in{' '}
              <span className="text-zinc-200 font-medium">{workspace.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canManage ? (
              <Button
                onClick={() => setIsInviteOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-3.5 py-2 shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Teammate</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-border/50 text-[11px] text-zinc-400">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                <span>Admin Only</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#12131d]/60 border border-border/50 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Members</p>
              <p className="text-2xl font-bold text-white mt-0.5">{totalMembers}</p>
            </div>
          </div>

          <div className="bg-[#12131d]/60 border border-border/50 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Workspace Owner</p>
              <p className="text-2xl font-bold text-amber-300 mt-0.5">{ownerCount}</p>
            </div>
          </div>

          <div className="bg-[#12131d]/60 border border-border/50 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Admins</p>
              <p className="text-2xl font-bold text-emerald-300 mt-0.5">{adminCount}</p>
            </div>
          </div>

          <div className="bg-[#12131d]/60 border border-border/50 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Assigned Tasks</p>
              <p className="text-2xl font-bold text-blue-300 mt-0.5">{totalAssignedTasks}</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#12131d]/80 border border-border/60 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team member by name or email..."
              className="pl-8 bg-[#090a0f] border-border/70 text-xs h-8 text-zinc-200 placeholder:text-zinc-600 focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#090a0f] p-1 rounded-lg border border-border/60 w-full sm:w-auto overflow-x-auto">
            {(['ALL', 'OWNER', 'ADMIN', 'MEMBER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase() + 's'}
              </button>
            ))}
          </div>
        </div>

        {/* Pending Invitations Section (Admins/Owners only) */}
        {canManage && (
          <div className="bg-[#12131d]/60 border border-border/60 rounded-xl overflow-hidden shadow-lg p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                    <span>Pending Invitations</span>
                    {pendingInvitations.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Invited teammates awaiting acceptance via email link or their Eunomia inbox
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchInvitations}
                disabled={loadingInvites}
                className="text-[11px] h-7 border-border/60 text-zinc-400 hover:text-white"
              >
                {loadingInvites ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
              </Button>
            </div>

            {loadingInvites && pendingInvitations.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
                Loading invitations...
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="py-4 px-3 rounded-lg bg-[#090a0f]/60 border border-border/40 text-center text-zinc-500 text-xs">
                No pending invitations. All invited members have accepted or been onboarded.
              </div>
            ) : (
              <div className="divide-y divide-border/30 rounded-lg border border-border/40 bg-[#090a0f]/60 overflow-hidden">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#141522]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-zinc-300 text-xs font-semibold shrink-0">
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-xs">{inv.email}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {inv.role}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Awaiting Acceptance</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Invited by {inv.invitedBy?.name || 'Admin'} • Sent via email & inbox
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyInviteLink(inv.token)}
                        className="text-[11px] h-7 px-2.5 text-zinc-300 hover:text-white border border-border/50"
                        title="Copy direct invite link"
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400 mr-1" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1 text-zinc-400" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="text-[11px] h-7 px-2.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members Table */}
        <div className="bg-[#12131d]/40 border border-border/60 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151724]/70 border-b border-border/60 text-zinc-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Workload</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-zinc-300">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-400">No team members found</p>
                        <p className="text-xs text-zinc-600">Try adjusting your search query or role filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isSelf = currentUser && (member.userId === currentUser.id || member.user?.id === currentUser.id);
                    const assignedTasks = memberTaskMap.get(member.userId) || memberTaskMap.get(member.user?.id) || [];
                    const isOwner = member.role === 'OWNER';
                    const isAdmin = member.role === 'ADMIN';

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-[#161826]/70 transition-colors group"
                      >
                        {/* Member Identity */}
                        <td className="py-3.5 px-4">
                          <ProfileHoverCard
                            user={member.user}
                            member={member}
                            workspaceName={workspace?.name}
                            status={isSelf ? 'online' : 'offline'}
                          >
                            <div className="flex items-center gap-3 cursor-pointer group/member">
                              <UserAvatar
                                user={member.user}
                                member={member}
                                size="md"
                                showStatus={true}
                                status={isSelf ? 'online' : 'offline'}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs group-hover/member:underline">
                                    {member.user?.name || 'Unnamed Teammate'}
                                  </span>
                                  {isSelf && (
                                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-500 truncate max-w-[200px] sm:max-w-xs">
                                  {member.user?.email}
                                </div>
                              </div>
                            </div>
                          </ProfileHoverCard>
                        </td>

                        {/* Role Badge / Switcher */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center">
                            {isOwner ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>Owner</span>
                              </span>
                            ) : canManage && !isOwner && !isSelf ? (
                              <div className="relative">
                                <select
                                  value={member.role}
                                  disabled={updatingMemberId === member.id}
                                  onChange={(e) =>
                                    handleRoleChange(member.id, e.target.value as 'ADMIN' | 'MEMBER')
                                  }
                                  className={`appearance-none text-[11px] font-medium rounded-md px-2.5 py-1 pr-6 cursor-pointer border transition-colors ${
                                    isAdmin
                                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/60'
                                      : 'bg-zinc-800/60 text-zinc-300 border-border/80 hover:border-zinc-500'
                                  }`}
                                >
                                  <option value="MEMBER" className="bg-[#12131d] text-zinc-200">
                                    Member
                                  </option>
                                  <option value="ADMIN" className="bg-[#12131d] text-indigo-300">
                                    Admin
                                  </option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-[10px] font-semibold ${
                                  isAdmin
                                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                                    : 'bg-zinc-800/60 text-zinc-400 border border-border/60'
                                }`}
                              >
                                {isAdmin && <ShieldCheck className="w-3 h-3 text-indigo-400" />}
                                <span>{member.role.charAt(0) + member.role.slice(1).toLowerCase()}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Workload / Assigned Tasks */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setInspectingMember(member)}
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white group/btn"
                          >
                            <span className="w-5 h-5 rounded bg-zinc-800/80 border border-border/60 text-zinc-200 flex items-center justify-center font-mono text-[11px] font-bold group-hover/btn:border-primary group-hover/btn:text-primary transition-colors">
                              {assignedTasks.length}
                            </span>
                            <span className="text-[11px] text-zinc-400 group-hover/btn:text-zinc-200 underline-offset-2 hover:underline">
                              {assignedTasks.length === 1 ? 'task' : 'tasks'}
                            </span>
                          </button>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-zinc-400 text-[11px] font-mono">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Active'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Email Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(member.user?.email)}
                              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                              title="Copy Email"
                            >
                              {copiedEmail === member.user?.email ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* View Issues Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectMemberTasks) {
                                  onSelectMemberTasks(member.userId || member.user?.id);
                                } else {
                                  setInspectingMember(member);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition-colors"
                              title="Filter tasks on board"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {/* Remove Member Button */}
                            {canManage && !isOwner && !isSelf && (
                              <button
                                type="button"
                                onClick={() => setMemberToDelete(member)}
                                className="p-1.5 rounded hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition-colors"
                                title="Remove member from workspace"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Member's Issues Drawer / Modal */}
      {inspectingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-[#11121d] border border-border/80 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border/70 flex items-center justify-between bg-[#151726]/80">
              <div className="flex items-center gap-3">
                <img
                  src={
                    inspectingMember.user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      inspectingMember.user?.name || 'User',
                    )}`
                  }
                  alt=""
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
                />
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    {inspectingMember.user?.name}'s Issues
                  </h3>
                  <p className="text-[11px] text-zinc-400">{inspectingMember.user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectingMember(null)}
                className="p-1 rounded hover:bg-secondary text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content: List of assigned issues */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {(() => {
                const memberTasks =
                  memberTaskMap.get(inspectingMember.userId) ||
                  memberTaskMap.get(inspectingMember.user?.id) ||
                  [];

                if (memberTasks.length === 0) {
                  return (
                    <div className="py-10 text-center text-zinc-500 text-xs">
                      No active issues currently assigned to {inspectingMember.user?.name}.
                    </div>
                  );
                }

                return memberTasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/issue/${t.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0c0d14] border border-border/50 hover:border-primary/50 hover:bg-[#141624] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] text-zinc-500">{t.identifier}</span>
                      <span className="font-medium text-xs text-zinc-200 group-hover:text-white truncate">
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {t.status.replace('_', ' ')}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ));
              })()}
            </div>

            <div className="p-3 bg-[#0d0e17] border-t border-border/50 flex justify-between items-center text-xs">
              <span className="text-[11px] text-zinc-500">
                {(memberTaskMap.get(inspectingMember.userId) || []).length} assigned issues in total
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setInspectingMember(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-[#12131d] border border-destructive/40 rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-white text-sm">Remove Team Member?</h3>
            <p className="text-xs text-zinc-400 mt-2">
              Are you sure you want to remove{' '}
              <span className="font-medium text-zinc-200">{memberToDelete.user?.name}</span> (
              {memberToDelete.user?.email}) from <span className="text-white">{workspace.name}</span>?
              They will lose access immediately.
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveMember}
                disabled={isDeleting}
                className="text-xs flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Remove</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={workspace.id}
        onMemberInvited={() => {
          fetchInvitations();
          if (onRefreshWorkspace) onRefreshWorkspace();
        }}
      />
    </div>
  );
}
