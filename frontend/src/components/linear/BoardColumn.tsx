'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../types';
import { SortableTaskItem } from './SortableTaskItem';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BoardColumnProps {
  id: string; // The column key (e.g. priority 'HIGH' or status 'IN_PROGRESS' or custom section key)
  title: string;
  count: number;
  icon: React.ReactNode;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (columnId: string) => void;
  showStatus?: boolean;
  isCustom?: boolean;
  onDelete?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
}

export function BoardColumn({
  id,
  title,
  count,
  icon,
  tasks,
  onTaskClick,
  onAddTask,
  showStatus = false,
  isCustom = false,
  onDelete,
  onMoveLeft,
  onMoveRight,
  canMoveLeft = false,
  canMoveRight = false,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { columnId: id },
  });

  const uniqueTasks = React.useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((t) => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-80 shrink-0 rounded-xl bg-[#0f1017]/80 border border-border/60 transition-all duration-200 select-none min-h-[580px]',
        isOver && 'border-primary/60 bg-primary/[0.04] ring-1 ring-primary/30',
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/40 group/header">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[125px]" title={title}>
            {title}
          </h3>
          <span className="text-[11px] font-mono font-medium text-zinc-500 bg-zinc-800/60 px-1.5 py-0.2 rounded-full shrink-0">
            {count}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Move Before / Left Button */}
          {onMoveLeft && (
            <button
              onClick={onMoveLeft}
              disabled={!canMoveLeft}
              className={cn(
                'p-1 rounded opacity-0 group-hover/header:opacity-100 hover:bg-secondary text-zinc-500 hover:text-white transition-all',
                !canMoveLeft && 'hidden',
              )}
              title="Move section left / before"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move After / Right Button */}
          {onMoveRight && (
            <button
              onClick={onMoveRight}
              disabled={!canMoveRight}
              className={cn(
                'p-1 rounded opacity-0 group-hover/header:opacity-100 hover:bg-secondary text-zinc-500 hover:text-white transition-all',
                !canMoveRight && 'hidden',
              )}
              title="Move section right / after"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isCustom && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded opacity-0 group-hover/header:opacity-100 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
              title="Delete custom section"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onAddTask && (
            <button
              onClick={() => onAddTask(id)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Add task in this column"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-210px)]">
        <SortableContext
          items={uniqueTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {uniqueTasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onClick={onTaskClick}
              showStatus={showStatus}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-28 rounded-lg border border-dashed border-border/40 flex flex-col items-center justify-center text-xs text-zinc-600 gap-1">
            <span>No tasks</span>
            <span className="text-[10px] text-zinc-700">Drop here to assign</span>
          </div>
        )}
      </div>
    </div>
  );
}
