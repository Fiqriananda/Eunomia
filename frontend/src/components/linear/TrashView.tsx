'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task, Workspace } from '../../types';
import { api } from '../../lib/api';
import { PriorityIcon } from './PriorityIcon';
import { StatusIcon } from './StatusIcon';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Search,
  X,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/button';

interface TrashViewProps {
  workspace: Workspace;
  onTaskClick?: (task: Task) => void;
  onTaskRestored?: (task: Task) => void;
}

export function TrashView({ workspace, onTaskClick, onTaskRestored }: TrashViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchArchivedTasks = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const res = await api.tasks.getAll({
        workspaceId: workspace.id,
        archived: true,
      });
      setTasks(res);
    } catch (err) {
      console.error('Failed to load trash tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    fetchArchivedTasks();
  }, [fetchArchivedTasks]);

  const handleRestore = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionTaskId(task.id);
    try {
      const restored = await api.tasks.restore(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setStatusMessage(`Restored issue "${task.identifier}" to active issues.`);
      if (onTaskRestored) onTaskRestored(restored);
    } catch (err: any) {
      console.error('Failed to restore task:', err);
      alert(err.message || 'Failed to restore task');
    } finally {
      setActionTaskId(null);
    }
  };

  const handlePermanentDelete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to PERMANENTLY delete issue "${task.identifier}: ${task.title}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setActionTaskId(task.id);
    try {
      await api.tasks.permanentDelete(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setStatusMessage(`Permanently deleted issue "${task.identifier}".`);
    } catch (err: any) {
      console.error('Failed to permanently delete task:', err);
      alert(err.message || 'Failed to delete task permanently');
    } finally {
      setActionTaskId(null);
    }
  };

  const filtered = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.identifier.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Trash Bin & Archive</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Issues archived or soft-deleted from projects. You can restore them anytime or permanently remove them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trash..."
              className="bg-[#12131e] border border-border/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 w-48 sm:w-60"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-[#0e1017]/50">
          <Trash2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Trash bin is empty</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Deleted issues will appear here and can be restored back to your projects.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-[#0e1017] divide-y divide-border/40 overflow-hidden shadow-lg">
          {filtered.map((t) => {
            const isProcessing = actionTaskId === t.id;
            const deletedDate = t.deletedAt
              ? new Date(t.deletedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;

            return (
              <div
                key={t.id}
                onClick={() => onTaskClick && onTaskClick(t)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-[#131520] transition-colors gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PriorityIcon priority={t.priority} />
                  <StatusIcon status={t.status} />

                  <span className="text-xs font-mono text-zinc-500 shrink-0">
                    {t.identifier}
                  </span>

                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                      {t.title}
                    </div>
                    {deletedDate && (
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Deleted on {deletedDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={(e) => handleRestore(t, e)}
                    className="text-xs h-7 px-2.5 border-border hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                    title="Restore task to active issues"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    <span>Restore</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={(e) => handlePermanentDelete(t, e)}
                    className="text-xs h-7 px-2.5 border-border hover:bg-red-500/15 hover:border-red-500/40 text-red-400 hover:text-red-300 flex items-center gap-1.5"
                    title="Permanently remove task and all associated comments"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Permanently</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
