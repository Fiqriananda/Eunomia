'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cycle, Task, Workspace } from '../../types';
import { api } from '../../lib/api';
import { PriorityIcon } from './PriorityIcon';
import { StatusIcon } from './StatusIcon';
import {
  RotateCw,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Plus,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  X,
  Target,
} from 'lucide-react';
import { Button } from '../ui/button';

interface CyclesViewProps {
  workspace: Workspace;
  onTaskClick: (task: Task) => void;
  onOpenCreateTask?: (cycleId?: string) => void;
}

export function CyclesView({ workspace, onTaskClick, onOpenCreateTask }: CyclesViewProps) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [cycleTasks, setCycleTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [rolloverLoading, setRolloverLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Cycle Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [creatingCycle, setCreatingCycle] = useState(false);

  const fetchCycles = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const allCycles = await api.cycles.getAll(workspace.id);
      setCycles(allCycles);

      const active = allCycles.find((c) => c.status === 'ACTIVE') || allCycles[0] || null;
      setActiveCycle(active);
      setSelectedCycleId((prev) => prev || (active ? active.id : null));
    } catch (err) {
      console.error('Failed to load cycles:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  // Fetch tasks for currently selected cycle
  useEffect(() => {
    if (!workspace || !selectedCycleId) {
      setCycleTasks([]);
      return;
    }
    const loadTasks = async () => {
      setTasksLoading(true);
      try {
        const tasks = await api.tasks.getAll({
          workspaceId: workspace.id,
          cycleId: selectedCycleId,
          archived: false,
        });
        setCycleTasks(tasks);
      } catch (err) {
        console.error('Failed to load cycle tasks:', err);
      } finally {
        setTasksLoading(false);
      }
    };
    loadTasks();
  }, [workspace, selectedCycleId]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleName.trim() || !newStartDate || !newEndDate) return;

    setCreatingCycle(true);
    try {
      const created = await api.cycles.create({
        workspaceId: workspace.id,
        name: newCycleName.trim(),
        startDate: new Date(newStartDate).toISOString(),
        endDate: new Date(newEndDate).toISOString(),
      });
      setIsCreateModalOpen(false);
      setNewCycleName('');
      setNewStartDate('');
      setNewEndDate('');
      await fetchCycles();
      setSelectedCycleId(created.id);
      setStatusMessage(`Cycle "${created.name}" created successfully.`);
    } catch (err: any) {
      console.error('Failed to create cycle:', err);
      alert(err.message || 'Failed to create cycle');
    } finally {
      setCreatingCycle(false);
    }
  };

  const handleRollover = async (cycleId: string) => {
    const confirmRollover = window.confirm(
      'Move all unfinished (not DONE/CANCELED) tasks in this cycle to the next cycle?',
    );
    if (!confirmRollover) return;

    setRolloverLoading(true);
    try {
      const res = await api.cycles.rollover(cycleId);
      setStatusMessage(`${res.message} (${res.rolledOverCount} tasks moved).`);
      await fetchCycles();
      // Reload tasks
      const tasks = await api.tasks.getAll({
        workspaceId: workspace.id,
        cycleId: selectedCycleId || undefined,
        archived: false,
      });
      setCycleTasks(tasks);
    } catch (err: any) {
      console.error('Failed to rollover cycle:', err);
      alert(err.message || 'Failed to rollover tasks');
    } finally {
      setRolloverLoading(false);
    }
  };

  const displayedCycle = cycles.find((c) => c.id === selectedCycleId) || activeCycle;
  const metrics = displayedCycle?.metrics;

  const totalPoints = metrics?.totalPoints || 0;
  const completedPoints = metrics?.completedPoints || 0;
  const remainingPoints = metrics?.remainingPoints || 0;
  const velocityPercentage = metrics?.velocityPercentage || 0;

  // Calculate days remaining
  const calculateDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining(displayedCycle?.endDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Cycles & Sprints</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track iteration velocity, estimate story points, and monitor burndown progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="linear"
            size="sm"
            onClick={() => {
              const start = new Date();
              const end = new Date();
              end.setDate(end.getDate() + 14);
              setNewStartDate(start.toISOString().split('T')[0]);
              setNewEndDate(end.toISOString().split('T')[0]);
              setNewCycleName(`Cycle ${cycles.length + 1}`);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Cycle</span>
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cycle Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {cycles.map((c) => {
          const isSelected = c.id === displayedCycle?.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCycleId(c.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#181a28] border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-[#0f1017] border-border/40 text-zinc-400 hover:text-white hover:border-border'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  c.status === 'ACTIVE'
                    ? 'bg-emerald-400 animate-pulse'
                    : c.status === 'COMPLETED'
                    ? 'bg-zinc-500'
                    : 'bg-indigo-400'
                }`}
              />
              <span className="font-semibold">{c.name}</span>
              <span className="text-[10px] text-zinc-500">
                ({c._count?.tasks ?? c.metrics?.totalTasks ?? 0})
              </span>
            </button>
          );
        })}
      </div>

      {displayedCycle ? (
        <div className="space-y-6">
          {/* Active Cycle Velocity & Burndown Summary Card */}
          <div className="p-5 rounded-xl bg-[#0f101a] border border-border/60 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white">{displayedCycle.name}</h2>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      displayedCycle.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : displayedCycle.status === 'COMPLETED'
                        ? 'bg-zinc-800 text-zinc-400'
                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {displayedCycle.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {new Date(displayedCycle.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(displayedCycle.endDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {daysRemaining > 0
                      ? `${daysRemaining} days remaining`
                      : daysRemaining === 0
                      ? 'Last day of cycle'
                      : 'Cycle ended'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRollover(displayedCycle.id)}
                  disabled={rolloverLoading}
                  className="text-xs h-8 border-border hover:bg-secondary flex items-center gap-1.5"
                  title="Move unfinished tasks to next sprint"
                >
                  {rolloverLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>Rollover Tasks</span>
                </Button>
              </div>
            </div>

            {/* Velocity & Burndown Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3 rounded-lg bg-[#141624] border border-border/40">
                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-indigo-400" />
                  <span>Story Points</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {completedPoints} <span className="text-xs text-zinc-500 font-normal">/ {totalPoints} pts</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141624] border border-border/40">
                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Tasks Completed</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {metrics?.completedTasks ?? 0}{' '}
                  <span className="text-xs text-zinc-500 font-normal">
                    / {metrics?.totalTasks ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141624] border border-border/40">
                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Remaining</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {remainingPoints} <span className="text-xs text-zinc-500 font-normal">pts ({metrics?.remainingTasks ?? 0} tasks)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141624] border border-border/40">
                <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-cyan-400" />
                  <span>Burndown Velocity</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {velocityPercentage}%
                </div>
              </div>
            </div>

            {/* Velocity Visual Progress Bar */}
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-zinc-400">Sprint Progress</span>
                <span className="text-indigo-400 font-bold">{velocityPercentage}% Completed</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, velocityPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tasks in this Cycle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Cycle Issues</span>
                <span className="text-xs text-zinc-500 font-mono">({cycleTasks.length})</span>
              </h3>

              {onOpenCreateTask && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenCreateTask(displayedCycle.id)}
                  className="text-xs h-7 border-border hover:bg-secondary flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Issue</span>
                </Button>
              )}
            </div>

            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : cycleTasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/50 rounded-xl bg-[#0e1017]/40">
                <p className="text-xs text-zinc-400">No issues assigned to this cycle yet.</p>
                {onOpenCreateTask && (
                  <Button
                    variant="linear"
                    size="sm"
                    onClick={() => onOpenCreateTask(displayedCycle.id)}
                    className="mt-3 text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Issue for {displayedCycle.name}</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-[#0e1017] divide-y divide-border/40 overflow-hidden">
                {cycleTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className="flex items-center justify-between p-3 hover:bg-secondary/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PriorityIcon priority={t.priority} />
                      <StatusIcon status={t.status} />
                      <span className="text-xs font-mono text-zinc-500 shrink-0">
                        {t.identifier}
                      </span>
                      <span className="text-xs text-zinc-200 truncate font-medium group-hover:text-primary transition-colors">
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      {t.estimate !== undefined && t.estimate !== null && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                          {t.estimate} pts
                        </span>
                      )}

                      {t.assignee && (
                        <div className="flex items-center gap-1.5" title={t.assignee.name}>
                          <img
                            src={
                              t.assignee.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                t.assignee.name,
                              )}`
                            }
                            alt=""
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-[#0e1017]/50">
          <h3 className="text-base font-semibold text-white">No cycles yet</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create your first sprint cycle to track velocity and story points.
          </p>
          <Button
            variant="linear"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Cycle</span>
          </Button>
        </div>
      )}

      {/* Create Cycle Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12131e] border border-border rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-indigo-400" />
                <span>Create New Cycle</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Cycle Name</label>
                <input
                  type="text"
                  required
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  placeholder="e.g. Cycle 2 (Sprint 2)"
                  className="w-full bg-[#181a28] border border-border/80 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-[#181a28] border border-border/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-[#181a28] border border-border/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="linear"
                  size="sm"
                  disabled={creatingCycle || !newCycleName.trim()}
                  className="text-xs inline-flex items-center gap-1.5"
                >
                  {creatingCycle && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Cycle</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
