'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit3,
  Trash2,
  Layers,
  ListTodo,
  Activity,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Project, Task, Workspace } from '../../types';
import { StatusIcon } from './StatusIcon';
import { PriorityIcon } from './PriorityIcon';
import { api } from '../../lib/api';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  workspace: Workspace;
  selectedProject: Project | null;
  onSelectProject: (p: Project | null) => void;
  onOpenCreateProject: () => void;
  onOpenEditProject: (p: Project) => void;
  onOpenCreateTaskForProject: (p: Project) => void;
  onOpenTaskDetail: (t: Task) => void;
  onRefresh: () => Promise<void>;
}

export function ProjectsView({
  projects,
  tasks,
  workspace,
  selectedProject,
  onSelectProject,
  onOpenCreateProject,
  onOpenEditProject,
  onOpenCreateTaskForProject,
  onOpenTaskDetail,
  onRefresh,
}: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'PLANNED' | 'COMPLETED' | 'CANCELED'>('ALL');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Compute task statistics for every project
  const projectStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        total: number;
        done: number;
        inProgress: number;
        todo: number;
        backlog: number;
        canceled: number;
        progress: number;
      }
    > = {};

    for (const p of projects) {
      // Find all tasks belonging to this project (from tasks list or p.tasks)
      const projectTasks = tasks.filter((t) => t.projectId === p.id && !t.isArchived);
      const total = projectTasks.length;
      const done = projectTasks.filter((t) => t.status === 'DONE').length;
      const inProgress = projectTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const todo = projectTasks.filter((t) => t.status === 'TODO').length;
      const backlog = projectTasks.filter((t) => t.status === 'BACKLOG').length;
      const canceled = projectTasks.filter((t) => t.status === 'CANCELED').length;
      const activeTotal = total - canceled;
      const progress = activeTotal > 0 ? Math.round((done / activeTotal) * 100) : 0;

      statsMap[p.id] = { total, done, inProgress, todo, backlog, canceled, progress };
    }

    return statsMap;
  }, [projects, tasks]);

  // High-level workspace project stats
  const overallStats = useMemo(() => {
    const totalProjects = projects.length;
    const inProgressProjects = projects.filter((p) => (p.status || 'IN_PROGRESS') === 'IN_PROGRESS').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
    const plannedProjects = projects.filter((p) => p.status === 'PLANNED').length;

    let totalTasks = 0;
    let completedTasks = 0;
    for (const p of projects) {
      const s = projectStats[p.id];
      if (s) {
        totalTasks += s.total;
        completedTasks += s.done;
      }
    }

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      inProgressProjects,
      completedProjects,
      plannedProjects,
      totalTasks,
      completedTasks,
      overallProgress,
    };
  }, [projects, projectStats]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && (p.status || 'IN_PROGRESS') !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchKey = p.key.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchKey && !matchDesc) return false;
      }
      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  const handleDeleteProject = async (p: Project) => {
    if (projects.length <= 1) {
      alert('Cannot delete the last remaining project in this workspace.');
      return;
    }
    const stat = projectStats[p.id];
    const warning = stat && stat.total > 0
      ? `Project "${p.name}" has ${stat.total} linked tasks. Deleting this project will remove or unassign these tasks. Are you sure?`
      : `Are you sure you want to delete Project "${p.name}"?`;

    if (!confirm(warning)) return;

    setIsDeletingId(p.id);
    try {
      await api.projects.delete(p.id);
      if (selectedProject?.id === p.id) {
        onSelectProject(null);
      }
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      alert(err.message || 'Failed to delete project');
    } finally {
      setIsDeletingId(null);
    }
  };

  // If a project is selected, render the Detailed Epic View
  if (selectedProject) {
    const activeProject = projects.find((p) => p.id === selectedProject.id) || selectedProject;
    const stat = projectStats[activeProject.id] || {
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
      backlog: 0,
      canceled: 0,
      progress: 0,
    };
    const projectTasks = tasks.filter((t) => t.projectId === activeProject.id && !t.isArchived);

    return (
      <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-y-auto">
        {/* Epic Detail Header */}
        <div className="border-b border-border/40 bg-[#0e1017]/80 backdrop-blur-md px-6 py-5 sticky top-0 z-20">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => onSelectProject(null)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all Projects / Epics</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenEditProject(activeProject)}
                className="px-3 py-1.5 rounded-lg border border-border/60 bg-[#141520] hover:bg-secondary/60 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Epic</span>
              </button>
              <button
                onClick={() => onOpenCreateTaskForProject(activeProject)}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Issue to Epic</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: activeProject.color || '#6366f1' }}
                />
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeProject.name}
                </h1>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-border/60">
                  {activeProject.key}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    activeProject.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : activeProject.status === 'PLANNED'
                      ? 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50'
                      : activeProject.status === 'CANCELED'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {activeProject.status || 'IN_PROGRESS'}
                </span>
              </div>

              {activeProject.description && (
                <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                  {activeProject.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1 flex-wrap">
                {activeProject.lead && (
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Lead:</span>
                    <span className="text-zinc-200 font-medium">{activeProject.lead.name}</span>
                  </div>
                )}
                {activeProject.targetDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Target:</span>
                    <span className="text-zinc-200 font-medium">
                      {new Date(activeProject.targetDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-[#141520] border border-border/80 rounded-xl p-4 min-w-[240px] shrink-0">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-zinc-400 font-medium">Epic Progress</span>
                <span className="text-white font-bold font-mono">{stat.progress}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stat.progress}%`,
                    backgroundColor: activeProject.color || '#6366f1',
                  }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                <div className="bg-zinc-800/40 p-1 rounded">
                  <div className="font-bold text-white font-mono">{stat.done}</div>
                  <div className="text-zinc-500">Done</div>
                </div>
                <div className="bg-zinc-800/40 p-1 rounded">
                  <div className="font-bold text-amber-400 font-mono">{stat.inProgress}</div>
                  <div className="text-zinc-500">Active</div>
                </div>
                <div className="bg-zinc-800/40 p-1 rounded">
                  <div className="font-bold text-zinc-400 font-mono">{stat.todo}</div>
                  <div className="text-zinc-500">Todo</div>
                </div>
                <div className="bg-zinc-800/40 p-1 rounded">
                  <div className="font-bold text-zinc-400 font-mono">{stat.backlog}</div>
                  <div className="text-zinc-500">Backlog</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Epic Tasks List */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">
                Issues in this Epic ({projectTasks.length})
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Prefix: {activeProject.key}-*
            </span>
          </div>

          {projectTasks.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-[#0c0d14]/40">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3">
                <ListTodo className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">No issues in this Epic yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Start breaking down this project by creating individual issues for your team.
              </p>
              <button
                onClick={() => onOpenCreateTaskForProject(activeProject)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Issue</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#10111a] border border-border/80 rounded-xl overflow-hidden divide-y divide-border/40">
              {projectTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onOpenTaskDetail(t)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PriorityIcon priority={t.priority} />
                    <StatusIcon status={t.status} />
                    <span className="text-xs font-mono text-zinc-400 font-medium shrink-0">
                      {t.identifier}
                    </span>
                    <span className="text-xs text-zinc-200 font-medium truncate group-hover:text-white transition-colors">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {t.cycle && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded hidden sm:inline">
                        Cycle {t.cycle.number}
                      </span>
                    )}
                    {t.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-medium text-white overflow-hidden">
                          {t.assignee.avatarUrl ? (
                            <img
                              src={t.assignee.avatarUrl}
                              alt={t.assignee.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            t.assignee.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 hidden md:inline">
                          {t.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic hidden sm:inline">
                        Unassigned
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, render All Projects (Epics) Dashboard
  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-y-auto">
      {/* Top Header */}
      <div className="border-b border-border/40 bg-[#0e1017]/80 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Projects (Epics)
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              High-level initiatives containing issues, sprints, and delivery milestones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateProject}
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(['ALL', 'IN_PROGRESS', 'PLANNED', 'COMPLETED', 'CANCELED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-secondary/40'
                }`}
              >
                {st === 'ALL'
                  ? 'All Projects'
                  : st === 'IN_PROGRESS'
                  ? 'In Progress'
                  : st === 'PLANNED'
                  ? 'Planned'
                  : st === 'COMPLETED'
                  ? 'Completed'
                  : 'Canceled'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-[#141520] border border-border/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Workspace Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#10111a] border border-border/60 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-zinc-400">Total Projects</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {overallStats.totalProjects}
            </div>
            <span className="text-[10px] text-zinc-500">Across {workspace.name}</span>
          </div>

          <div className="bg-[#10111a] border border-border/60 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-amber-400">In Progress</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {overallStats.inProgressProjects}
            </div>
            <span className="text-[10px] text-zinc-500">Active epics</span>
          </div>

          <div className="bg-[#10111a] border border-border/60 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-emerald-400">Completed</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {overallStats.completedProjects}
            </div>
            <span className="text-[10px] text-zinc-500">Delivered</span>
          </div>

          <div className="bg-[#10111a] border border-border/60 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-indigo-400">Global Completion</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {overallStats.overallProgress}%
            </div>
            <span className="text-[10px] text-zinc-500">
              {overallStats.completedTasks}/{overallStats.totalTasks} issues done
            </span>
          </div>
        </div>

        {/* Project Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-[#0c0d14]/40">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No Projects Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Create an Epic project like "PDF Schedule Uploader" to organize features and tasks.
            </p>
            <button
              onClick={onOpenCreateProject}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((p) => {
              const stat = projectStats[p.id] || {
                total: 0,
                done: 0,
                inProgress: 0,
                todo: 0,
                backlog: 0,
                canceled: 0,
                progress: 0,
              };

              return (
                <div
                  key={p.id}
                  className="bg-[#10111a] hover:bg-[#131420] border border-border/70 hover:border-border rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    {/* Header: Badge, Title & Actions */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color || '#6366f1' }}
                        />
                        <h3
                          onClick={() => onSelectProject(p)}
                          className="text-sm font-semibold text-white truncate cursor-pointer hover:text-primary transition-colors"
                        >
                          {p.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-border/40">
                          {p.key}
                        </span>
                        <button
                          onClick={() => onOpenEditProject(p)}
                          title="Edit Project"
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {projects.length > 1 && (
                          <button
                            onClick={() => handleDeleteProject(p)}
                            title="Delete Project"
                            disabled={isDeletingId === p.id}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status & Date */}
                    <div className="flex items-center gap-2 text-[11px] mb-3 flex-wrap">
                      <span
                        className={`font-medium px-2 py-0.5 rounded-full border text-[10px] ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : p.status === 'PLANNED'
                            ? 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50'
                            : p.status === 'CANCELED'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {p.status || 'IN_PROGRESS'}
                      </span>

                      {p.targetDate && (
                        <span className="flex items-center gap-1 text-zinc-500 text-[10px]">
                          <Calendar className="w-3 h-3" />
                          {new Date(p.targetDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}

                      {p.lead && (
                        <span className="flex items-center gap-1 text-zinc-400 text-[10px]">
                          <UserIcon className="w-3 h-3 text-zinc-500" />
                          {p.lead.name}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {p.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Progress & Bottom Bar */}
                  <div className="pt-3 border-t border-border/40 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 text-[11px]">
                        {stat.done} of {stat.total} issues completed
                      </span>
                      <span className="font-mono font-bold text-white text-[11px]">
                        {stat.progress}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${stat.progress}%`,
                          backgroundColor: p.color || '#6366f1',
                        }}
                      />
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => onOpenCreateTaskForProject(p)}
                        className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add issue</span>
                      </button>

                      <button
                        onClick={() => onSelectProject(p)}
                        className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors group-hover:translate-x-0.5"
                      >
                        <span>View Epic</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
