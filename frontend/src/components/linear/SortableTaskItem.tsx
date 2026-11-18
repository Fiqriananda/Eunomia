'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionProgress, Task } from '../../types';
import { TaskCard } from './TaskCard';

interface SortableTaskItemProps {
  task: Task;
  onClick: (task: Task) => void;
  showStatus?: boolean;
  sectionColor?: string;
  sectionProgress?: SectionProgress | string | null;
  disabled?: boolean;
}

export function SortableTaskItem({
  task,
  onClick,
  showStatus = true,
  sectionColor,
  sectionProgress,
  disabled = false,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        onClick={onClick}
        isDragging={isDragging}
        dragHandleProps={disabled ? undefined : (listeners as Record<string, unknown>)}
        showStatus={showStatus}
        sectionColor={sectionColor}
        sectionProgress={sectionProgress}
      />
    </div>
  );
}
