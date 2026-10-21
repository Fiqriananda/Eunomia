'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Smile, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ReactionItem {
  id?: string;
  emoji: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface ReactionsBarProps {
  reactions?: ReactionItem[];
  currentUserId?: string;
  onToggleReaction: (emoji: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  hideEmptyAddButton?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '🎉', '🚀', '👀', '🔥', '💡', '👎', '👏', '✨', '🙏', '💯'];

const EXTRA_EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😂', '😍', '🤔', '😅', '🥳', '🤯', '😎', '😴', '🤐', '😭', '😇'],
  },
  {
    name: 'Hands',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '👊', '👋', '✋', '💪', '🙏'],
  },
  {
    name: 'Symbols',
    emojis: ['❤️', '🔥', '✨', '🌟', '💡', '🎯', '⚡', '🚀', '🎉', '💯', '🏆', '📌'],
  },
];

export const ReactionsBar: React.FC<ReactionsBarProps> = ({
  reactions = [],
  currentUserId,
  onToggleReaction,
  size = 'sm',
  className,
  hideEmptyAddButton = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    const map = new Map<
      string,
      { emoji: string; count: number; hasReacted: boolean; users: string[] }
    >();

    reactions.forEach((r) => {
      if (!r || !r.emoji) return;
      const existing = map.get(r.emoji) || {
        emoji: r.emoji,
        count: 0,
        hasReacted: false,
        users: [],
      };

      existing.count += 1;
      if (currentUserId && r.userId === currentUserId) {
        existing.hasReacted = true;
      }
      if (r.user?.name) {
        existing.users.push(r.user.name);
      }
      map.set(r.emoji, existing);
    });

    return Array.from(map.values());
  }, [reactions, currentUserId]);

  // Click outside to close picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const handleSelectEmoji = (emoji: string) => {
    onToggleReaction(emoji);
    setShowPicker(false);
    setSearch('');
  };

  const isSmall = size === 'sm';

  return (
    <div className={cn('relative inline-flex items-center flex-wrap gap-1.5', className)}>
      {/* Existing Reaction Badges */}
      {groupedReactions.map((group) => {
        const tooltipText =
          group.users.length > 0
            ? `${group.users.slice(0, 3).join(', ')}${
                group.users.length > 3 ? ` and ${group.users.length - 3} others` : ''
              } reacted with ${group.emoji}`
            : `Reacted with ${group.emoji}`;

        return (
          <button
            key={group.emoji}
            type="button"
            onClick={() => onToggleReaction(group.emoji)}
            title={tooltipText}
            className={cn(
              'group/reaction inline-flex items-center gap-1.5 rounded-full transition-all select-none border',
              isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
              group.hasReacted
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-medium shadow-sm hover:bg-indigo-500/30'
                : 'bg-[#12131f]/80 border-border/70 text-zinc-300 hover:border-zinc-500 hover:bg-[#1a1b2e]',
            )}
          >
            <span className={cn(isSmall ? 'text-xs' : 'text-sm')}>{group.emoji}</span>
            <span
              className={cn(
                'font-mono tabular-nums',
                group.hasReacted ? 'text-indigo-200' : 'text-zinc-400 group-hover/reaction:text-zinc-200',
              )}
            >
              {group.count}
            </span>
          </button>
        );
      })}

      {/* Add Reaction Button (+ / Smile) */}
      {(!hideEmptyAddButton || groupedReactions.length > 0) && (
        <div className="relative inline-block">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            title="Add reaction"
            className={cn(
              'inline-flex items-center justify-center rounded-full border border-border/60 transition-all text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 bg-[#12131f]/60 hover:bg-[#1a1b2e]',
              isSmall ? 'w-6 h-6 text-xs' : 'px-2 py-1 text-xs gap-1',
            )}
          >
            {groupedReactions.length > 0 ? (
              <Plus className={cn(isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
            ) : (
              <Smile className={cn(isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
            )}
            {!isSmall && groupedReactions.length === 0 && (
              <span className="text-[11px] font-medium">React</span>
            )}
          </button>

          {/* Floating Emoji Picker Popover */}
          {showPicker && (
            <div
              ref={pickerRef}
              className="absolute left-0 bottom-full mb-2 z-50 w-64 rounded-xl border border-border/80 bg-[#0e0f18]/95 backdrop-blur-xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1 pb-1.5 flex items-center justify-between border-b border-border/40">
                <span>Add Reaction</span>
                <Smile className="w-3.5 h-3.5 text-indigo-400" />
              </div>

              {/* Quick Emojis Grid */}
              <div className="grid grid-cols-6 gap-1 pt-2">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className="flex items-center justify-center h-8 rounded-lg text-lg hover:bg-indigo-500/20 hover:scale-110 active:scale-95 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Extra Emojis by Category */}
              <div className="mt-2 pt-2 border-t border-border/40 max-h-36 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
                {EXTRA_EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.name}>
                    <span className="text-[10px] font-medium text-zinc-500 block px-1 mb-1">
                      {cat.name}
                    </span>
                    <div className="grid grid-cols-6 gap-1">
                      {cat.emojis.map((emoji) => (
                        <button
                          key={`${cat.name}-${emoji}`}
                          type="button"
                          onClick={() => handleSelectEmoji(emoji)}
                          className="flex items-center justify-center h-7 rounded-md text-base hover:bg-zinc-800 hover:scale-110 active:scale-95 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
