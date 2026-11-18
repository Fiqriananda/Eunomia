'use client';

import React from 'react';
import { SectionProgress, Task } from '../../types';
import { PriorityIcon } from './PriorityIcon';
import { StatusIcon, renderProgressSvg } from './StatusIcon';
import { Paperclip } from 'lucide-react';
import { cn } from '../../lib/utils';
import { resolveMediaUrl } from '../ui/MarkdownRenderer';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  showStatus?: boolean;
  sectionColor?: string;
  sectionProgress?: SectionProgress | string | null;
}

const LABEL_DOT_PALETTE = [
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#3b82f6',
  '#f43f5e',
  '#06b6d4',
  '#ec4899',
];

function getLabelDotColor(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('bug') || lower.includes('error') || lower.includes('fix')) return '#f43f5e';
  if (lower.includes('improve') || lower.includes('qa') || lower.includes('done')) return '#10b981';
  if (lower.includes('feature') || lower.includes('design')) return '#8b5cf6';
  if (lower.includes('customer') || lower.includes('urgent') || lower.includes('client')) return '#f59e0b';
  if (lower.includes('back') || lower.includes('api') || lower.includes('infra')) return '#3b82f6';
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_DOT_PALETTE[Math.abs(hash) % LABEL_DOT_PALETTE.length];
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function TaskCard({
  task,
  onClick,
  isDragging = false,
  dragHandleProps,
  showStatus = true,
  sectionColor,
  sectionProgress,
}: TaskCardProps) {
  const completedSubTasks = task.subTasks
    ? task.subTasks.filter((s) => s.status === 'DONE').length
    : 0;
  const totalSubTasks = task.subTasks?.length || 0;
  const subTaskProgress: SectionProgress =
    totalSubTasks === 0
      ? '0/4'
      : completedSubTasks === 0
        ? '0/4'
        : completedSubTasks === totalSubTasks
          ? '1/1'
          : completedSubTasks / totalSubTasks <= 0.25
            ? '1/4'
            : completedSubTasks / totalSubTasks <= 0.5
              ? '1/2'
              : '3/4';

  const createdLabel = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        'group relative rounded-lg border border-white/[0.06] bg-[#16171d] px-3 py-2.5 cursor-pointer select-none transition-colors duration-150',
        'hover:border-white/[0.12] hover:bg-[#1a1c24]',
        isDragging && 'opacity-70 border-white/25 ring-1 ring-white/20 shadow-2xl z-50',
      )}
      {...dragHandleProps}
    >
      {/* Top Row: Identifier + Assignee */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-normal text-zinc-500 group-hover:text-zinc-400 transition-colors shrink-0">
            {task.identifier}
          </span>
          {task.parent?.title && (
            <span className="text-[11px] text-zinc-600 truncate">
              &rsaquo; {task.parent.title}
            </span>
          )}
        </div>

        <div className="flex items-center shrink-0">
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex -space-x-1.5 items-center">
              {task.assignees.slice(0, 3).map((a) => (
                <div
                  key={a.id || a.userId}
                  className="w-[18px] h-[18px] rounded-full bg-zinc-700 text-zinc-100 font-medium text-[8px] flex items-center justify-center ring-1 ring-[#16171d] overflow-hidden"
                  title={a.user?.name || 'Assignee'}
                >
                  {a.user?.avatarUrl ? (
                    <img
                      src={resolveMediaUrl(a.user.avatarUrl)}
                      alt={a.user.name || 'Assignee'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(a.user?.name)
                  )}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full ring-1 ring-[#16171d] bg-zinc-800 text-[8px] text-zinc-300">
                  +{task.assignees.length - 3}
                </span>
              )}
            </div>
          ) : task.assignee ? (
            <div
              className="w-[18px] h-[18px] rounded-full bg-zinc-700 text-zinc-100 font-medium text-[8px] flex items-center justify-center ring-1 ring-[#16171d] overflow-hidden"
              title={task.assignee.name}
            >
              {task.assignee.avatarUrl ? (
                <img
                  src={resolveMediaUrl(task.assignee.avatarUrl)}
                  alt={task.assignee.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(task.assignee.name)
              )}
            </div>
          ) : (
            <svg
              className="w-[16px] h-[16px] text-zinc-600"
              viewBox="0 0 16 16"
              fill="none"
              aria-label="Unassigned"
            >
              <circle
                cx="8"
                cy="8"
                r="6.2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle cx="8" cy="6.4" r="1.6" stroke="currentColor" strokeWidth="1.1" />
              <path
                d="M5.2 11.4C5.8 10.1 6.8 9.6 8 9.6C9.2 9.6 10.2 10.1 10.8 11.4"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Middle Row: Status Progress Ring + Title */}
      <div className="mt-1.5 flex items-start gap-2">
        {showStatus && (
          <StatusIcon
            status={task.status}
            color={sectionColor}
            progress={sectionProgress}
            className="mt-[2px] shrink-0"
          />
        )}
        <h4 className="text-[13px] font-medium text-zinc-100 leading-[1.35] line-clamp-2 group-hover:text-white transition-colors">
          {task.title}
        </h4>
      </div>

      {/* Metadata & Pills Row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className="h-5 px-1 rounded-[4px] border border-white/[0.07] bg-white/[0.02] inline-flex items-center justify-center"
          title={`Priority: ${task.priority}`}
        >
          <PriorityIcon priority={task.priority} />
        </span>

        {task.labels &&
          task.labels.map((label, i) => (
            <span
              key={i}
              className="h-5 px-2 rounded-full border border-white/[0.07] bg-white/[0.02] inline-flex items-center gap-1.5 text-[11px] text-zinc-300"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getLabelDotColor(label) }}
              />
              <span className="truncate max-w-[110px]">{label}</span>
            </span>
          ))}

        {task.requesterDivision && (
          <span
            className="h-5 px-2 rounded-full border border-white/[0.07] bg-white/[0.02] inline-flex items-center gap-1.5 text-[11px] text-zinc-300"
            title={`Requested by: ${task.requesterDivision.name}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate max-w-[100px]">{task.requesterDivision.name}</span>
          </span>
        )}

        {totalSubTasks > 0 && (
          <span
            className="h-5 px-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] inline-flex items-center gap-1 text-[10px] text-zinc-400"
            title={`${completedSubTasks} of ${totalSubTasks} sub-issues completed`}
          >
            {renderProgressSvg(
              subTaskProgress,
              completedSubTasks === totalSubTasks ? '#6366f1' : '#71717a',
              'w-3 h-3',
            )}
            <span>
              {completedSubTasks}/{totalSubTasks}
            </span>
          </span>
        )}

        {task.estimate !== undefined && task.estimate !== null && (
          <span
            className="h-5 px-1.5 rounded-[4px] border border-white/[0.07] bg-white/[0.02] text-[10px] font-mono text-zinc-400 inline-flex items-center"
            title={`${task.estimate} Story Points`}
          >
            {task.estimate}
          </span>
        )}

        {task.attachments && task.attachments.length > 0 && (
          <span className="h-5 px-1.5 rounded-[4px] border border-white/[0.07] bg-white/[0.02] inline-flex items-center gap-1 text-[10px] text-zinc-400">
            <Paperclip className="w-2.5 h-2.5" />
            <span>{task.attachments.length}</span>
          </span>
        )}
      </div>

      {/* Subtle Footer Date */}
      {createdLabel && (
        <div className="mt-2 text-[11px] text-zinc-500">Created {createdLabel}</div>
      )}
    </div>
  );
}
