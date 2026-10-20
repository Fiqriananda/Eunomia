'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { PriorityIcon, PRIORITY_CONFIG } from './PriorityIcon';
import { StatusIcon, STATUS_CONFIG } from './StatusIcon';
import { Paperclip, Calendar, User as UserIcon, GitFork } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ListViewProps {
  tasks: Task[];
  groupBy: 'priority' | 'status';
  onTaskClick: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onPriorityChange?: (taskId: string, priority: TaskPriority) => void;
}

const PRIORITY_GROUPS: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const STATUS_GROUPS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

export function ListView({
  tasks,
  groupBy,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
}: ListViewProps) {
  const groups = groupBy === 'priority' ? PRIORITY_GROUPS : STATUS_GROUPS;

  const uniqueTasks = React.useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((t) => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [tasks]);

  return (
    <div className="space-y-6 pb-12">
      {groups.map((groupKey) => {
        const groupTasks = uniqueTasks
          .filter((t) => (groupBy === 'priority' ? t.priority === groupKey : t.status === groupKey))
          .sort((a, b) => a.order - b.order);

        if (groupTasks.length === 0) return null;

        const groupTitle =
          groupBy === 'priority'
            ? PRIORITY_CONFIG[groupKey as TaskPriority].label
            : STATUS_CONFIG[groupKey as TaskStatus].label;

        const groupIcon =
          groupBy === 'priority' ? (
            <PriorityIcon priority={groupKey as TaskPriority} />
          ) : (
            <StatusIcon status={groupKey as TaskStatus} />
          );

        return (
          <div key={groupKey} className="rounded-lg border border-border/70 bg-[#0d0e14] overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#12131b] border-b border-border/60">
              <div className="flex items-center gap-2">
                {groupIcon}
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {groupTitle}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-800/80 px-1.5 py-0.2 rounded-full">
                  {groupTasks.length}
                </span>
              </div>
            </div>

            {/* Tasks Rows */}
            <div className="divide-y divide-border/30">
              <AnimatePresence>
                {groupTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onTaskClick(task)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/40 cursor-pointer transition-colors group text-sm select-none"
                  >
                    {/* Left: Status, Identifier, Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStatusChange) {
                            const nextStatus: TaskStatus =
                              task.status === 'DONE' ? 'TODO' : 'DONE';
                            onStatusChange(task.id, nextStatus);
                          }
                        }}
                        className="cursor-pointer hover:scale-110 transition-transform"
                      >
                        <StatusIcon status={task.status} />
                      </div>

                      <span className="text-xs font-mono font-medium text-muted-foreground shrink-0">
                        {task.identifier}
                      </span>

                      <span className="font-medium text-foreground group-hover:text-white truncate">
                        {task.title}
                      </span>

                      {task.labels && task.labels.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 shrink-0">
                          {task.labels.map((l, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Priority, Attachments, Date, Assignee */}
                    <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-xs ml-4">
                      {task.subTasks && task.subTasks.length > 0 && (
                        <span
                          className="flex items-center gap-1 text-[10px] text-zinc-400 bg-[#161726] px-1.5 py-0.5 rounded border border-[#2b2c3d]"
                          title={`${task.subTasks.filter((s) => s.status === 'DONE').length} of ${task.subTasks.length} sub-issues completed`}
                        >
                          <GitFork className="w-2.5 h-2.5 text-indigo-400 rotate-180" />
                          <span>
                            {task.subTasks.filter((s) => s.status === 'DONE').length}/{task.subTasks.length}
                          </span>
                        </span>
                      )}

                      {task.attachments && task.attachments.length > 0 && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{task.attachments.length}</span>
                        </span>
                      )}

                      {task.dueDate && (
                        <span className="hidden md:flex items-center gap-1 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[11px]">
                            {new Date(task.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                      )}

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPriorityChange) {
                            const priorities: TaskPriority[] = [
                              'NO_PRIORITY',
                              'LOW',
                              'MEDIUM',
                              'HIGH',
                              'URGENT',
                            ];
                            const curIdx = priorities.indexOf(task.priority);
                            const nextPriority = priorities[(curIdx + 1) % priorities.length];
                            onPriorityChange(task.id, nextPriority);
                          }
                        }}
                        className="cursor-pointer hover:bg-secondary/70 p-1 rounded transition-colors"
                        title="Click to cycle priority"
                      >
                        <PriorityIcon priority={task.priority} />
                      </div>

                      <div className="w-6 h-6 flex items-center justify-center">
                        {task.assignee ? (
                          <img
                            src={
                              task.assignee.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                task.assignee.name,
                              )}`
                            }
                            alt={task.assignee.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
                            title={`Assigned to ${task.assignee.name}`}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600 flex items-center justify-center text-zinc-500">
                            <UserIcon className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
