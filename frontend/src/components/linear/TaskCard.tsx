'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Task } from '../../types';
import { PriorityIcon } from './PriorityIcon';
import { StatusIcon } from './StatusIcon';
import { Paperclip, Calendar, GitFork, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  showStatus?: boolean;
}

export function TaskCard({
  task,
  onClick,
  isDragging = false,
  dragHandleProps,
  showStatus = false,
}: TaskCardProps) {
  // Get assignee initials
  const assigneeInitials = task.assignee?.name
    ? task.assignee.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : null;

  return (
    <motion.div
      layout
      layoutId={task.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -1.5, transition: { duration: 0.12 } }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(task)}
      className={cn(
        'group relative rounded-lg border border-[#1f212d] bg-[#12131c] p-3 shadow-sm cursor-pointer select-none transition-all duration-150',
        'hover:border-zinc-700/80 hover:bg-[#161724] hover:shadow-md hover:shadow-black/40',
        isDragging && 'opacity-60 border-primary ring-2 ring-primary/40 shadow-2xl z-50',
      )}
      {...dragHandleProps}
    >
      {/* Top Header Row: Identifier + Status + Assignee Avatar */}
      <div className="flex items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0">
            {task.identifier}
          </span>

          {showStatus && <StatusIcon status={task.status} />}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {task.assignee ? (
            <div
              className="w-4 h-4 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-[9px] flex items-center justify-center ring-1 ring-background"
              title={`Assigned to ${task.assignee.name}`}
            >
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                assigneeInitials
              )}
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border border-dashed border-zinc-700" title="Unassigned" />
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="mt-1.5 text-xs sm:text-sm font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
        {task.title}
      </h4>

      {/* Description preview if present */}
      {task.description && (
        <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1 leading-normal">
          {task.description}
        </p>
      )}

      {/* Labels / Tags */}
      {task.labels && task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((label, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-medium bg-[#1d1e2b] text-zinc-300 border border-zinc-800"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1 opacity-70" />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Requester Division Tag */}
      {task.requesterDivision && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            title={`Requested by: ${task.requesterDivision.name}`}
          >
            <Users className="w-2.5 h-2.5" />
            <span className="truncate max-w-[120px]">{task.requesterDivision.name}</span>
          </span>
        </div>
      )}

      {/* Footer: Date & Priority */}
      <div className="mt-2.5 pt-2 border-t border-[#1a1b26]/70 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="text-[10px] text-zinc-500">
          Created {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>

        <div className="flex items-center gap-1.5">
          {task.estimate !== undefined && task.estimate !== null && (
            <span
              className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
              title={`${task.estimate} Story Points`}
            >
              {task.estimate} pts
            </span>
          )}

          {task.subTasks && task.subTasks.length > 0 && (
            <span
              className="flex items-center gap-1 text-[10px] text-zinc-400 bg-[#171827] px-1.5 py-0.5 rounded border border-[#2b2c3d]"
              title={`${task.subTasks.filter((s) => s.status === 'DONE').length} of ${task.subTasks.length} sub-issues completed`}
            >
              <GitFork className="w-2.5 h-2.5 text-indigo-400 rotate-180" />
              <span>
                {task.subTasks.filter((s) => s.status === 'DONE').length}/{task.subTasks.length}
              </span>
            </span>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-400">
              <Paperclip className="w-2.5 h-2.5" />
              {task.attachments.length}
            </span>
          )}

          <PriorityIcon priority={task.priority} />
        </div>
      </div>
    </motion.div>
  );
}
