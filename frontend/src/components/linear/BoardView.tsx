'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  SectionProgress,
  Task,
  TaskPriority,
  TaskStatus,
  WorkflowSection,
} from '../../types';
import { BoardColumn } from './BoardColumn';
import { PriorityIcon, PRIORITY_CONFIG } from './PriorityIcon';
import {
  StatusIcon,
  DEFAULT_STATUS_META,
  SECTION_PROGRESS_OPTIONS,
  renderProgressSvg,
  resolveStatusVisual,
} from './StatusIcon';
import { TaskCard } from './TaskCard';
import { Plus, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BoardViewProps {
  tasks: Task[];
  groupBy: 'priority' | 'status';
  onTaskClick: (task: Task) => void;
  onTaskMove: (
    taskId: string,
    updates: {
      priority?: TaskPriority;
      status?: TaskStatus;
      customStatus?: string | null;
      targetOrder?: number;
    },
  ) => void;
  onAddTaskToGroup?: (groupId: string) => void;
  customSections?: WorkflowSection[];
  columnOrder?: string[];
  onUpdateColumnOrder?: (newOrder: string[]) => void;
  onCreateSection?: (
    name: string,
    color?: string,
    category?: TaskStatus,
    positionPlacement?: string,
    progress?: SectionProgress,
  ) => Promise<void>;
  onUpdateSection?: (
    sectionIdOrKey: string,
    updates: {
      name?: string;
      color?: string;
      progress?: SectionProgress;
      category?: TaskStatus;
    },
  ) => Promise<void>;
  onDeleteSection?: (sectionId: string) => Promise<void>;
  isDragDisabled?: boolean;
}

const PRIORITY_COLUMNS: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const DEFAULT_STATUS_COLUMNS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

const PRESET_COLORS = [
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

interface ColumnDefinition {
  key: string;
  title: string;
  isCustom: boolean;
  color: string;
  progress: SectionProgress | string;
  category?: TaskStatus;
  sectionId?: string;
}

export function BoardView({
  tasks,
  groupBy,
  onTaskClick,
  onTaskMove,
  onAddTaskToGroup,
  customSections = [],
  columnOrder = [],
  onUpdateColumnOrder,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  isDragDisabled = false,
}: BoardViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionColor, setNewSectionColor] = useState('#10b981');
  const [newSectionProgress, setNewSectionProgress] = useState<SectionProgress>('1/4');
  const [newSectionCategory, setNewSectionCategory] = useState<TaskStatus>('IN_PROGRESS');
  const [newSectionPosition, setNewSectionPosition] = useState('after_IN_PROGRESS');
  const [isSavingSection, setIsSavingSection] = useState(false);

  // Map sections by key for quick lookup (both custom sections and built-in column overrides)
  const sectionByKey = useMemo(() => {
    const map = new Map<string, WorkflowSection>();
    customSections.forEach((sec) => map.set(sec.key, sec));
    return map;
  }, [customSections]);

  // Compute ordered status columns
  const orderedStatusColumns = useMemo<ColumnDefinition[]>(() => {
    if (groupBy === 'priority') return [];

    const defaultKeySet = new Set<string>(DEFAULT_STATUS_COLUMNS);

    const defaultCols: ColumnDefinition[] = DEFAULT_STATUS_COLUMNS.map((s) => {
      const override = sectionByKey.get(s);
      const defaults = DEFAULT_STATUS_META[s];
      return {
        key: s,
        title: override?.name || defaults.label,
        isCustom: false,
        color: override?.color || defaults.color,
        progress: override?.progress || defaults.progress,
        category: s,
        sectionId: override?.id,
      };
    });

    const customCols: ColumnDefinition[] = customSections
      .filter((sec) => !defaultKeySet.has(sec.key))
      .map((sec) => {
        const catDefault = DEFAULT_STATUS_META[sec.category || 'IN_PROGRESS'];
        return {
          key: sec.key,
          title: sec.name,
          isCustom: true,
          color: sec.color || '#8b5cf6',
          progress: sec.progress || catDefault.progress,
          category: sec.category || 'IN_PROGRESS',
          sectionId: sec.id,
        };
      });

    const allCols: ColumnDefinition[] = [...defaultCols, ...customCols];
    const colMap = new Map<string, ColumnDefinition>(allCols.map((c) => [c.key, c]));
    const result: ColumnDefinition[] = [];
    const visited = new Set<string>();

    if (columnOrder && columnOrder.length > 0) {
      columnOrder.forEach((k) => {
        if (colMap.has(k)) {
          result.push(colMap.get(k)!);
          visited.add(k);
        }
      });
    }

    allCols.forEach((c) => {
      if (!visited.has(c.key)) {
        result.push(c);
      }
    });

    return result;
  }, [groupBy, customSections, columnOrder, sectionByKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    if (groupBy === 'priority') {
      const isColumn = PRIORITY_COLUMNS.includes(overId as TaskPriority);
      if (isColumn) {
        if (activeTaskItem.priority !== overId) {
          onTaskMove(activeId, { priority: overId as TaskPriority });
        }
        return;
      }

      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        const targetPriority = overTask.priority;
        const targetOrder =
          overTask.order + (activeTaskItem.order < overTask.order ? 10 : -10);
        if (
          activeTaskItem.priority !== targetPriority ||
          activeTaskItem.id !== overTask.id
        ) {
          onTaskMove(activeId, { priority: targetPriority, targetOrder });
        }
      }
    } else {
      const matchedCol = orderedStatusColumns.find((c) => c.key === overId);

      if (matchedCol) {
        if (matchedCol.isCustom) {
          if (activeTaskItem.customStatus !== matchedCol.key) {
            onTaskMove(activeId, {
              status: matchedCol.category || 'IN_PROGRESS',
              customStatus: matchedCol.key,
            });
          }
        } else {
          if (activeTaskItem.status !== matchedCol.key || activeTaskItem.customStatus) {
            onTaskMove(activeId, {
              status: matchedCol.key as TaskStatus,
              customStatus: null,
            });
          }
        }
        return;
      }

      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        const targetStatus = overTask.status;
        const targetCustomStatus = overTask.customStatus || null;
        const targetOrder =
          overTask.order + (activeTaskItem.order < overTask.order ? 10 : -10);

        if (
          activeTaskItem.status !== targetStatus ||
          activeTaskItem.customStatus !== targetCustomStatus ||
          activeTaskItem.id !== overTask.id
        ) {
          onTaskMove(activeId, {
            status: targetStatus,
            customStatus: targetCustomStatus,
            targetOrder,
          });
        }
      }
    }
  };

  const handleMoveColumn = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedStatusColumns.length) return;

    const currentKeys = orderedStatusColumns.map((c) => c.key);
    const temp = currentKeys[index];
    currentKeys[index] = currentKeys[targetIndex];
    currentKeys[targetIndex] = temp;

    if (onUpdateColumnOrder) {
      onUpdateColumnOrder(currentKeys);
    }
  };

  const handleCreateSectionSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSectionName.trim() || !onCreateSection) return;

    setIsSavingSection(true);
    try {
      await onCreateSection(
        newSectionName.trim(),
        newSectionColor,
        newSectionCategory,
        newSectionPosition,
        newSectionProgress,
      );
      setNewSectionName('');
      setIsAddingSection(false);
    } catch (err) {
      console.error('Failed to create section:', err);
    } finally {
      setIsSavingSection(false);
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

  const getTaskSectionVisual = (task: Task) => {
    const resolved = resolveStatusVisual(task.status, task.customStatus, customSections);
    return { color: resolved.color, progress: resolved.progress };
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-6 pt-1 px-2 sm:px-4 snap-x snap-mandatory sm:snap-none no-scrollbar">
        {groupBy === 'priority' ? (
          PRIORITY_COLUMNS.map((priority) => {
            const columnTasks = uniqueTasks
              .filter((t) => t.priority === priority)
              .sort((a, b) => a.order - b.order);

            return (
              <BoardColumn
                key={priority}
                id={priority}
                title={PRIORITY_CONFIG[priority].label}
                count={columnTasks.length}
                icon={<PriorityIcon priority={priority} />}
                tasks={columnTasks}
                onTaskClick={onTaskClick}
                onAddTask={onAddTaskToGroup}
                showStatus={true}
                isDragDisabled={isDragDisabled}
              />
            );
          })
        ) : (
          <>
            {orderedStatusColumns.map((col, index) => {
              const columnTasks = uniqueTasks
                .filter((t) =>
                  col.isCustom
                    ? t.customStatus === col.key
                    : t.status === col.key && !t.customStatus,
                )
                .sort((a, b) => a.order - b.order);

              return (
                <BoardColumn
                  key={col.key}
                  id={col.key}
                  title={col.title}
                  count={columnTasks.length}
                  icon={
                    <StatusIcon
                      status={col.key}
                      color={col.color}
                      progress={col.progress}
                    />
                  }
                  color={col.color}
                  progress={col.progress}
                  tasks={columnTasks}
                  onTaskClick={onTaskClick}
                  onAddTask={onAddTaskToGroup}
                  showStatus={true}
                  isCustom={col.isCustom}
                  isDragDisabled={isDragDisabled}
                  onEditSection={
                    onUpdateSection
                      ? (updates) =>
                          onUpdateSection(col.sectionId || col.key, updates)
                      : undefined
                  }
                  onDelete={
                    col.isCustom && onDeleteSection && col.sectionId
                      ? () => onDeleteSection(col.sectionId!)
                      : undefined
                  }
                  onMoveLeft={() => handleMoveColumn(index, 'left')}
                  onMoveRight={() => handleMoveColumn(index, 'right')}
                  canMoveLeft={index > 0}
                  canMoveRight={index < orderedStatusColumns.length - 1}
                />
              );
            })}

            {/* Minimal Linear-style + Add Section Column */}
            {onCreateSection && !isDragDisabled && (
              <div className="w-[85vw] max-w-[320px] sm:w-[300px] shrink-0 snap-center sm:snap-align-none">
                {!isAddingSection ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingSection(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-white/[0.08] hover:border-white/[0.18] text-xs font-medium text-zinc-500 hover:text-zinc-200 bg-white/[0.015] hover:bg-white/[0.04] transition-colors cursor-pointer h-10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add section</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-white/[0.1] bg-[#14151c] p-3.5 space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        {renderProgressSvg(newSectionProgress, newSectionColor)}
                        <span className="text-xs font-medium text-zinc-200">
                          New section
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingSection(false);
                          setNewSectionName('');
                        }}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateSectionSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Section Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Issue Review, Ready for Dev..."
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsAddingSection(false);
                          }}
                          autoFocus
                          className="w-full px-2.5 py-1.5 rounded-md bg-[#1b1c26] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25"
                        />
                      </div>

                      {/* Progress Selector */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1.5">
                          Progress
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {SECTION_PROGRESS_OPTIONS.map((opt) => {
                            const active = newSectionProgress === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setNewSectionProgress(opt.value)}
                                title={opt.label}
                                className={cn(
                                  'flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md border text-[10px] transition-colors cursor-pointer',
                                  active
                                    ? 'border-white/30 bg-white/[0.09] text-white font-medium'
                                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200',
                                )}
                              >
                                {renderProgressSvg(opt.value, newSectionColor)}
                                <span>{opt.shortLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Color Picker */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1.5">
                          Color
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewSectionColor(c)}
                              className={cn(
                                'w-5 h-5 rounded-full transition-transform cursor-pointer',
                                newSectionColor.toLowerCase() === c.toLowerCase()
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#14151c] scale-110'
                                  : 'hover:scale-105 opacity-80 hover:opacity-100',
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <label
                            className="w-5 h-5 rounded-full border border-dashed border-zinc-500 flex items-center justify-center cursor-pointer hover:border-zinc-300 overflow-hidden relative"
                            title="Custom color"
                          >
                            <input
                              type="color"
                              value={newSectionColor}
                              onChange={(e) => setNewSectionColor(e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: newSectionColor }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Category Mapping */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Category
                          </label>
                          <select
                            value={newSectionCategory}
                            onChange={(e) =>
                              setNewSectionCategory(e.target.value as TaskStatus)
                            }
                            className="w-full bg-[#1b1c26] border border-white/[0.08] text-zinc-200 rounded-md px-2 py-1.5 text-[11px] focus:outline-none cursor-pointer"
                          >
                            <option value="BACKLOG">Backlog</option>
                            <option value="TODO">Todo</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                            <option value="CANCELED">Canceled</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Position
                          </label>
                          <select
                            value={newSectionPosition}
                            onChange={(e) => setNewSectionPosition(e.target.value)}
                            className="w-full bg-[#1b1c26] border border-white/[0.08] text-zinc-200 rounded-md px-2 py-1.5 text-[11px] focus:outline-none cursor-pointer"
                          >
                            <option value="after_IN_PROGRESS">After In Progress</option>
                            <option value="after_TODO">After Todo</option>
                            <option value="after_BACKLOG">After Backlog</option>
                            <option value="before_DONE">Before Done</option>
                            <option value="end">At the end</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingSection(false);
                            setNewSectionName('');
                          }}
                          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.05] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newSectionName.trim() || isSavingSection}
                          className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSavingSection ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Create</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[300px] cursor-grabbing">
            <TaskCard
              task={activeTask}
              onClick={() => {}}
              isDragging={true}
              showStatus={true}
              sectionColor={getTaskSectionVisual(activeTask).color}
              sectionProgress={getTaskSectionVisual(activeTask).progress}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
