'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskRelationType, WorkspaceMember } from '../../types';
import { StatusIcon } from './StatusIcon';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Search,
  Link as LinkIcon,
  ShieldAlert,
  Loader2,
  CornerDownLeft,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

const RELATION_TYPE_CONFIG: Record<
  string,
  { label: string; inverseLabel: string; color: string; bg: string; border: string }
> = {
  RELATED: {
    label: 'Relates to',
    inverseLabel: 'Relates to',
    color: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  BLOCKS: {
    label: 'Blocks',
    inverseLabel: 'Blocked by',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  BLOCKED_BY: {
    label: 'Blocked by',
    inverseLabel: 'Blocks',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  DUPLICATE: {
    label: 'Duplicate of',
    inverseLabel: 'Duplicated by',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
  },
};

interface RelatedIssuesSectionProps {
  task: Task;
  allTasks?: Task[];
  onTaskChange: (updatedTask: Task) => void;
  onNavigate?: (task: Task) => void;
}

export function RelatedIssuesSection({
  task,
  allTasks = [],
  onTaskChange,
  onNavigate,
}: RelatedIssuesSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [relationType, setRelationType] = useState<TaskRelationType>('RELATED');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Unify sourceRelations and targetRelations into a clean list
  const relationsList = [
    ...(task.sourceRelations || []).map((r) => ({
      relationId: r.id,
      type: r.type,
      displayLabel: RELATION_TYPE_CONFIG[r.type]?.label || 'Relates to',
      relatedTask: r.targetTask,
      isSource: true,
    })),
    ...(task.targetRelations || []).map((r) => ({
      relationId: r.id,
      type: r.type,
      displayLabel: RELATION_TYPE_CONFIG[r.type]?.inverseLabel || 'Relates to',
      relatedTask: r.sourceTask,
      isSource: false,
    })),
  ].filter((r) => Boolean(r.relatedTask));

  const totalCount = relationsList.length;

  const handleAddRelation = async (targetTask: Task) => {
    if (isLinking) return;
    setIsLinking(true);
    try {
      const updated = await api.tasks.addRelation(task.id, {
        targetTaskId: targetTask.id,
        type: relationType,
      });
      onTaskChange(updated);
      setShowAddModal(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to link related issue:', err);
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteRelation = async (e: React.MouseEvent, relationId: string) => {
    e.stopPropagation();
    try {
      const updated = await api.tasks.deleteRelation(task.id, relationId);
      onTaskChange(updated);
    } catch (err) {
      console.error('Failed to remove relation:', err);
    }
  };

  const handleItemClick = (targetTask: Task) => {
    if (onNavigate) {
      onNavigate(targetTask);
    } else {
      router.push(`/issue/${targetTask.id}`);
    }
  };

  // Filter tasks eligible to relate
  const linkedTaskIds = new Set([
    task.id,
    ...relationsList.map((r) => r.relatedTask.id),
  ]);

  const eligibleTasks = allTasks.filter(
    (t) =>
      !linkedTaskIds.has(t.id) &&
      (searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.identifier.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="pt-4 border-t border-[#232432]">
      {/* Header */}
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
          <span className="font-semibold text-zinc-200">Related issues</span>
          <span className="text-[11px] font-mono text-zinc-500">({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAddModal(!showAddModal)}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1a1b26] transition-colors"
          title="Add related issue"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {isOpen && (
        <div className="mt-2 space-y-1">
          {relationsList.length === 0 && !showAddModal && (
            <div className="py-2.5 px-3 text-xs text-zinc-500 italic flex items-center justify-between bg-[#11121c]/40 rounded border border-dashed border-[#232432]">
              <span>No related issues linked.</span>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add related issue</span>
              </button>
            </div>
          )}

          {/* Relations List */}
          {relationsList.map(({ relationId, displayLabel, type, relatedTask }) => {
            const config = RELATION_TYPE_CONFIG[type] || RELATION_TYPE_CONFIG.RELATED;
            const assigneeInitials = (relatedTask.assignee?.name || '')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={relationId}
                onClick={() => handleItemClick(relatedTask)}
                className="group flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#151622] transition-colors cursor-pointer border border-transparent hover:border-[#232432]"
              >
                {/* Left: Relation Type Pill + Status + Identifier + Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                  <span
                    style={{
                      color: config.color,
                      backgroundColor: config.bg,
                      borderColor: config.border,
                    }}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none shrink-0"
                  >
                    {displayLabel}
                  </span>

                  <StatusIcon status={relatedTask.status} />

                  <span className="text-xs font-mono text-zinc-400 shrink-0">
                    {relatedTask.identifier}
                  </span>

                  <span
                    className={cn(
                      'text-xs text-zinc-200 group-hover:text-white truncate font-medium',
                      relatedTask.status === 'DONE' && 'line-through text-zinc-500',
                    )}
                  >
                    {relatedTask.title}
                  </span>
                </div>

                {/* Right: Assignee + Unlink button */}
                <div className="flex items-center gap-2 shrink-0">
                  {relatedTask.assignee && (
                    relatedTask.assignee.avatarUrl ? (
                      <img
                        src={relatedTask.assignee.avatarUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-border"
                        title={relatedTask.assignee.name}
                      />
                    ) : (
                      <div
                        className="w-4 h-4 rounded-full bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center shrink-0 ring-1 ring-border"
                        title={relatedTask.assignee.name}
                      >
                        {assigneeInitials || 'U'}
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDeleteRelation(e, relationId)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/15 text-zinc-500 hover:text-rose-400 transition-all shrink-0"
                    title="Remove relation"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Relation Popover / Section */}
          {showAddModal && (
            <div className="mt-2 p-2.5 rounded-lg bg-[#12131e] border border-indigo-500/40 shadow-xl space-y-2.5 animate-in fade-in-0 duration-150">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Link related issue</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Relation Type Picker */}
              <div className="flex items-center gap-1.5">
                {(['RELATED', 'BLOCKS', 'BLOCKED_BY', 'DUPLICATE'] as const).map((t) => {
                  const conf = RELATION_TYPE_CONFIG[t];
                  const isSelected = relationType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRelationType(t)}
                      style={{
                        backgroundColor: isSelected ? conf.bg : 'transparent',
                        borderColor: isSelected ? conf.color : '#2b2c3a',
                        color: isSelected ? conf.color : '#9ca3af',
                      }}
                      className="px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1"
                    >
                      {conf.label}
                    </button>
                  );
                })}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search issues by title or key..."
                  className="w-full bg-[#191a24] text-xs text-white placeholder:text-zinc-500 pl-8 pr-3 py-1.5 rounded-md border border-[#2b2c3a] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Autocomplete list */}
              <div className="max-h-44 overflow-y-auto space-y-1 pt-1">
                {eligibleTasks.length === 0 ? (
                  <div className="py-3 text-center text-xs text-zinc-500">
                    No matching issues to link.
                  </div>
                ) : (
                  eligibleTasks.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAddRelation(t)}
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
