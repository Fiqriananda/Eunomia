'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceMember } from '../../types';
import { cn } from '../../lib/utils';

export interface ProfileUser {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface ProfileHoverCardProps {
  user?: ProfileUser | null;
  member?: WorkspaceMember | null;
  workspaceName?: string;
  status?: 'online' | 'offline' | 'away';
  localTime?: string;
  roleOrTitle?: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  className?: string;
  disabled?: boolean;
  as?: 'span' | 'div';
}

export function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(name?: string): string {
  if (!name) return '#00b4d8';
  // If name is Mohab Mamdouh or similar cyan preference from screenshot
  const lower = name.toLowerCase();
  if (lower.includes('mohab')) return '#00b4d8';

  const palette = [
    '#00b4d8', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f97316', // Orange
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function ProfileHoverCard({
  user,
  member,
  workspaceName,
  status: customStatus,
  localTime: customLocalTime,
  roleOrTitle,
  children,
  side = 'top',
  align = 'start',
  className = '',
  disabled = false,
  as = 'span',
}: ProfileHoverCardProps) {
  const { user: authUser, workspace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: side,
  });

  const triggerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearTimers = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 270;
    const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 175;
    const gap = 8;

    let placement: 'top' | 'bottom' = side;
    let top = rect.top - cardHeight - gap;

    if (top < 10) {
      top = rect.bottom + gap;
      placement = 'bottom';
    }

    let left = rect.left;
    if (align === 'center') {
      left = rect.left + rect.width / 2 - cardWidth / 2;
    } else if (align === 'end') {
      left = rect.right - cardWidth;
    }

    // Viewport boundaries
    left = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, left));
    top = Math.max(12, Math.min(window.innerHeight - cardHeight - 12, top));

    setCoords({ top, left, placement });
  }, [side, align]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  const handleMouseEnter = () => {
    if (disabled) return;
    clearTimers();
    openTimeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 160);
  };

  const handleMouseLeave = () => {
    clearTimers();
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  const handleCardMouseEnter = () => {
    clearTimers();
  };

  const handleCardMouseLeave = () => {
    clearTimers();
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  // Profile data resolution
  const displayName = user?.name || member?.user?.name || 'Team Member';
  const displayEmail = user?.email || member?.user?.email;
  const avatarUrl = user?.avatarUrl ?? member?.user?.avatarUrl;

  const handle = displayEmail
    ? displayEmail.split('@')[0].toLowerCase()
    : displayName.toLowerCase().replace(/\s+/g, '');

  const subtitle = `${handle} • ...`;

  // Status resolution (current user is active/online, other defaults to offline matching screenshot)
  const isSelf = authUser?.id && user?.id && authUser.id === user.id;
  const resolvedStatus = customStatus || (isSelf ? 'online' : 'offline');
  const isOnline = resolvedStatus === 'online';

  // Local time format (matching "11:10 PM local time")
  const formattedTime =
    customLocalTime ||
    new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) +
      ' local time';

  // Workspace / Role name (matching "Tjar")
  const orgName = roleOrTitle || workspaceName || workspace?.name || 'Tjar';

  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);
  const TriggerComponent = as;

  return (
    <>
      <TriggerComponent
        ref={triggerRef as any}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn('inline-block', className)}
      >
        {children}
      </TriggerComponent>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={cardRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className="w-[270px] rounded-xl bg-[#171821] border border-[#2b2d3d] p-3.5 shadow-2xl shadow-black/90 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-150 select-none text-left"
          >
            {/* Top Profile Header */}
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <div
                className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-base shadow-inner overflow-hidden ring-1 ring-white/10"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Name & Handle */}
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-white truncate leading-tight">
                  {displayName}
                </div>
                <div className="text-xs text-zinc-400 truncate mt-1">
                  {subtitle}
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-white/[0.08] my-3 w-full" />

            {/* Info Items List */}
            <div className="space-y-2.5">
              {/* Status Row */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                  {isOnline ? (
                    <circle cx="8" cy="8" r="4" fill="#10b981" />
                  ) : (
                    <>
                      <circle cx="8" cy="8" r="5" stroke="#52525b" strokeWidth="1.5" />
                      <circle cx="8" cy="8" r="2.5" fill="#a1a1aa" />
                    </>
                  )}
                </svg>
                <span>{isOnline ? 'Active' : 'Offline'}</span>
              </div>

              {/* Local Time Row */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>{formattedTime}</span>
              </div>

              {/* Organization / Role / Team Row */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
                <svg
                  className="w-4 h-4 text-zinc-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                </svg>
                <span className="truncate">{orgName}</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
