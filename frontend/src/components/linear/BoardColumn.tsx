'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SectionProgress, Task } from '../../types';
import { SortableTaskItem } from './SortableTaskItem';
import { SECTION_PROGRESS_OPTIONS, renderProgressSvg } from './StatusIcon';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SECTION_COLORS = [
  '#71717a',
  '#d4d4d8',
  '#eab308',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
];

interface BoardColumnProps {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (columnId: string) => void;
  showStatus?: boolean;
  isCustom?: boolean;
  color?: string;
  progress?: SectionProgress | string;
  onEditSection?: (updates: {
    name: string;
    color: string;
    progress: SectionProgress;
  }) => Promise<void>;
  onDelete?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  isDragDisabled?: boolean;
}

export function BoardColumn({
  id,
  title,
  count,
  icon,
  tasks,
  onTaskClick,
  onAddTask,
  showStatus = true,
  isCustom = false,
  color = '#8b5cf6',
  progress = '1/2',
  onEditSection,
  onDelete,
  onMoveLeft,
  onMoveRight,
  canMoveLeft = false,
  canMoveRight = false,
  isDragDisabled = false,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: isDragDisabled,
    data: { columnId: id },
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [editName, setEditName] = useState(title);
  const [editColor, setEditColor] = useState(color);
  const [editProgress, setEditProgress] = useState<SectionProgress>(
    (progress as SectionProgress) || '1/2',
  );
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const openEditor = () => {
    setEditName(title);
    setEditColor(color);
    setEditProgress((progress as SectionProgress) || '1/2');
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !onEditSection) return;
    setIsSaving(true);
    try {
      await onEditSection({
        name: editName.trim(),
        color: editColor,
        progress: editProgress,
      });
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to update section:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const uniqueTasks = React.useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((t) => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [tasks]);

  const hasSectionActions =
    !isDragDisabled && Boolean(onEditSection || onMoveLeft || onMoveRight || (isCustom && onDelete));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[85vw] max-w-[320px] sm:w-[300px] shrink-0 snap-center sm:snap-align-none rounded-lg bg-[#101116]/75 border border-white/[0.04] transition-colors duration-150 select-none min-h-[500px] sm:min-h-[580px]',
        isOver && 'border-white/[0.16] bg-white/[0.03]',
      )}
    >
      {/* Minimal Linear Column Header */}
      <div className="relative flex items-center justify-between px-3 py-2.5 group/header">
        <div
          className={cn(
            'flex items-center gap-2 min-w-0',
            onEditSection && !isDragDisabled && 'cursor-pointer',
          )}
          onDoubleClick={() => {
            if (onEditSection && !isDragDisabled) openEditor();
          }}
          title={onEditSection && !isDragDisabled ? 'Double-click or use menu to edit section' : title}
        >
          {icon}
          <h3 className="text-[13px] font-medium text-zinc-200 truncate">
            {title}
          </h3>
          <span className="text-[12px] text-zinc-500 font-normal shrink-0">
            {count}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {hasSectionActions && (
            <button
              type="button"
              onClick={() => (menuOpen ? setMenuOpen(false) : openEditor())}
              className={cn(
                'p-1 rounded hover:bg-white/[0.07] text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer',
                menuOpen && 'bg-white/[0.08] text-zinc-200',
              )}
              title="Edit section"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          )}

          {onAddTask && !isDragDisabled && (
            <button
              type="button"
              onClick={() => onAddTask(id)}
              className="p-1 rounded hover:bg-white/[0.07] text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Add issue"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Inline Edit Section Popover */}
        {menuOpen && (
          <div
            ref={popoverRef}
            className="absolute right-2 top-10 z-50 w-[272px] rounded-xl border border-white/[0.1] bg-[#14151c] p-3 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                {renderProgressSvg(editProgress, editColor)}
                <span className="text-xs font-medium text-zinc-200 truncate">
                  Edit section
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {onEditSection && (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                {/* Section Name */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Section name..."
                    autoFocus
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#1b1c26] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25"
                  />
                </div>

                {/* Progress Style (Dashed, 0/4, 1/4, 1/2, 3/4, 1/1, X) */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1.5">Progress</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SECTION_PROGRESS_OPTIONS.map((opt) => {
                      const active = editProgress === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditProgress(opt.value)}
                          title={opt.label}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md border text-[10px] transition-colors cursor-pointer',
                            active
                              ? 'border-white/30 bg-white/[0.09] text-white font-medium'
                              : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200',
                          )}
                        >
                          {renderProgressSvg(opt.value, editColor)}
                          <span>{opt.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1.5">Color</label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SECTION_COLORS.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setEditColor(swatch)}
                        className={cn(
                          'w-5 h-5 rounded-full transition-transform cursor-pointer',
                          editColor.toLowerCase() === swatch.toLowerCase()
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#14151c] scale-110'
                            : 'opacity-80 hover:opacity-100 hover:scale-105',
                        )}
                        style={{ backgroundColor: swatch }}
                        title={swatch}
                      />
                    ))}
                    <label
                      className="w-5 h-5 rounded-full border border-dashed border-zinc-500 flex items-center justify-center cursor-pointer hover:border-zinc-300 overflow-hidden relative"
                      title="Custom color"
                    >
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: editColor }}
                      />
                    </label>
                  </div>
                </div>

                {/* Footer Controls: Move / Delete + Save */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1">
                    {onMoveLeft && canMoveLeft && (
                      <button
                        type="button"
                        onClick={() => {
                          onMoveLeft();
                          setMenuOpen(false);
                        }}
                        className="p-1.5 rounded-md hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Move left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onMoveRight && canMoveRight && (
                      <button
                        type="button"
                        onClick={() => {
                          onMoveRight();
                          setMenuOpen(false);
                        }}
                        className="p-1.5 rounded-md hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Move right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isCustom && onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="p-1.5 rounded-md hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="px-2 py-1 text-[11px] text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.05] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!editName.trim() || isSaving}
                      className="px-2.5 py-1 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Column Content */}
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-195px)]">
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
              sectionColor={color}
              sectionProgress={progress}
              disabled={isDragDisabled}
            />
          ))}
        </SortableContext>

        {/* Subtle bottom + button like Linear */}
        {onAddTask && !isDragDisabled && (
          <button
            type="button"
            onClick={() => onAddTask(id)}
            className="w-full h-7 rounded-md bg-white/[0.02] hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
            title={`Add issue to ${title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
