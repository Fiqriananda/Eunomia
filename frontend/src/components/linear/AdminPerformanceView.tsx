'use client';

import React, { useState, useEffect } from 'react';
import { Workspace, User } from '../../types';
import { api } from '../../lib/api';
import {
  BarChart3,
  Shield,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Clock,
  Users,
  Layers,
  Lock,
  RefreshCw,
  FolderKanban,
  Repeat,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/UserAvatar';

interface AdminPerformanceViewProps {
  workspace: Workspace;
  canManage: boolean;
  currentUser: User | null;
}

export function AdminPerformanceView({
  workspace,
  canManage,
  currentUser,
}: AdminPerformanceViewProps) {
  const [period, setPeriod] = useState<'all' | 'this_month' | 'this_week'>('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getPerformance(workspace.id, period);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load performance indicators:', err);
      setError(err.message || 'Failed to load performance indicators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [workspace.id, period, canManage]);

  // Access denied state for non-admin members
  if (!canManage) {
    return (
      <div className="max-w-lg mx-auto my-16 bg-[#12131d]/90 border border-border/70 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-300 font-bold uppercase tracking-wider mb-2">
            Admin Access Only
          </div>
          <h2 className="text-xl font-bold text-white">Performance Indicators Restricted</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
          Detailed team performance analytics and finished task indicators are only accessible to workspace Owners and Administrators. Your current role is Member.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        <p className="text-xs text-zinc-400">Analyzing finished tasks & team productivity metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-md mx-auto my-12 bg-[#12131d]/90 border border-rose-500/30 rounded-xl p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="text-sm font-semibold text-white">Error Loading Performance Data</h3>
        <p className="text-xs text-zinc-400">{error}</p>
        <Button size="sm" onClick={fetchPerformance} className="mt-2 text-xs">
          Try Again
        </Button>
      </div>
    );
  }

  const summary = data?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
    totalMembers: 0,
    activeMembers: 0,
    avgTasksPerMember: 0,
  };

  const members: any[] = data?.members || [];
  const projects: any[] = data?.projects || [];
  const cycles: any[] = data?.cycles || [];
  const recentDoneTasks: any[] = data?.recentDoneTasks || [];

  return (
    <div className="space-y-6">
      {/* Controls Bar: Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12131d]/80 border border-border/60 rounded-xl p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Performance Indicators</h2>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Task finish rate, output metrics, and member leaderboard for {workspace.name}
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#090a0f] p-1 rounded-lg border border-border/60 self-start sm:self-auto">
          {(
            [
              { key: 'all', label: 'All Time' },
              { key: 'this_month', label: 'This Month' },
              { key: 'this_week', label: 'This Week' },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                period === p.key
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPerformance}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Hero Finished Tasks Metric Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main completion card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#181a24] to-[#101117] border border-border/70 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Finished Tasks
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {summary.completedTasks}
                </span>
                <span className="text-zinc-400 text-sm font-medium">
                  / {summary.totalTasks} total tasks
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{summary.completedThisWeek} completed this week</span>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="flex items-center gap-4 sm:flex-col sm:items-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-500 transition-all duration-700 ease-out"
                    strokeDasharray={`${summary.completionRate}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-bold text-white block leading-none">
                    {Math.round(summary.completionRate)}%
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase">
                    Finish
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary KPI summary */}
        <div className="bg-[#12131d]/60 border border-border/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Team Productivity Rate
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  In Progress
                </span>
                <span className="font-semibold text-white">{summary.inProgressTasks} tasks</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Pending (Todo/Backlog)
                </span>
                <span className="font-semibold text-white">{summary.pendingTasks} tasks</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Active Contributors
                </span>
                <span className="font-semibold text-white">
                  {summary.activeMembers} / {summary.totalMembers}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Average Output / Member</span>
            <span className="text-base font-bold text-indigo-400">
              {summary.avgTasksPerMember.toFixed(1)} <span className="text-xs font-normal text-zinc-400">done</span>
            </span>
          </div>
        </div>
      </div>

      {/* Member Finish Leaderboard */}
      <div className="bg-[#12131d]/60 border border-border/60 rounded-2xl overflow-hidden shadow-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Member Finish Leaderboard
              </h3>
              <p className="text-[11px] text-zinc-400">
                Ranked by volume of finished tasks (status DONE) in workspace
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 self-start sm:self-auto">
            {members.length} team members
          </span>
        </div>

        <div className="divide-y divide-border/40">
          {members.map((m) => {
            const isTop1 = m.rank === 1;
            const isTop2 = m.rank === 2;
            const isTop3 = m.rank === 3;

            return (
              <div
                key={m.userId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/15 transition-colors rounded-xl px-2.5 -mx-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank badge */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                      isTop1
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : isTop2
                        ? 'bg-zinc-700/40 border-zinc-500/50 text-zinc-300'
                        : isTop3
                        ? 'bg-amber-900/30 border-amber-700/50 text-amber-400'
                        : 'bg-zinc-800/40 border-border/50 text-zinc-500'
                    }`}
                  >
                    #{m.rank}
                  </div>

                  {/* Avatar & User */}
                  <UserAvatar
                    user={{
                      id: m.userId,
                      name: m.name,
                      avatarUrl: m.avatarUrl,
                    }}
                    size="md"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white truncate">{m.name}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-border/60 text-zinc-400 font-mono uppercase">
                        {m.role}
                      </span>
                      {m.performanceGrade === 'EXCELLENT' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          TOP PERFORMER
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">{m.email}</p>
                  </div>
                </div>

                {/* Performance Metrics & Progress Bar */}
                <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto w-full sm:w-72">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">
                        {m.completedTasks} of {m.assignedTasks} finished
                      </span>
                      <span className="font-bold text-white">{m.completionRate}%</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          m.completionRate >= 80
                            ? 'bg-emerald-500'
                            : m.completionRate >= 50
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, m.completionRate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Done badge */}
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs shrink-0 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{m.completedTasks} Done</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project & Cycle Velocity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projects */}
        <div className="bg-[#12131d]/60 border border-border/60 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Project Completion Breakdown
            </h3>
          </div>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.projectId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">
                    {p.name} <span className="text-zinc-500 font-mono">({p.key})</span>
                  </span>
                  <span className="text-zinc-400 font-semibold">
                    {p.completedTasks}/{p.totalTasks} Done ({p.completionRate}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(100, p.completionRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cycles */}
        <div className="bg-[#12131d]/60 border border-border/60 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Sprint / Cycle Completion
            </h3>
          </div>
          <div className="space-y-3">
            {cycles.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">No active or past sprints in workspace</p>
            ) : (
              cycles.map((c) => (
                <div key={c.cycleId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                      {c.name}
                      <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/15 text-sky-300 font-mono">
                        {c.status}
                      </span>
                    </span>
                    <span className="text-zinc-400 font-semibold">
                      {c.completedTasks}/{c.totalTasks} Done ({c.completionRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${Math.min(100, c.completionRate)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Completed Tasks Feed */}
      {recentDoneTasks.length > 0 && (
        <div className="bg-[#12131d]/60 border border-border/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recently Finished Tasks
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {recentDoneTasks.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
                    {t.identifier}
                  </span>
                  <span className="text-zinc-200 truncate">{t.title}</span>
                  <span className="text-[10px] text-zinc-500 hidden sm:inline-block shrink-0">
                    • {t.projectName}
                  </span>
                </div>
                {t.assigneeName && (
                  <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
                    <UserAvatar
                      user={{
                        id: t.id,
                        name: t.assigneeName,
                        avatarUrl: t.assigneeAvatarUrl,
                      }}
                      size="xs"
                    />
                    <span className="text-[11px]">{t.assigneeName}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
