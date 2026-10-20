import React from 'react';
import { TaskPriority } from '../../types';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PriorityIconProps {
  priority: TaskPriority;
  className?: string;
  showLabel?: boolean;
}

export function PriorityIcon({ priority, className, showLabel = false }: PriorityIconProps) {
  let icon = null;
  let label = 'No Priority';
  let colorClass = 'text-muted-foreground';

  switch (priority) {
    case 'URGENT':
      label = 'Urgent';
      colorClass = 'text-amber-500';
      icon = (
        <span className="w-3.5 h-3.5 rounded-[4px] bg-amber-500/15 text-amber-500 border border-amber-500/35 flex items-center justify-center font-bold text-[10px] shrink-0 leading-none">
          !
        </span>
      );
      break;

    case 'HIGH':
      label = 'High';
      colorClass = 'text-orange-400';
      icon = (
        <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2.5" y="9" width="2.5" height="6" rx="0.75" />
          <rect x="6.75" y="5" width="2.5" height="10" rx="0.75" />
          <rect x="11" y="1" width="2.5" height="14" rx="0.75" />
        </svg>
      );
      break;

    case 'MEDIUM':
      label = 'Medium';
      colorClass = 'text-yellow-400';
      icon = (
        <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2.5" y="9" width="2.5" height="6" rx="0.75" />
          <rect x="6.75" y="5" width="2.5" height="10" rx="0.75" />
          <rect x="11" y="1" width="2.5" height="14" rx="0.75" opacity="0.25" />
        </svg>
      );
      break;

    case 'LOW':
      label = 'Low';
      colorClass = 'text-blue-400';
      icon = (
        <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2.5" y="9" width="2.5" height="6" rx="0.75" />
          <rect x="6.75" y="5" width="2.5" height="10" rx="0.75" opacity="0.25" />
          <rect x="11" y="1" width="2.5" height="14" rx="0.75" opacity="0.25" />
        </svg>
      );
      break;

    case 'NO_PRIORITY':
    default:
      label = 'No Priority';
      colorClass = 'text-zinc-500';
      icon = (
        <span className="flex items-center justify-center text-zinc-500 shrink-0 tracking-tighter text-[11px] font-mono leading-none">
          ···
        </span>
      );
      break;
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      {icon}
      {showLabel && <span className={cn('text-xs font-medium', colorClass)}>{label}</span>}
    </div>
  );
}

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; order: number; color: string; border: string; bg: string }
> = {
  URGENT: {
    label: 'Urgent',
    order: 1,
    color: 'text-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  HIGH: {
    label: 'High',
    order: 2,
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
  },
  MEDIUM: {
    label: 'Medium',
    order: 3,
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
  },
  LOW: {
    label: 'Low',
    order: 4,
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
  NO_PRIORITY: {
    label: 'No Priority',
    order: 5,
    color: 'text-zinc-500',
    border: 'border-zinc-500/30',
    bg: 'bg-zinc-500/10',
  },
};
