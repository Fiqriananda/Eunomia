'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../ui/MarkdownRenderer';
import {
  Inbox,
  CheckCircle2,
  FolderKanban,
  Layers,
  Plus,
  Search,
  Sparkles,
  Users,
  UserPlus,
  Compass,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Building2,
  HelpCircle,
  Shield,
  Activity,
  ListTodo,
  Check,
  LogOut,
  Settings,
  RotateCw,
  Trash2,
  X,
  FileText,
  GitPullRequest,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentTab: 'all' | 'active' | 'backlog' | 'inbox' | 'cycles' | 'trash' | 'team' | 'triage' | 'requests' | 'projects';
  onTabChange: (tab: 'all' | 'active' | 'backlog' | 'inbox' | 'cycles' | 'trash' | 'team' | 'triage' | 'requests' | 'projects') => void;
  onOpenCreateIssue: () => void;
  onOpenInviteModal: () => void;
  onOpenCommandMenu: () => void;
  onOpenWorkspaceSettings?: () => void;
  onOpenIntakeModal?: () => void;
  onOpenCreateProject?: () => void;
  taskCounts?: { all: number; active: number; backlog: number; trash?: number };
  unreadInboxCount?: number;
  triageCount?: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  currentTab,
  onTabChange,
  onOpenCreateIssue,
  onOpenInviteModal,
  onOpenCommandMenu,
  onOpenWorkspaceSettings,
  onOpenCreateProject,
  taskCounts = { all: 0, active: 0, backlog: 0 },
  unreadInboxCount = 0,
  triageCount = 0,
  onOpenIntakeModal,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { user, workspace, workspaces, setWorkspace, projects, project, setProject, logout, refreshWorkspacesAndProjects } = useAuth();
  const router = useRouter();
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(currentTab === 'trash');
  const wsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setIsWsDropdownOpen(false);
        setIsCreatingWs(false);
      }
    };
    if (isWsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isWsDropdownOpen]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setIsCreatingLoading(true);
    try {
      const created = await api.workspaces.create({ name: newWsName.trim() });
      await refreshWorkspacesAndProjects();
      setWorkspace(created);
      setNewWsName('');
      setIsCreatingWs(false);
      setIsWsDropdownOpen(false);
    } finally {
      setIsCreatingLoading(false);
    }
  };

  const handleTabSelect = (tab: 'all' | 'active' | 'backlog' | 'inbox' | 'cycles' | 'trash' | 'team' | 'triage' | 'requests' | 'projects') => {
    onTabChange(tab);
    onMobileClose?.();
  };

  const handleProjectSelect = (p: typeof project) => {
    setProject(p);
    onMobileClose?.();
  };

  const handleCreateIssueClick = () => {
    onOpenCreateIssue();
    onMobileClose?.();
  };

  const handleInviteClick = () => {
    setIsWsDropdownOpen(false);
    onOpenInviteModal();
    onMobileClose?.();
  };

  const handleCommandClick = () => {
    onOpenCommandMenu();
    onMobileClose?.();
  };

  const handleWorkspaceSettingsClick = () => {
    setIsWsDropdownOpen(false);
    onMobileClose?.();
    router.push('/settings/workspace');
  };

  const renderSidebarBody = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Workspace Switcher Header (Clickable & interactive) */}
        <div className="p-3 border-b border-border/60 flex items-center justify-between relative">
          <div ref={wsRef} className="relative flex-1 mr-2">
            <button
              onClick={() => setIsWsDropdownOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded w-full text-left transition-colors border',
                isWsDropdownOpen
                  ? 'bg-[#181926] border-border text-white'
                  : 'border-transparent hover:bg-[#141522] text-zinc-300 hover:text-white',
              )}
            >
              {workspace?.logoUrl ? (
                <img
                  src={resolveMediaUrl(workspace.logoUrl)}
                  alt={workspace?.name || 'Workspace'}
                  className="w-5 h-5 rounded object-cover shadow-sm shrink-0"
                />
              ) : (
                <span className="w-5 h-5 rounded bg-[#5e6ad2] text-white flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
                  {workspace?.name?.[0] || 'L'}
                </span>
              )}
              <span className="font-semibold truncate max-w-[110px]">
                {workspace?.name || 'Workspace'}
              </span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-zinc-500 ml-auto transition-transform duration-150',
                  isWsDropdownOpen && 'rotate-180 text-white',
                )}
              />
            </button>

            {/* Clickable Dropdown Menu */}
            {isWsDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-border/80 bg-[#12131d] shadow-2xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                {/* Current Workspace Info */}
                <div className="px-2 py-1.5 border-b border-border/40">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Current Workspace
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {workspace?.logoUrl ? (
                        <img
                          src={resolveMediaUrl(workspace.logoUrl)}
                          alt={workspace?.name || 'Workspace'}
                          className="w-5 h-5 rounded object-cover shadow-sm shrink-0"
                        />
                      ) : (
                        <span className="w-5 h-5 rounded bg-[#5e6ad2] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {workspace?.name?.[0] || 'L'}
                        </span>
                      )}
                      <span className="font-medium text-white truncate text-xs">
                        {workspace?.name}
                      </span>
                    </div>
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {workspace?.members?.length || 1} team member{(workspace?.members?.length || 1) > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Other Workspaces list */}
                {workspaces.filter((w) => w.id !== workspace?.id).length > 0 && (
                  <div className="py-1 border-b border-border/40">
                    <div className="text-[10px] font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">
                      Switch Workspace
                    </div>
                    {workspaces
                      .filter((w) => w.id !== workspace?.id)
                      .map((w) => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setWorkspace(w);
                            setIsWsDropdownOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary transition-colors text-zinc-300 hover:text-white flex items-center gap-2"
                        >
                          {w.logoUrl ? (
                            <img
                              src={resolveMediaUrl(w.logoUrl)}
                              alt={w.name}
                              className="w-4 h-4 rounded object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-4 h-4 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-[9px] font-bold">
                              {w.name[0]}
                            </span>
                          )}
                          <span className="truncate">{w.name}</span>
                        </button>
                      ))}
                  </div>
                )}

                {/* Actions: Settings, Invite, Create, Logout */}
                <div className="pt-1 space-y-0.5">
                  <button
                    onClick={handleWorkspaceSettingsClick}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary text-zinc-300 hover:text-white flex items-center gap-2 transition-colors font-medium cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Workspace Settings</span>
                  </button>

                  <button
                    onClick={handleInviteClick}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-primary/15 text-primary flex items-center gap-2 transition-colors font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite members to team</span>
                  </button>

                  {isCreatingWs ? (
                    <form onSubmit={handleCreateWorkspace} className="p-1 space-y-1.5">
                      <input
                        autoFocus
                        type="text"
                        value={newWsName}
                        onChange={(e) => setNewWsName(e.target.value)}
                        placeholder="Workspace name..."
                        className="w-full bg-[#181926] border border-border text-xs rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                      />
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingWs(false)}
                          className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newWsName.trim() || isCreatingLoading}
                          className="px-2 py-0.5 text-[11px] bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90"
                        >
                          {isCreatingLoading ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingWs(true)}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary text-zinc-300 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Create new workspace</span>
                    </button>
                  )}

                  <div className="pt-1 mt-1 border-t border-border/40">
                    <button
                      onClick={() => {
                        setIsWsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-destructive/15 text-destructive flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCommandClick}
              className="p-1.5 rounded hover:bg-secondary text-zinc-400 hover:text-white transition-colors"
              title="Search (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCreateIssueClick}
              className="p-1.5 rounded hover:bg-secondary text-zinc-400 hover:text-white transition-colors"
              title="New Issue (C)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Items (Matching Linear minimalist sidebar) */}
        <div className="p-2 space-y-0.5">
          {/* Inbox */}
          <button
            onClick={() => handleTabSelect('inbox')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
              currentTab === 'inbox'
                ? 'bg-secondary text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Inbox
                className={cn(
                  'w-4 h-4',
                  currentTab === 'inbox' ? 'text-indigo-400' : 'text-zinc-400'
                )}
              />
              <span>Inbox</span>
            </div>
            {unreadInboxCount > 0 && (
              <span className="text-[11px] font-mono text-zinc-400 font-medium">
                {unreadInboxCount}
              </span>
            )}
          </button>

          {/* My issues */}
          <button
            onClick={() => handleTabSelect('all')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
              currentTab === 'all' || currentTab === 'active' || currentTab === 'backlog'
                ? 'bg-secondary text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
            )}
          >
            <div className="flex items-center gap-2.5">
              <svg
                className={cn(
                  'w-4 h-4 shrink-0',
                  currentTab === 'all' || currentTab === 'active' || currentTab === 'backlog'
                    ? 'text-indigo-400'
                    : 'text-zinc-400'
                )}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>My issues</span>
            </div>
            {taskCounts.all > 0 && (
              <span className="text-[11px] font-mono text-zinc-500 font-medium">
                {taskCounts.all}
              </span>
            )}
          </button>

          {/* Reviews / Requests */}
          {workspace?.role !== 'STAKEHOLDER' ? (
            <button
              onClick={() => handleTabSelect('triage')}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
                currentTab === 'triage'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
              )}
            >
              <div className="flex items-center gap-2.5">
                <GitPullRequest
                  className={cn(
                    'w-4 h-4',
                    currentTab === 'triage' ? 'text-amber-400' : 'text-zinc-400'
                  )}
                />
                <span>Reviews</span>
              </div>
              {triageCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              )}
            </button>
          ) : (
            <button
              onClick={() => handleTabSelect('requests')}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
                currentTab === 'requests'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
              )}
            >
              <div className="flex items-center gap-2.5">
                <FileText
                  className={cn(
                    'w-4 h-4',
                    currentTab === 'requests' ? 'text-indigo-400' : 'text-zinc-400'
                  )}
                />
                <span>My Requests</span>
              </div>
            </button>
          )}
        </div>

        {/* Workspace Section (Clean & Collapsible) */}
        <div className="p-2 pt-1 space-y-0.5">
          <div className="px-2.5 py-1.5 flex items-center justify-between text-xs font-medium text-zinc-400 select-none">
            <button
              onClick={() => setIsWorkspaceCollapsed(!isWorkspaceCollapsed)}
              className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
            >
              <span>Workspace</span>
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-zinc-500 transition-transform duration-200',
                  isWorkspaceCollapsed && '-rotate-90'
                )}
              />
            </button>
          </div>

          {!isWorkspaceCollapsed && (
            <div className="space-y-0.5">
              {/* Projects */}
              <button
                onClick={() => {
                  setProject(null);
                  handleTabSelect('projects');
                }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
                  currentTab === 'projects'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <svg
                    className={cn(
                      'w-4 h-4 shrink-0',
                      currentTab === 'projects' ? 'text-indigo-400' : 'text-zinc-400'
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>Projects</span>
                </div>
                {projects.length > 0 && (
                  <span className="text-[11px] font-mono text-zinc-500 font-medium">
                    {projects.length}
                  </span>
                )}
              </button>

              {/* Cycles */}
              {workspace?.cyclesEnabled !== false && (
                <button
                  onClick={() => handleTabSelect('cycles')}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
                    currentTab === 'cycles'
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCw
                      className={cn(
                        'w-4 h-4',
                        currentTab === 'cycles' ? 'text-indigo-400' : 'text-zinc-400'
                      )}
                    />
                    <span>Cycles</span>
                  </div>
                </button>
              )}

              {/* Team */}
              <button
                onClick={() => handleTabSelect('team')}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
                  currentTab === 'team'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Users
                    className={cn(
                      'w-4 h-4',
                      currentTab === 'team' ? 'text-indigo-400' : 'text-zinc-400'
                    )}
                  />
                  <span>Team</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 font-medium">
                  {workspace?.members?.length || 1}
                </span>
              </button>

              {/* More (Dropdown / Expandable) */}
              <div>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left font-medium text-xs',
                    isMoreOpen || currentTab === 'trash'
                      ? 'text-white bg-secondary/50'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/40'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                    <span>More</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 text-zinc-500 transition-transform duration-200',
                      isMoreOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isMoreOpen && (
                  <div className="mt-1 ml-4 pl-2 border-l border-border/50 space-y-0.5">
                    {workspace?.role !== 'STAKEHOLDER' && (
                      <button
                        onClick={() => handleTabSelect('requests')}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left',
                          currentTab === 'requests'
                            ? 'text-white bg-secondary/60'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/30'
                        )}
                      >
                        <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Division Requests</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTabSelect('trash')}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors text-left',
                        currentTab === 'trash'
                          ? 'text-rose-400 bg-secondary/60'
                          : 'text-zinc-400 hover:text-rose-400 hover:bg-secondary/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Trash</span>
                      </div>
                      {taskCounts.trash !== undefined && taskCounts.trash > 0 && (
                        <span className="text-[10px] font-mono text-rose-400">
                          {taskCounts.trash}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={handleInviteClick}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors text-left"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Invite Teammates</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile Section */}
      <Link
        href="/profile"
        onClick={() => onMobileClose?.()}
        className="p-3 border-t border-border/60 flex items-center justify-between hover:bg-secondary/40 transition-colors group cursor-pointer"
        title="View & Edit Profile"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <img
            src={
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Alex')}`
            }
            alt=""
            className="w-6 h-6 rounded-full object-cover ring-1 ring-border group-hover:ring-primary transition-all"
          />
          <div className="min-w-0">
            <p className="font-medium text-white truncate text-[11px] group-hover:text-primary transition-colors">
              {user?.name}
            </p>
            <p className="text-[9px] text-zinc-500 truncate">{workspace?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 h-screen shrink-0 bg-[#090a0f] border-r border-border/70 flex flex-col justify-between text-xs select-none sticky top-0 hidden md:flex">
        {renderSidebarBody()}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-72 max-w-[85vw] h-full bg-[#090a0f] border-r border-border/80 flex flex-col justify-between text-xs select-none shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-3 border-b border-border/60 shrink-0">
                <span className="font-semibold text-white text-xs">Workspace Navigation</span>
                <button
                  onClick={onMobileClose}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-secondary/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                {renderSidebarBody()}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
