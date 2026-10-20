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
import { Task, TaskPriority, TaskStatus, WorkflowSection } from '../../types';
import { BoardColumn } from './BoardColumn';
import { PriorityIcon, PRIORITY_CONFIG } from './PriorityIcon';
import { StatusIcon, STATUS_CONFIG } from './StatusIcon';
import { TaskCard } from './TaskCard';
import { Plus, X, Loader2, Sparkles, ArrowRightLeft } from 'lucide-react';

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
  ) => Promise<void>;
  onDeleteSection?: (sectionId: string) => Promise<void>;
}

const PRIORITY_COLUMNS: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const DEFAULT_STATUS_COLUMNS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

const PRESET_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a1a1aa', // Zinc
];

interface ColumnDefinition {
  key: string;
  title: string;
  isCustom: boolean;
  color?: string;
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
  onDeleteSection,
}: BoardViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // New section form state
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionColor, setNewSectionColor] = useState('#8b5cf6');
  const [newSectionCategory, setNewSectionCategory] = useState<TaskStatus>('IN_PROGRESS');
  const [newSectionPosition, setNewSectionPosition] = useState('after_IN_PROGRESS');
  const [isSavingSection, setIsSavingSection] = useState(false);

  // Compute ordered status columns
  const orderedStatusColumns = useMemo<ColumnDefinition[]>(() => {
    if (groupBy === 'priority') return [];

    const allCols: ColumnDefinition[] = [
      ...DEFAULT_STATUS_COLUMNS.map((s) => ({
        key: s,
        title: STATUS_CONFIG[s].label,
        isCustom: false,
        category: s,
      })),
      ...customSections.map((sec) => ({
        key: sec.key,
        title: sec.name,
        isCustom: true,
        color: sec.color,
        category: sec.category || 'IN_PROGRESS',
        sectionId: sec.id,
      })),
    ];

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

    // Append any columns not listed in columnOrder yet
    allCols.forEach((c) => {
      if (!visited.has(c.key)) {
        // If it's a custom section, try inserting after its base category if possible
        result.push(c);
      }
    });

    return result;
  }, [groupBy, customSections, columnOrder]);

  // Set up sensors: require a 3px movement before dragging starts to allow normal clicks
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
        const targetOrder = overTask.order + (activeTaskItem.order < overTask.order ? 10 : -10);
        if (activeTaskItem.priority !== targetPriority || activeTaskItem.id !== overTask.id) {
          onTaskMove(activeId, { priority: targetPriority, targetOrder });
        }
      }
    } else {
      // Group by status
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

      // Dropped onto another task
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        const targetStatus = overTask.status;
        const targetCustomStatus = overTask.customStatus || null;
        const targetOrder = overTask.order + (activeTaskItem.order < overTask.order ? 10 : -10);

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

  // Move column before / left or after / right
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 px-1">
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
              />
            );
          })
        ) : (
          <>
            {/* Unified Ordered Columns (Both default and custom sections) */}
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
                    col.isCustom ? (
                      <StatusIcon status={col.title} color={col.color} />
                    ) : (
                      <StatusIcon status={col.key as TaskStatus} />
                    )
                  }
                  tasks={columnTasks}
                  onTaskClick={onTaskClick}
                  onAddTask={onAddTaskToGroup}
                  showStatus={false}
                  isCustom={col.isCustom}
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

            {/* + Add Section Button & Inline Popover Form */}
            {onCreateSection && (
              <div className="w-80 shrink-0">
                {!isAddingSection ? (
                  <button
                    onClick={() => setIsAddingSection(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#2b2c3a]/70 hover:border-[#4a4d65] text-xs font-medium text-zinc-400 hover:text-white bg-[#0e1017]/40 hover:bg-[#151624] transition-all cursor-pointer group h-12"
                  >
                    <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <span>Add section</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-[#2b2c3a] bg-[#12131d] p-3.5 space-y-3.5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-[#2b2c3a]/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: newSectionColor }} />
                        <span className="text-xs font-semibold text-zinc-200">New section</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingSection(false);
                          setNewSectionName('');
                        }}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateSectionSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                          Section Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. In Review, QA, Staging..."
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsAddingSection(false);
                          }}
                          autoFocus
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a1b28] border border-[#2b2c3a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>

                      {/* Color Picker */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewSectionColor(c)}
                              className={`w-5 h-5 rounded-full transition-transform ${
                                newSectionColor === c
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12131d] scale-110'
                                  : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Category Mapping */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                          Base Category
                        </label>
                        <select
                          value={newSectionCategory}
                          onChange={(e) => setNewSectionCategory(e.target.value as TaskStatus)}
                          className="w-full bg-[#1a1b28] border border-[#2b2c3a] text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                        >
                          <option value="BACKLOG">Backlog</option>
                          <option value="TODO">Todo / Unstarted</option>
                          <option value="IN_PROGRESS">In Progress / Started</option>
                          <option value="DONE">Done / Completed</option>
                          <option value="CANCELED">Canceled</option>
                        </select>
                      </div>

                      {/* Position Placement */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                          Position on Board
                        </label>
                        <select
                          value={newSectionPosition}
                          onChange={(e) => setNewSectionPosition(e.target.value)}
                          className="w-full bg-[#1a1b28] border border-[#2b2c3a] text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                        >
                          <option value="after_IN_PROGRESS">After In Progress (Recommended)</option>
                          <option value="after_TODO">After Todo</option>
                          <option value="after_BACKLOG">After Backlog</option>
                          <option value="before_DONE">Before Done</option>
                          <option value="end">At the end</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingSection(false);
                            setNewSectionName('');
                          }}
                          className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newSectionName.trim() || isSavingSection}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                        >
                          {isSavingSection ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Create section</span>
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
          <div className="w-80 cursor-grabbing">
            <TaskCard
              task={activeTask}
              onClick={() => {}}
              isDragging={true}
              showStatus={groupBy === 'priority'}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
