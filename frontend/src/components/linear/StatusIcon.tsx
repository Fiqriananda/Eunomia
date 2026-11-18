import React from 'react';
import { SectionProgress, TaskStatus } from '../../types';
import { cn } from '../../lib/utils';

export const SECTION_PROGRESS_OPTIONS: Array<{
  value: SectionProgress;
  label: string;
  shortLabel: string;
}> = [
  { value: 'dashed', label: 'Backlog', shortLabel: 'Dashed' },
  { value: '0/4', label: 'Not started', shortLabel: '0/4' },
  { value: '1/4', label: 'Quarter', shortLabel: '1/4' },
  { value: '1/2', label: 'Half', shortLabel: '1/2' },
  { value: '3/4', label: 'Three-quarters', shortLabel: '3/4' },
  { value: '1/1', label: 'Completed', shortLabel: '1/1' },
  { value: 'canceled', label: 'Canceled', shortLabel: 'X' },
];

export const DEFAULT_STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; progress: SectionProgress }
> = {
  BACKLOG: { label: 'Backlog', color: '#71717a', progress: 'dashed' },
  TODO: { label: 'Todo', color: '#d4d4d8', progress: '0/4' },
  IN_PROGRESS: { label: 'In Progress', color: '#eab308', progress: '1/2' },
  DONE: { label: 'Done', color: '#6366f1', progress: '1/1' },
  CANCELED: { label: 'Canceled', color: '#71717a', progress: 'canceled' },
};

interface StatusIconProps {
  status: TaskStatus | string;
  color?: string;
  progress?: SectionProgress | string | null;
  className?: string;
  showLabel?: boolean;
}

export function renderProgressSvg(
  progress: SectionProgress | string,
  color?: string,
  sizeClass = 'w-3.5 h-3.5',
) {
  const style = color ? { color } : undefined;

  switch (progress) {
    case 'dashed':
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="none">
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2.2"
          />
        </svg>
      );

    case '0/4':
    case 'empty':
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );

    case '1/4':
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M 8 8 L 8 4 A 4 4 0 0 1 12 8 Z" fill="currentColor" />
        </svg>
      );

    case '1/2':
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M 8 8 L 8 4 A 4 4 0 0 1 8 12 Z" fill="currentColor" />
        </svg>
      );

    case '3/4':
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M 8 8 L 8 4 A 4 4 0 1 1 4 8 Z" fill="currentColor" />
        </svg>
      );

    case '1/1':
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="6.5" />
          <path
            d="M5.2 8.2 L7.1 10.1 L10.8 6"
            fill="none"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'canceled':
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M5.6 5.6 L10.4 10.4 M10.4 5.6 L5.6 10.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return (
        <svg className={cn(sizeClass, 'shrink-0')} style={style} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M 8 8 L 8 4 A 4 4 0 0 1 8 12 Z" fill="currentColor" />
        </svg>
      );
  }
}

export function StatusIcon({
  status,
  color,
  progress,
  className,
  showLabel = false,
}: StatusIconProps) {
  const builtIn = DEFAULT_STATUS_META[status as TaskStatus];
  const resolvedProgress: SectionProgress | string =
    progress || builtIn?.progress || '1/2';
  const resolvedColor = color || builtIn?.color || '#8b5cf6';
  const label = builtIn?.label || status;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      {renderProgressSvg(resolvedProgress, resolvedColor)}
      {showLabel && (
        <span className="text-xs font-medium" style={{ color: resolvedColor }}>
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
