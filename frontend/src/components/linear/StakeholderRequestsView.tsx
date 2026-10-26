'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Workspace, User } from '../../types';
import { api } from '../../lib/api';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Search,
  Filter,
  Loader2,
  ArrowRight,
  Send,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CreateIntakeModal } from './CreateIntakeModal';
import { UserAvatar } from '../ui/UserAvatar';

interface StakeholderRequestsViewProps {
  workspace: Workspace;
  currentUser: User | null;
  onOpenTaskDetail?: (task: Task) => void;
}

export function StakeholderRequestsView({
  workspace,
  currentUser,
  onOpenTaskDetail,
}: StakeholderRequestsViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'REJECTED'>('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch all tasks including pending triage
      const data = await api.tasks.getAll({
        workspaceId: workspace.id,
        includePendingTriage: true,
      });
      // Filter for cross-division requests (has requesterDivisionId or triageStatus)
      const divisionRequests = data.filter(
        (t) => t.requesterDivisionId || t.triageStatus === 'INBOX_PENDING' || t.triageStatus === 'REJECTED',
      );
      setTasks(divisionRequests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [workspace.id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (divisionFilter !== 'ALL' && t.requesterDivisionId !== divisionFilter) {
        return false;
      }
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING' && t.triageStatus !== 'INBOX_PENDING') return false;
        if (statusFilter === 'REJECTED' && t.triageStatus !== 'REJECTED') return false;
        if (statusFilter === 'BACKLOG' && (t.triageStatus === 'INBOX_PENDING' || t.status !== 'BACKLOG' || t.triageStatus === 'REJECTED')) return false;
        if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
        if (statusFilter === 'DONE' && t.status !== 'DONE') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const divMatch = (t.requesterDivision?.name || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !divMatch) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, divisionFilter, searchQuery]);

  const getPipelineStage = (task: Task) => {
    if (task.triageStatus === 'REJECTED') {
      return { step: 0, label: 'Needs Revision', color: 'rose' };
    }
    if (task.triageStatus === 'INBOX_PENDING') {
      return { step: 1, label: 'Pending Review', color: 'amber' };
    }
    if (task.status === 'DONE') {
      return { step: 4, label: 'Completed', color: 'emerald' };
    }
    if (task.status === 'IN_PROGRESS') {
      return { step: 3, label: 'In Progress', color: 'indigo' };
    }
    return { step: 2, label: 'In Backlog', color: 'blue' };
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0e15] p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202234]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Division Requests & Roadmap</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              High-Level Tracker
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Track the status of your division's requests from initial triage review to completion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="linear"
            onClick={() => setIsIntakeModalOpen(true)}
            className="text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Request</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'ALL', label: 'All Requests' },
              { id: 'PENDING', label: 'Pending Review' },
              { id: 'BACKLOG', label: 'In Backlog' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'DONE', label: 'Completed' },
              { id: 'REJECTED', label: 'Needs Revision' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === item.id
                  ? 'bg-[#222438] text-white border border-indigo-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161726]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Division & Search */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-[#141524] border-border w-48 text-zinc-200"
            />
          </div>

          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="h-8 bg-[#141524] border border-border text-xs rounded-lg px-2.5 text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Divisions</option>
            {workspace.divisions?.map((div) => (
              <option key={div.id} value={div.id}>
                {div.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs">Loading division requests...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-[#202234] bg-[#11121d]/50 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Requests Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Your department has not submitted any backlog requests yet. Click the button below to submit your first request to the Product & Engineering team.
          </p>
          <Button
            type="button"
            variant="linear"
            onClick={() => setIsIntakeModalOpen(true)}
            className="text-xs h-8 px-4 mt-2"
          >
            Submit New Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const pipeline = getPipelineStage(task);
            const urgency = task.externalMetadata?.urgency || 'MEDIUM';

            return (
              <div
                key={task.id}
                className="rounded-xl border border-[#222438] bg-[#131422] p-5 shadow-lg space-y-4 hover:border-[#383a54] transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {task.identifier}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded">
                        <Building2 className="w-3 h-3" />
                        <span>{task.requesterDivision?.name || 'My Division'}</span>
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                          urgency === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : urgency === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {urgency} Priority
                      </span>
                    </div>

                    <h2
                      onClick={() => onOpenTaskDetail?.(task)}
                      className="text-base font-semibold text-white hover:text-indigo-300 cursor-pointer transition-colors pt-0.5"
                    >
                      {task.title}
                    </h2>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenTaskDetail?.(task)}
                    className="text-xs h-8 text-zinc-300 hover:text-white hover:bg-zinc-800 self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Discuss ({task.comments?.length || 0})</span>
                  </Button>
                </div>

                {/* High-Level Pipeline Stepper */}
                <div className="p-3.5 rounded-xl bg-[#0d0e17] border border-[#1b1c2b]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-zinc-400">Roadmap Progress:</span>
                    <span
                      className={`text-xs font-bold ${
                        pipeline.color === 'emerald'
                          ? 'text-emerald-400'
                          : pipeline.color === 'indigo'
                          ? 'text-indigo-400'
                          : pipeline.color === 'rose'
                          ? 'text-rose-400'
                          : pipeline.color === 'amber'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {pipeline.label}
                    </span>
                  </div>

                  {/* Visual Stepper */}
                  {task.triageStatus === 'REJECTED' ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>Revisions requested. Chat with the engineering team directly on this ticket to resolve without creating a new request.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenTaskDetail?.(task)}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] shrink-0 self-start sm:self-auto transition-colors cursor-pointer"
                      >
                        Chat & Revise
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {[
                        { step: 1, title: '1. Review' },
                        { step: 2, title: '2. Backlog' },
                        { step: 3, title: '3. In Progress' },
                        { step: 4, title: '4. Done' },
                      ].map((s) => (
                        <div key={s.step} className="space-y-1.5">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              pipeline.step >= s.step
                                ? s.step === 4
                                  ? 'bg-emerald-500'
                                  : s.step === 3
                                  ? 'bg-indigo-500'
                                  : 'bg-blue-500'
                                : 'bg-zinc-800'
                            }`}
                          />
                          <div
                            className={`text-[10px] text-center font-medium ${
                              pipeline.step >= s.step ? 'text-zinc-200' : 'text-zinc-600'
                            }`}
                          >
                            {s.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata & Details */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 pt-1">
                  <div className="flex flex-wrap items-center gap-4">
                    {task.externalMetadata?.targetDeadline && (
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deadline: {new Date(task.externalMetadata.targetDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                    )}
                    {task.externalMetadata?.assetLinks && (
                      <a
                        href={Array.isArray(task.externalMetadata.assetLinks) ? task.externalMetadata.assetLinks[0] : String(task.externalMetadata.assetLinks)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Attachments</span>
                      </a>
                    )}
                  </div>

                  <span className="text-[11px] text-zinc-500">
                    Created {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Intake Modal */}
      <CreateIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        workspace={workspace}
        onRequestCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
        }}
      />
    </div>
  );
}
