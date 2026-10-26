'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';

interface SortableTaskItemProps {
  task: Task;
  onClick: (task: Task) => void;
  showStatus?: boolean;
  disabled?: boolean;
}

export function SortableTaskItem({ task, onClick, showStatus, disabled = false }: SortableTaskItemProps) {
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
        dragHandleProps={disabled ? undefined : listeners}
        showStatus={showStatus}
      />
    </div>
  );
}
