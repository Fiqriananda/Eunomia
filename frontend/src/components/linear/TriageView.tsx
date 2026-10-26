'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Workspace, TaskPriority, TaskStatus, Cycle, User } from '../../types';
import { api } from '../../lib/api';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  ExternalLink,
  Target,
  Sparkles,
  Loader2,
  Check,
  Clock,
  ArrowRight,
  Filter,
  Search,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserAvatar } from '../ui/UserAvatar';

interface TriageViewProps {
  workspace: Workspace;
  currentUser: User | null;
  cycles?: Cycle[];
  onTaskTriaged?: (task: Task) => void;
  onOpenTaskDetail?: (task: Task) => void;
}

export function TriageView({
  workspace,
  currentUser,
  cycles = [],
  onTaskTriaged,
  onOpenTaskDetail,
}: TriageViewProps) {
  const [requests, setRequests] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('ALL');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState('ALL');

  // Approval modal state
  const [approvingTask, setApprovingTask] = useState<Task | null>(null);
  const [approvePriority, setApprovePriority] = useState<TaskPriority>('MEDIUM');
  const [approveEstimate, setApproveEstimate] = useState<number>(2);
  const [approveStatus, setApproveStatus] = useState<TaskStatus>('BACKLOG');
  const [approveCycleId, setApproveCycleId] = useState<string>('');
  const [approveComment, setApproveComment] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Reject modal state
  const [rejectingTask, setRejectingTask] = useState<Task | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const fetchTriage = async () => {
    setLoading(true);
    try {
      const data = await api.tasks.getTriageRequests(workspace.id);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load triage requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriage();
  }, [workspace.id]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (selectedDivisionFilter !== 'ALL' && r.requesterDivisionId !== selectedDivisionFilter) {
        return false;
      }
      if (selectedUrgencyFilter !== 'ALL' && r.externalMetadata?.urgency !== selectedUrgencyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = r.title.toLowerCase().includes(q);
        const descMatch = (r.description || '').toLowerCase().includes(q);
        const divMatch = (r.requesterDivision?.name || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !divMatch) return false;
      }
      return true;
    });
  }, [requests, selectedDivisionFilter, selectedUrgencyFilter, searchQuery]);

  const handleOpenApproveModal = (task: Task) => {
    setApprovingTask(task);
    setApprovePriority(task.priority || 'MEDIUM');
    setApproveEstimate(task.estimate || 2);
    setApproveStatus('BACKLOG');
    setApproveCycleId('');
    setApproveComment('');
  };

  const handleConfirmApproval = async () => {
    if (!approvingTask) return;
    setIsSubmittingApproval(true);
    try {
      const updated = await api.tasks.updateTriageStatus(approvingTask.id, {
        action: 'APPROVE',
        priority: approvePriority,
        estimate: approveEstimate,
        status: approveStatus,
        cycleId: approveCycleId || null,
        comment: approveComment.trim() || undefined,
      });

      setRequests((prev) => prev.filter((r) => r.id !== approvingTask.id));
      onTaskTriaged?.(updated);
      setApprovingTask(null);
    } catch (err) {
      console.error('Failed to approve request:', err);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingTask) return;
    setIsSubmittingReject(true);
    try {
      const updated = await api.tasks.updateTriageStatus(rejectingTask.id, {
        action: 'REJECT',
        comment: rejectComment.trim() || undefined,
      });

      setRequests((prev) => prev.filter((r) => r.id !== rejectingTask.id));
      onTaskTriaged?.(updated);
      setRejectingTask(null);
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0e15] p-6 lg:p-8 space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202234]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-400" />
              <span>Incoming Requests (Triage)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
              {requests.length} Pending
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Review cross-division intake requests, set estimates and priorities before adding them to the sprint backlog
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
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
            value={selectedDivisionFilter}
            onChange={(e) => setSelectedDivisionFilter(e.target.value)}
            className="h-8 bg-[#141524] border border-border text-xs rounded-lg px-2.5 text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Divisions</option>
            {workspace.divisions?.map((div) => (
              <option key={div.id} value={div.id}>
                {div.name}
              </option>
            ))}
          </select>

          <select
            value={selectedUrgencyFilter}
            onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
            className="h-8 bg-[#141524] border border-border text-xs rounded-lg px-2.5 text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Urgencies</option>
            <option value="HIGH">High Urgency</option>
            <option value="MEDIUM">Medium Urgency</option>
            <option value="LOW">Low Urgency</option>
          </select>
        </div>
      </div>

      {/* Main Request Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs">Loading incoming intake requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-[#202234] bg-[#11121d]/50 p-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Triage Inbox is Empty</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1">
            All incoming division requests have been triaged. No tickets are currently pending review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const urgency = req.externalMetadata?.urgency || 'MEDIUM';
            return (
              <div
                key={req.id}
                className="group relative rounded-xl border border-[#222438] bg-[#131422] hover:border-[#383a54] transition-all p-5 shadow-lg space-y-4"
              >
                {/* Request Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {req.identifier}
                      </span>

                      {/* Division Badge */}
                      <span className="flex items-center gap-1 text-[11px] font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded">
                        <Building2 className="w-3 h-3" />
                        <span>{req.requesterDivision?.name || 'External Division'}</span>
                      </span>

                      {/* Urgency Badge */}
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

                      {/* Submitted Date */}
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        <span>
                          Submitted {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </span>
                    </div>

                    <h2
                      onClick={() => onOpenTaskDetail?.(req)}
                      className="text-base font-semibold text-white group-hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      {req.title}
                    </h2>
                  </div>
                </div>

                {/* Description */}
                {req.description && (
                  <p className="text-xs text-zinc-300 leading-relaxed bg-[#0c0d16] p-3 rounded-lg border border-[#1b1c2b]">
                    {req.description}
                  </p>
                )}

                {/* External Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {req.externalMetadata?.targetDeadline && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#18192a] border border-[#26283d] text-xs">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-zinc-400">Target Deadline</div>
                        <div className="font-medium text-white">
                          {new Date(req.externalMetadata.targetDeadline).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {req.externalMetadata?.businessObjective && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#18192a] border border-[#26283d] text-xs">
                      <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-zinc-400">Business Objective</div>
                        <div className="font-medium text-white truncate" title={req.externalMetadata.businessObjective}>
                          {req.externalMetadata.businessObjective}
                        </div>
                      </div>
                    </div>
                  )}

                  {req.externalMetadata?.assetLinks && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#18192a] border border-[#26283d] text-xs">
                      <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-zinc-400">Attachments / Design Links</div>
                        <a
                          href={Array.isArray(req.externalMetadata.assetLinks) ? req.externalMetadata.assetLinks[0] : String(req.externalMetadata.assetLinks)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-emerald-300 hover:underline truncate block"
                        >
                          {Array.isArray(req.externalMetadata.assetLinks) ? req.externalMetadata.assetLinks.join(', ') : req.externalMetadata.assetLinks}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Requester & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#222438]">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={req.creator} size="xs" showStatus={false} />
                    <span className="text-xs text-zinc-400">
                      Submitted by <strong className="text-zinc-200">{req.creator?.name || 'Department Lead'}</strong>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenTaskDetail?.(req)}
                      className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 h-8 px-2.5 border border-border/40 flex items-center gap-1.5"
                      title="Open ticket to chat with requester"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Chat ({req.comments?.length || 0})</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRejectingTask(req);
                        setRejectComment('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-3 border border-rose-500/30"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Decline / Needs Revision</span>
                    </Button>

                    <Button
                      type="button"
                      variant="linear"
                      size="sm"
                      onClick={() => handleOpenApproveModal(req)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white h-8 px-3.5 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve to Backlog</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {approvingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#11121d] border border-[#2b2c42] rounded-xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Approve Request to Technical Backlog</span>
              </h3>
              <button
                onClick={() => setApprovingTask(null)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#18192a] border border-[#282a40] space-y-1">
              <div className="text-[10px] font-mono text-indigo-400">{approvingTask.identifier}</div>
              <div className="text-xs font-semibold text-white">{approvingTask.title}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Technical Priority</label>
                <select
                  value={approvePriority}
                  onChange={(e) => setApprovePriority(e.target.value as TaskPriority)}
                  className="w-full bg-[#18192a] border border-border text-xs rounded-lg px-2.5 py-2 text-foreground focus:outline-none"
                >
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="NO_PRIORITY">No Priority</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Story Points / Estimate</label>
                <Input
                  type="number"
                  min={1}
                  max={21}
                  value={approveEstimate}
                  onChange={(e) => setApproveEstimate(parseInt(e.target.value, 10) || 1)}
                  className="bg-[#18192a] border-border text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Destination Status</label>
                <select
                  value={approveStatus}
                  onChange={(e) => setApproveStatus(e.target.value as TaskStatus)}
                  className="w-full bg-[#18192a] border border-border text-xs rounded-lg px-2.5 py-2 text-foreground focus:outline-none"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do (Sprint Ready)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Assign to Cycle / Sprint</label>
                <select
                  value={approveCycleId}
                  onChange={(e) => setApproveCycleId(e.target.value)}
                  className="w-full bg-[#18192a] border border-border text-xs rounded-lg px-2.5 py-2 text-foreground focus:outline-none"
                >
                  <option value="">No Cycle (General Backlog)</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Feedback Note to Requester (Optional)</label>
              <textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="e.g., Approved, implementation scheduled for upcoming sprint cycle..."
                rows={2}
                className="w-full bg-[#18192a] border border-border focus:border-indigo-500 rounded-lg p-2.5 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={() => setApprovingTask(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="linear"
                onClick={handleConfirmApproval}
                disabled={isSubmittingApproval}
                className="text-xs h-9 px-4"
              >
                {isSubmittingApproval ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                <span>Confirm & Approve</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#11121d] border border-[#2b2c42] rounded-xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Decline or Request Revision</span>
              </h3>
              <button
                onClick={() => setRejectingTask(null)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#18192a] border border-[#282a40] space-y-1">
              <div className="text-[10px] font-mono text-zinc-400">{rejectingTask.identifier}</div>
              <div className="text-xs font-semibold text-white">{rejectingTask.title}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Decline Reason / Revision Notes</label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Explain missing assets, scope adjustments, or reason for revision..."
                rows={3}
                required
                className="w-full bg-[#18192a] border border-border focus:border-rose-500 rounded-lg p-2.5 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={() => setRejectingTask(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject}
                className="text-xs h-9 px-4"
              >
                {isSubmittingReject ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                <span>Send Decline Feedback</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
