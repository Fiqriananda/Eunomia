'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, TaskPriority, TaskStatus, WorkspaceMember, Attachment, WorkflowSection, Cycle } from '../../types';
import { PriorityIcon, PRIORITY_CONFIG } from './PriorityIcon';
import { StatusIcon, STATUS_CONFIG } from './StatusIcon';
import { FileUploader } from './FileUploader';
import { X, Sparkles, Loader2, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import { LinearRichEditor } from './LinearRichEditor';
import { useAuth } from '../../context/AuthContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description?: string;
    projectId: string;
    status: TaskStatus;
    customStatus?: string | null;
    priority: TaskPriority;
    assigneeId?: string;
    labels?: string[];
    parentId?: string | null;
    cycleId?: string | null;
    estimate?: number;
  }) => Promise<void>;
  projects: Project[];
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
  defaultPriority?: TaskPriority;
  defaultParentId?: string | null;
  defaultCycleId?: string | null;
  members?: WorkspaceMember[];
  sections?: WorkflowSection[];
  cycles?: Cycle[];
}

const PRIORITIES: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

export function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  projects,
  defaultProjectId,
  defaultStatus = 'TODO',
  defaultPriority = 'NO_PRIORITY',
  defaultParentId = null,
  defaultCycleId = null,
  members = [],
  sections = [],
  cycles = [],
}: CreateTaskModalProps) {
  const { workspace } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || (projects[0]?.id ?? ''));
  const [statusValue, setStatusValue] = useState<string>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [cycleId, setCycleId] = useState<string>(defaultCycleId || '');
  const [estimate, setEstimate] = useState<number>(1);
  const [labelsInput, setLabelsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
    if (defaultStatus) setStatusValue(defaultStatus);
    if (defaultPriority) setPriority(defaultPriority);
  }, [defaultProjectId, defaultStatus, defaultPriority]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setSubmitting(true);
    try {
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      let finalStatus: TaskStatus = 'TODO';
      let finalCustomStatus: string | null = null;

      if (statusValue.startsWith('custom:')) {
        const secKey = statusValue.replace('custom:', '');
        const sec = sections.find((s) => s.key === secKey);
        finalStatus = sec?.category || 'IN_PROGRESS';
        finalCustomStatus = secKey;
      } else {
        finalStatus = statusValue as TaskStatus;
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        status: finalStatus,
        customStatus: finalCustomStatus,
        priority,
        assigneeId: assigneeId || undefined,
        labels,
        parentId: defaultParentId || null,
        cycleId: cycleId || null,
        estimate: Number(estimate) || 1,
      });

      setTitle('');
      setDescription('');
      setLabelsInput('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const currentProject = projects.find((p) => p.id === projectId) || projects[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-xl border border-border bg-[#0e1017] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-border/70 bg-[#12131d]/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Issue
              </span>
              {currentProject && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-zinc-700/60 font-semibold">
                  {currentProject.key}-# (Auto)
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="iconSm"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <Input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
                className="text-base font-medium h-10 bg-[#141520] border-border/80 focus:border-primary"
                required
              />
            </div>

            <div>
              <LinearRichEditor
                value={description}
                onChange={setDescription}
                placeholder="Add description, requirements, code ```, or checklist [ ]..."
                members={members}
              />
            </div>

            {/* Selectors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-border/40 text-xs">
              {/* Project */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Project</span>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-[#1b1d2c] border border-border text-foreground rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Status</span>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  className="w-full bg-[#1b1d2c] border border-border text-foreground rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <optgroup label="Standard Statuses">
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </optgroup>
                  {sections.length > 0 && (
                    <optgroup label="Custom Sections">
                      {sections.map((sec) => (
                        <option key={sec.id} value={`custom:${sec.key}`}>
                          {sec.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Priority</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-[#1b1d2c] border border-border text-foreground rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_CONFIG[p].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Assignee</span>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-[#1b1d2c] border border-border text-foreground rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cycle / Sprint */}
              {workspace?.cyclesEnabled !== false && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Cycle (Sprint)</span>
                  <select
                    value={cycleId}
                    onChange={(e) => setCycleId(e.target.value)}
                    className="w-full bg-[#1b1d2c] border border-border text-foreground rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">No Cycle</option>
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.status === 'ACTIVE' ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Story Points Estimate */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Estimate (Points)</span>
                <select
                  value={estimate}
                  onChange={(e) => setEstimate(Number(e.target.value))}
                  className="w-full bg-[#1b1d2c] border border-border text-foreground rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="1">1 pt (Small)</option>
                  <option value="2">2 pts</option>
                  <option value="3">3 pts (Medium)</option>
                  <option value="5">5 pts (Large)</option>
                  <option value="8">8 pts (XL)</option>
                  <option value="13">13 pts (Epic)</option>
                </select>
              </div>
            </div>

            {/* Labels Input */}
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Labels (comma-separated)</span>
              <Input
                type="text"
                value={labelsInput}
                onChange={(e) => setLabelsInput(e.target.value)}
                placeholder="e.g. Bug, Frontend, High Priority"
                className="bg-[#141520] border-border/80 text-xs h-8"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40 shrink-0 sticky bottom-0 bg-[#0e1017]">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="linear"
                disabled={!title.trim() || submitting}
                className="px-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Creating...
                  </>
                ) : (
                  'Create Issue'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
