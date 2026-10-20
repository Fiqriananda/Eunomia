'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskPriority, TaskStatus, WorkspaceMember } from '../../types';
import { StatusIcon } from './StatusIcon';
import { PriorityIcon } from './PriorityIcon';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  X,
  Trash2,
  Link as LinkIcon,
  Search,
  Check,
  CornerDownLeft,
  Loader2,
  GitFork,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

const PRESET_LABEL_COLORS: Record<string, string> = {
  Feature: '#a855f7',
  Bug: '#ef4444',
  Improvement: '#3b82f6',
  Critical: '#f43f5e',
  Design: '#f97316',
  Frontend: '#0ea5e9',
  Backend: '#10b981',
  Performance: '#14b8a6',
  Storage: '#6366f1',
  Research: '#8b5cf6',
  Documentation: '#84cc16',
  Security: '#e11d48',
};

export const getLabelColor = (name: string) => {
  if (PRESET_LABEL_COLORS[name]) return PRESET_LABEL_COLORS[name];
  const palette = ['#a855f7', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

interface SubIssuesSectionProps {
  parentTask: Task;
  subTasks: Task[];
  members: WorkspaceMember[];
  allTasks?: Task[];
  onSubTasksChange: (updatedSubTasks: Task[]) => void;
  onNavigate?: (task: Task) => void;
}

export function SubIssuesSection({
  parentTask,
  subTasks,
  members,
  allTasks = [],
  onSubTasksChange,
  onNavigate,
}: SubIssuesSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'OPEN' | 'COMPLETED'>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Creation mode state: 'inline' | 'link' | null
  const [creationMode, setCreationMode] = useState<'inline' | 'link' | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('TODO');
  const [newPriority, setNewPriority] = useState<TaskPriority>('NO_PRIORITY');
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(null);
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link existing task state
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Progress metrics (e.g. 0/7)
  const totalCount = subTasks.length;
  const completedCount = subTasks.filter((t) => t.status === 'DONE').length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;

  // Filtered sub-issues
  const filteredSubTasks = subTasks.filter((t) => {
    if (filterMode === 'OPEN') return t.status !== 'DONE' && t.status !== 'CANCELED';
    if (filterMode === 'COMPLETED') return t.status === 'DONE';
    return true;
  });

  const handleCreateSubTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await api.tasks.createSubTask(parentTask.id, {
        title: newTitle.trim(),
        status: newStatus,
        priority: newPriority,
        assigneeId: newAssigneeId || undefined,
        labels: newLabels,
        projectId: parentTask.projectId,
      });

      onSubTasksChange([...subTasks, created]);
      setNewTitle('');
      setNewLabels([]);
      setCreationMode(null);
    } catch (err) {
      console.error('Failed to create sub-issue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExistingTask = async (taskToLink: Task) => {
    if (isLinking) return;
    setIsLinking(true);
    try {
      const updated = await api.tasks.linkSubTask(parentTask.id, taskToLink.id);
      onSubTasksChange([...subTasks.filter((s) => s.id !== taskToLink.id), updated]);
      setCreationMode(null);
      setLinkSearchQuery('');
    } catch (err) {
      console.error('Failed to link existing issue:', err);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkSubTask = async (e: React.MouseEvent, subTaskId: string) => {
    e.stopPropagation();
    try {
      await api.tasks.unlinkSubTask(parentTask.id, subTaskId);
      onSubTasksChange(subTasks.filter((s) => s.id !== subTaskId));
    } catch (err) {
      console.error('Failed to unlink sub-issue:', err);
    }
  };

  const handleSubTaskStatusChange = async (
    e: React.MouseEvent,
    subTask: Task,
    nextStatus: TaskStatus,
  ) => {
    e.stopPropagation();
    try {
      const updated = await api.tasks.update(subTask.id, { status: nextStatus });
      onSubTasksChange(subTasks.map((s) => (s.id === subTask.id ? { ...s, ...updated } : s)));
    } catch (err) {
      console.error('Failed to update sub-issue status:', err);
    }
  };

  const handleItemClick = (subTask: Task) => {
    if (onNavigate) {
      onNavigate(subTask);
    } else {
      router.push(`/issue/${subTask.id}`);
    }
  };

  // Eligible tasks to link as sub-issue
  const eligibleTasksToLink = allTasks.filter(
    (t) =>
      t.id !== parentTask.id &&
      t.parentId !== parentTask.id &&
      !subTasks.some((st) => st.id === t.id) &&
      (linkSearchQuery.trim() === '' ||
        t.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
        t.identifier.toLowerCase().includes(linkSearchQuery.toLowerCase())),
  );

  return (
    <div className="pt-4 border-t border-[#232432]">
      {/* Sub-issues Header matching screenshot */}
      <div className="flex items-center justify-between py-1 group select-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 stroke-[2.5]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 stroke-[2.5]" />
          )}
          <span className="font-semibold text-zinc-200">Sub-issues</span>

          {/* Progress Indicator: Circular SVG + 0/7 (Exact screenshot match) */}
          <div className="flex items-center gap-1.5 ml-1 px-1.5 py-0.5 rounded text-[11px] font-mono text-zinc-400">
            <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 16 16">
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                opacity="0.3"
              />
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="#6366f1"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${progressRatio * 37.7} 37.7`}
                transform="rotate(-90 8 8)"
                strokeLinecap="round"
              />
            </svg>
            <span>
              {completedCount}/{totalCount}
            </span>
          </div>
        </button>

        {/* Right Header Actions: Filter & Add */}
        <div className="flex items-center gap-1">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={cn(
                'p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b26] transition-colors',
                filterMode !== 'ALL' && 'text-indigo-400 bg-indigo-500/10',
              )}
              title="Filter sub-issues"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg bg-[#191a24] border border-[#2b2c3a] shadow-xl p-1 z-50 text-xs">
                {(['ALL', 'OPEN', 'COMPLETED'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setFilterMode(mode);
                      setShowFilterDropdown(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors',
                      filterMode === mode
                        ? 'bg-[#2b2c3a] text-white font-medium'
                        : 'text-zinc-300 hover:bg-[#20212d]',
                    )}
                  >
                    <span>{mode === 'ALL' ? 'All' : mode === 'OPEN' ? 'Open' : 'Completed'}</span>
                    {filterMode === mode && <Check className="w-3 h-3 text-indigo-400 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Sub-issue button (+) */}
          <button
            type="button"
            onClick={() => setCreationMode(creationMode ? null : 'inline')}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1a1b26] transition-colors"
            title="Add sub-issue"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-2 space-y-0.5">
          {/* Sub-issues List Items matching screenshot layout */}
          {filteredSubTasks.length === 0 && !creationMode && (
            <div className="py-2.5 px-3 text-xs text-zinc-500 italic flex items-center justify-between bg-[#11121c]/40 rounded border border-dashed border-[#232432]">
              <span>No sub-issues yet.</span>
              <button
                type="button"
                onClick={() => setCreationMode('inline')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Create sub-issue</span>
              </button>
            </div>
          )}

          {filteredSubTasks.map((subTask) => {
            const assigneeInitials = (subTask.assignee?.name || '')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={subTask.id}
                onClick={() => handleItemClick(subTask)}
                className="group flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#151622] transition-colors cursor-pointer border border-transparent hover:border-[#232432]"
              >
                {/* Left: Status Icon + Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                  <div
                    onClick={(e) => {
                      const next =
                        subTask.status === 'DONE'
                          ? 'TODO'
                          : subTask.status === 'TODO'
                          ? 'IN_PROGRESS'
                          : 'DONE';
                      handleSubTaskStatusChange(e, subTask, next);
                    }}
                    className="shrink-0 hover:scale-110 transition-transform cursor-pointer"
                    title={`Status: ${subTask.status}. Click to change`}
                  >
                    <StatusIcon status={subTask.status} color={subTask.project?.color || undefined} />
                  </div>

                  <span className="text-xs font-mono text-zinc-500 shrink-0">
                    {subTask.identifier}
                  </span>

                  <span
                    className={cn(
                      'text-xs text-zinc-200 group-hover:text-white truncate font-medium',
                      subTask.status === 'DONE' && 'line-through text-zinc-500',
                    )}
                  >
                    {subTask.title}
                  </span>
                </div>

                {/* Right: Labels + Assignee + Unlink action */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Labels Badges */}
                  {(subTask.labels || []).slice(0, 3).map((lbl) => {
                    const color = getLabelColor(lbl);
                    return (
                      <span
                        key={lbl}
                        style={{
                          backgroundColor: `${color}18`,
                          borderColor: `${color}40`,
                          color: color,
                        }}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none shrink-0"
                      >
                        {lbl}
                      </span>
                    );
                  })}

                  {/* Assignee Avatar / Initials */}
                  {subTask.assignee ? (
                    subTask.assignee.avatarUrl ? (
                      <img
                        src={subTask.assignee.avatarUrl}
                        alt={subTask.assignee.name}
                        className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-border"
                        title={subTask.assignee.name}
                      />
                    ) : (
                      <div
                        className="w-4 h-4 rounded-full bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center shrink-0 ring-1 ring-border"
                        title={subTask.assignee.name}
                      >
                        {assigneeInitials || 'U'}
                      </div>
                    )
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full border border-dashed border-zinc-600 flex items-center justify-center opacity-0 group-hover:opacity-60 shrink-0"
                      title="Unassigned"
                    >
                      <span className="text-[9px] text-zinc-500">+</span>
                    </div>
                  )}

                  {/* Unlink button on hover */}
                  <button
                    type="button"
                    onClick={(e) => handleUnlinkSubTask(e, subTask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/15 text-zinc-500 hover:text-rose-400 transition-all shrink-0"
                    title="Unlink from parent"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Creation Section: Inline Sub-issue Creator or Linker */}
          {creationMode === 'inline' && (
            <form
              onSubmit={handleCreateSubTask}
              className="mt-2 p-2 rounded-lg bg-[#12131e] border border-indigo-500/40 shadow-lg space-y-2 animate-in fade-in-0 duration-150"
            >
              <div className="flex items-center gap-2">
                <StatusIcon status={newStatus} />
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Sub-issue title... (e.g. Add Quick Filter Chips)"
                  className="flex-1 bg-transparent border-0 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                />
              </div>

              {/* Controls bar: Assignee, Priority, Labels preset, Submit */}
              <div className="flex items-center justify-between pt-1 border-t border-[#232432] text-xs">
                <div className="flex items-center gap-2">
                  {/* Quick Assignee Select */}
                  <select
                    value={newAssigneeId || ''}
                    onChange={(e) => setNewAssigneeId(e.target.value || null)}
                    className="bg-[#191a24] text-zinc-300 text-[11px] rounded px-1.5 py-0.5 border border-[#2b2c3a] focus:outline-none"
                  >
                    <option value="">Assignee...</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name || m.user?.email}
                      </option>
                    ))}
                  </select>

                  {/* Quick Preset Labels */}
                  {['Improvement', 'Bug', 'Feature'].map((preset) => {
                    const isSelected = newLabels.includes(preset);
                    const color = getLabelColor(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setNewLabels((prev) =>
                            isSelected ? prev.filter((l) => l !== preset) : [...prev, preset],
                          )
                        }
                        style={{
                          backgroundColor: isSelected ? `${color}25` : 'transparent',
                          borderColor: isSelected ? color : '#323444',
                          color: isSelected ? color : '#9ca3af',
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors"
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCreationMode('link')}
                    className="text-[11px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#20212d] transition-colors"
                  >
                    Link existing...
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode(null);
                      setNewTitle('');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-[#20212d] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTitle.trim() || isSubmitting}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-medium px-2.5 py-0.5 rounded transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CornerDownLeft className="w-3 h-3" />
                    )}
                    <span>Create</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Link Existing Issue Modal / Dropdown */}
          {creationMode === 'link' && (
            <div className="mt-2 p-2.5 rounded-lg bg-[#12131e] border border-indigo-500/40 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Link an existing issue as sub-issue</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCreationMode(null)}
                  className="p-1 rounded text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={linkSearchQuery}
                  onChange={(e) => setLinkSearchQuery(e.target.value)}
                  placeholder="Search existing issues by title or ID..."
                  className="w-full bg-[#191a24] text-xs text-white placeholder:text-zinc-500 pl-8 pr-3 py-1.5 rounded-md border border-[#2b2c3a] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1 pt-1">
                {eligibleTasksToLink.length === 0 ? (
                  <div className="py-3 text-center text-xs text-zinc-500">
                    No matching issues found to link.
                  </div>
                ) : (
                  eligibleTasksToLink.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleLinkExistingTask(t)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1f202d] text-left transition-colors text-xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <StatusIcon status={t.status} />
                        <span className="font-mono text-[11px] text-zinc-400">{t.identifier}</span>
                        <span className="text-zinc-200 group-hover:text-white truncate">
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 font-medium shrink-0">
                        Link +
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
