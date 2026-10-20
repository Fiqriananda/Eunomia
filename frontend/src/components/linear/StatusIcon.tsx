import React from 'react';
import { TaskStatus } from '../../types';
import { Circle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatusIconProps {
  status: TaskStatus | string;
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function StatusIcon({ status, color, className, showLabel = false }: StatusIconProps) {
  let icon = null;
  let label = status;
  let colorClass = 'text-muted-foreground';

  switch (status) {
    case 'BACKLOG':
      label = 'Backlog';
      colorClass = 'text-zinc-500';
      icon = (
        <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
        </svg>
      );
      break;

    case 'TODO':
      label = 'Todo';
      colorClass = 'text-zinc-400';
      icon = (
        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
      break;

    case 'IN_PROGRESS':
      label = 'In Progress';
      colorClass = 'text-amber-400';
      icon = (
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1.5 A6.5 6.5 0 0 0 8 14.5 Z" fill="currentColor" />
        </svg>
      );
      break;

    case 'DONE':
      label = 'Done';
      colorClass = 'text-indigo-400';
      icon = (
        <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="7" />
          <path
            d="M5 8 L7 10 L11 6"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
      break;

    case 'CANCELED':
      label = 'Canceled';
      colorClass = 'text-zinc-500';
      icon = (
        <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 5.5 L10.5 10.5 M10.5 5.5 L5.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
      break;

    default:
      // Custom status / section
      label = status;
      icon = (
        <span
          className="w-3.5 h-3.5 rounded-full border-[1.5px] shrink-0 inline-flex items-center justify-center"
          style={{ borderColor: color || '#8b5cf6', backgroundColor: `${color || '#8b5cf6'}20` }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color || '#8b5cf6' }}
          />
        </span>
      );
      break;
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      {icon}
      {showLabel && (
        <span
          className={cn('text-xs font-medium', color ? '' : colorClass)}
          style={color ? { color } : undefined}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; order: number; color: string; border: string; bg: string }
> = {
  BACKLOG: {
    label: 'Backlog',
    order: 1,
    color: 'text-zinc-500',
    border: 'border-zinc-500/20',
    bg: 'bg-zinc-500/5',
  },
  TODO: {
    label: 'Todo',
    order: 2,
    color: 'text-zinc-300',
    border: 'border-zinc-400/20',
    bg: 'bg-zinc-400/5',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    order: 3,
    color: 'text-amber-400',
    border: 'border-amber-400/20',
    bg: 'bg-amber-400/5',
  },
  DONE: {
    label: 'Done',
    order: 4,
    color: 'text-indigo-400',
    border: 'border-indigo-400/20',
    bg: 'bg-indigo-400/5',
  },
  CANCELED: {
    label: 'Canceled',
    order: 5,
    color: 'text-zinc-500',
    border: 'border-zinc-500/20',
    bg: 'bg-zinc-500/5',
  },
};
