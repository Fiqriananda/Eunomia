'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  Plus,
  Search,
  Command,
  LogOut,
  FolderKanban,
  ChevronDown,
  Building2,
  Check,
  UserPlus,
  Inbox,
  User as UserIcon,
  Users,
  Settings,
  Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EunomiaLogo } from '../ui/EunomiaLogo';

interface NavbarProps {
  viewMode: 'board-priority' | 'board-status' | 'list';
  onViewModeChange: (mode: 'board-priority' | 'board-status' | 'list') => void;
  onOpenCreateTask: () => void;
  onOpenCommandMenu: () => void;
  onOpenInviteModal?: () => void;
  onOpenTeam?: () => void;
  onOpenInbox?: () => void;
  onOpenWorkspaceSettings?: () => void;
  onOpenMobileNav?: () => void;
  unreadInboxCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Navbar({
  viewMode,
  onViewModeChange,
  onOpenCreateTask,
  onOpenCommandMenu,
  onOpenInviteModal,
  onOpenTeam,
  onOpenInbox,
  onOpenWorkspaceSettings,
  onOpenMobileNav,
  unreadInboxCount,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const { user, workspace, project, workspaces, projects, setWorkspace, setProject, logout } =
    useAuth();

  const [isWsOpen, setIsWsOpen] = useState(false);
  const [isProjOpen, setIsProjOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const wsRef = useRef<HTMLDivElement>(null);
  const projRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setIsWsOpen(false);
      }
      if (projRef.current && !projRef.current.contains(e.target as Node)) {
        setIsProjOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-[#090a0f]/90 backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between px-4 sm:px-6">
        {/* Left: Workspace & Project Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Hamburger Button */}
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="p-1.5 -ml-1 rounded-md text-zinc-400 hover:text-white hover:bg-secondary/70 md:hidden transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Eunomia Brand Logo */}
          <div className="flex items-center gap-2 pr-2 border-r border-border/60">
            <div className="w-6 h-6 flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,180,93,0.35)]">
              <EunomiaLogo className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white hidden md:inline">
              Eunomia
            </span>
          </div>

          {/* Workspace Switcher (Click to toggle) */}
          <div ref={wsRef} className="relative">
            <button
              onClick={() => {
                setIsWsOpen((prev) => !prev);
                setIsProjOpen(false);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-colors border',
                isWsOpen
                  ? 'bg-[#181926] border-border text-white'
                  : 'border-transparent hover:bg-secondary/70 text-foreground',
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="max-w-[90px] sm:max-w-[140px] truncate">{workspace?.name || 'Workspace'}</span>
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-zinc-500 transition-transform duration-150',
                  isWsOpen && 'rotate-180 text-white',
                )}
              />
            </button>

            {isWsOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-[#12131d] shadow-2xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Active Workspace
                </div>
                <div className="px-2 py-1.5 rounded bg-secondary/50 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded bg-[#5e6ad2] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                      {workspace?.name?.[0] || 'W'}
                    </span>
                    <span className="text-xs font-medium text-white truncate">
                      {workspace?.name}
                    </span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>

                {workspaces.filter((w) => w.id !== workspace?.id).length > 0 && (
                  <div className="pt-1 border-t border-border/40">
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
                            setIsWsOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary transition-colors text-zinc-300 hover:text-white flex items-center gap-2"
                        >
                          <span className="w-4 h-4 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {w.name[0]}
                          </span>
                          <span className="truncate">{w.name}</span>
                        </button>
                      ))}
                  </div>
                )}

                <div className="pt-1 mt-1 border-t border-border/40 space-y-0.5">
                  {onOpenWorkspaceSettings && (
                    <button
                      onClick={() => {
                        setIsWsOpen(false);
                        onOpenWorkspaceSettings();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary text-zinc-300 hover:text-white flex items-center gap-2 transition-colors font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Workspace settings</span>
                    </button>
                  )}

                  {onOpenInviteModal && (
                    <button
                      onClick={() => {
                        setIsWsOpen(false);
                        onOpenInviteModal();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-primary/15 text-primary flex items-center gap-2 transition-colors font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Invite team members</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="text-zinc-600 text-xs hidden sm:inline">/</span>

          {/* Project Switcher (Click to toggle) */}
          <div ref={projRef} className="relative hidden sm:block">
            <button
              onClick={() => {
                setIsProjOpen((prev) => !prev);
                setIsWsOpen(false);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border',
                isProjOpen
                  ? 'bg-[#181926] border-border text-white'
                  : 'border-transparent hover:bg-secondary/70 text-zinc-300',
              )}
            >
              <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
              <span className="max-w-[130px] truncate">
                {project ? project.name : 'All Projects'}
              </span>
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-zinc-500 transition-transform duration-150',
                  isProjOpen && 'rotate-180 text-white',
                )}
              />
            </button>

            {isProjOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-[#12131d] shadow-2xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="text-[10px] font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">
                  Filter by Project
                </div>
                <button
                  onClick={() => {
                    setProject(null);
                    setIsProjOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between',
                    project === null
                      ? 'bg-secondary text-primary font-medium'
                      : 'hover:bg-secondary text-zinc-300 hover:text-white',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
                    <span>All Projects</span>
                  </div>
                  {project === null && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>

                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProject(p);
                      setIsProjOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between mt-0.5',
                      p.id === project?.id
                        ? 'bg-secondary text-primary font-medium'
                        : 'hover:bg-secondary text-zinc-300 hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#5e6ad2' }}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-zinc-500">{p.key}</span>
                      {p.id === project?.id && <Check className="w-3 h-3 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search, Cmd+K, New Issue, User */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenCommandMenu}
            className="sm:hidden p-1.5 rounded-md hover:bg-secondary text-zinc-400 hover:text-white transition-colors"
            title="Search issues"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Search Bar / Cmd+K trigger */}
          <div
            onClick={onOpenCommandMenu}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-border/80 bg-input/40 hover:bg-input hover:border-zinc-700 cursor-pointer text-xs text-muted-foreground transition-all duration-150"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="pr-4">Search or jump to...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border/80 bg-zinc-800/80 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>

          {/* New Issue Button */}
          <Button
            onClick={onOpenCreateTask}
            variant="linear"
            size="sm"
            className="flex items-center gap-1 font-medium px-2.5 sm:px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Issue</span>
            <span className="sm:hidden">New</span>
            <kbd className="hidden md:inline-block ml-1 rounded bg-white/20 px-1 py-0.2 text-[9px] font-mono font-normal">
              C
            </kbd>
          </Button>

          {/* Inbox Notifications Bell */}
          {onOpenInbox && (
            <button
              onClick={onOpenInbox}
              className="relative p-1.5 rounded-md hover:bg-secondary text-zinc-400 hover:text-white transition-colors"
              title="Open Inbox"
            >
              <Inbox className="w-4 h-4" />
              {unreadInboxCount !== undefined && unreadInboxCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white font-semibold text-[9px] flex items-center justify-center ring-2 ring-[#090a0f] shadow-sm">
                  {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                </span>
              ) : null}
            </button>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-border/60">
            {user && (
              <div
                ref={userRef}
                className="relative"
              >
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="rounded-full ring-1 ring-border p-0.5 hover:ring-primary transition-all focus:outline-none flex items-center"
                  title={`${user.name} (${user.email})`}
                >
                  <img
                    src={
                      user.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
                    }
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-[#12131d] shadow-2xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 border-b border-border/40">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary text-zinc-200 hover:text-white flex items-center gap-2 transition-colors mt-1 font-medium"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-primary" />
                      <span>Profile Settings</span>
                    </Link>

                    {onOpenTeam && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenTeam();
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary text-zinc-200 hover:text-white flex items-center gap-2 transition-colors mt-0.5 font-medium"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Team & Members</span>
                      </button>
                    )}

                    {onOpenWorkspaceSettings && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenWorkspaceSettings();
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary text-zinc-200 hover:text-white flex items-center gap-2 transition-colors mt-0.5 font-medium"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Workspace Settings</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-destructive/20 text-destructive flex items-center gap-2 transition-colors mt-0.5 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub Bar: View Switcher (Priority Board, Status Board, List View) */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 border-t border-border/40 bg-[#0d0e15]/60 text-xs overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1 bg-[#141520] p-0.5 rounded-lg border border-border/60 shrink-0">
          <button
            onClick={() => onViewModeChange('board-priority')}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 shrink-0',
              viewMode === 'board-priority'
                ? 'bg-[#5e6ad2] text-white shadow-[0_0_10px_rgba(94,106,210,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/60',
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Priority</span>
            <span className="hidden lg:inline text-[10px] px-1 py-0.2 rounded bg-black/30 ml-0.5 text-white/90">
              Drag & Drop
            </span>
          </button>

          <button
            onClick={() => onViewModeChange('board-status')}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 shrink-0',
              viewMode === 'board-status'
                ? 'bg-[#5e6ad2] text-white shadow-[0_0_10px_rgba(94,106,210,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/60',
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Status</span>
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 shrink-0',
              viewMode === 'list'
                ? 'bg-[#5e6ad2] text-white shadow-[0_0_10px_rgba(94,106,210,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-secondary/60',
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>

        {/* Inline Quick Filter Search on small screens */}
        <div className="flex sm:hidden items-center shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter..."
            className="h-7 w-24 bg-input text-xs px-2 rounded border border-border text-foreground"
          />
        </div>
      </div>
    </header>
  );
}
