'use client';

import React, { useState } from 'react';
import { ProfileHoverCard, ProfileUser, getInitials, getAvatarColor } from './ProfileHoverCard';
import { WorkspaceMember } from '../../types';

export interface UserAvatarProps {
  user?: ProfileUser | null;
  member?: WorkspaceMember | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away';
  withHoverCard?: boolean;
  workspaceName?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const SIZE_MAP = {
  xs: {
    container: 'w-5 h-5 text-[9px]',
    dot: 'w-2 h-2 -bottom-0.5 -right-0.5',
    dotSvg: 8,
  },
  sm: {
    container: 'w-7 h-7 text-[11px]',
    dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    dotSvg: 10,
  },
  md: {
    container: 'w-8 h-8 text-xs',
    dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    dotSvg: 10,
  },
  lg: {
    container: 'w-10 h-10 text-sm',
    dot: 'w-3 h-3 -bottom-0.5 -right-0.5',
    dotSvg: 12,
  },
  xl: {
    container: 'w-12 h-12 text-base',
    dot: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    dotSvg: 14,
  },
};

export function UserAvatar({
  user,
  member,
  size = 'sm',
  showStatus = false,
  status = 'offline',
  withHoverCard = false,
  workspaceName,
  className = '',
  onClick,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const displayName = user?.name || member?.user?.name || 'User';
  const avatarUrl = user?.avatarUrl ?? member?.user?.avatarUrl;
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const isOnline = status === 'online';

  const avatarElement = (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none overflow-visible ${sizeConfig.container} ${className}`}
    >
      {/* Inner Avatar Circle */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-bold text-white overflow-hidden ring-1 ring-white/10"
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

      {/* Status Dot (matching offline/online indicator on bottom-right) */}
      {showStatus && (
        <span className={`absolute flex items-center justify-center ${sizeConfig.dot} pointer-events-none`}>
          <svg
            className="w-full h-full"
            viewBox="0 0 16 16"
            fill="none"
          >
            {isOnline ? (
              <circle cx="8" cy="8" r="7" fill="#10b981" stroke="#12131d" strokeWidth="2" />
            ) : (
              <>
                <circle cx="8" cy="8" r="7" fill="#12131d" />
                <circle cx="8" cy="8" r="6" stroke="#52525b" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="3" fill="#a1a1aa" />
              </>
            )}
          </svg>
        </span>
      )}
    </div>
  );

  if (withHoverCard) {
    return (
      <ProfileHoverCard
        user={user}
        member={member}
        workspaceName={workspaceName}
        status={status}
      >
        {avatarElement}
      </ProfileHoverCard>
    );
  }

  return avatarElement;
}
