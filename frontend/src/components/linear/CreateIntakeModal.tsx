'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Division, Workspace, Task } from '../../types';
import { api } from '../../lib/api';
import {
  X,
  FileText,
  Calendar,
  Link2,
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Send,
  Target,
  Sparkles,
  Plus,
  ListFilter,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CreateIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onRequestCreated: (task: Task) => void;
  defaultDivisionId?: string;
}

export function CreateIntakeModal({
  isOpen,
  onClose,
  workspace,
  onRequestCreated,
  defaultDivisionId,
}: CreateIntakeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCustomDivision, setIsCustomDivision] = useState(false);
  const [requesterDivisionId, setRequesterDivisionId] = useState(defaultDivisionId || '');
  const [customDivisionName, setCustomDivisionName] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [assetLinks, setAssetLinks] = useState('');
  const [businessObjective, setBusinessObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const [divisions, setDivisions] = useState<Division[]>(workspace.divisions || []);
  const [loading, setLoading] = useState(false);
  const [fetchingDivisions, setFetchingDivisions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch divisions if empty
    if (!workspace.divisions || workspace.divisions.length === 0) {
      setFetchingDivisions(true);
      api.workspaces
        .getDivisions(workspace.id)
        .then((divs) => {
          setDivisions(divs);
          if (!requesterDivisionId && divs.length > 0) {
            const nonTech = divs.find((d) => !d.isTechnical);
            setRequesterDivisionId(nonTech ? nonTech.id : divs[0].id);
          }
        })
        .catch((err) => console.error('Failed to load divisions:', err))
        .finally(() => setFetchingDivisions(false));
    } else {
      setDivisions(workspace.divisions);
      if (!requesterDivisionId && workspace.divisions.length > 0) {
        const nonTech = workspace.divisions.find((d) => !d.isTechnical);
        setRequesterDivisionId(nonTech ? nonTech.id : workspace.divisions[0].id);
      }
    }
  }, [isOpen, workspace.id, workspace.divisions]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the request.');
      return;
    }

    if (isCustomDivision && !customDivisionName.trim()) {
      setError('Please enter your custom requesting division name.');
      return;
    }

    if (!isCustomDivision && !requesterDivisionId) {
      setError('Please select or specify your requesting division.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const task = await api.tasks.createIntake({
        workspaceId: workspace.id,
        title: title.trim(),
        requesterDivisionId: isCustomDivision ? undefined : requesterDivisionId,
        customDivisionName: isCustomDivision ? customDivisionName.trim() : undefined,
        description: description.trim(),
        urgency,
        targetDeadline: targetDeadline || undefined,
        assetLinks: assetLinks.trim() || undefined,
        businessObjective: businessObjective.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
      });

      setSuccess(true);
      onRequestCreated(task);

      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setDescription('');
        setCustomDivisionName('');
        setIsCustomDivision(false);
        setAssetLinks('');
        setBusinessObjective('');
        setTargetAudience('');
        setTargetDeadline('');
        onClose();
      }, 1300);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit intake request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0f1019] border border-[#232438] rounded-xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-[#141524]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Submit Intake Request</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Cross-Division
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Submit a backlog or project request from your division for review by the Product & Engineering team
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Request successfully submitted to the Product & Engineering triage inbox!</span>
              </div>
            )}

            {/* Row 1: Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <span>Request Title</span>
                <span className="text-red-400">*</span>
              </label>
              <Input
                autoFocus
                type="text"
                placeholder="e.g., Marketing Landing Page for Q4 Campaign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-[#141524] border-border text-sm h-10 placeholder:text-zinc-500"
              />
            </div>

            {/* Row 2: Division & Urgency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Requesting Division</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomDivision(!isCustomDivision)}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    {isCustomDivision ? (
                      <>
                        <ListFilter className="w-3 h-3" />
                        <span>Select Existing</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Custom Division</span>
                      </>
                    )}
                  </button>
                </div>

                {isCustomDivision ? (
                  <Input
                    type="text"
                    placeholder="e.g., Growth Marketing, Legal, Finance..."
                    value={customDivisionName}
                    onChange={(e) => setCustomDivisionName(e.target.value)}
                    required
                    className="bg-[#141524] border-indigo-500/40 focus:border-indigo-500 text-xs h-10 placeholder:text-zinc-500"
                  />
                ) : (
                  <select
                    value={requesterDivisionId}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomDivision(true);
                      } else {
                        setRequesterDivisionId(e.target.value);
                      }
                    }}
                    disabled={fetchingDivisions}
                    className="w-full bg-[#141524] border border-border text-xs rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer h-10"
                  >
                    {divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name} {div.isTechnical ? '(Tech Team)' : ''}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Custom Division (type your own)...</option>
                  </select>
                )}
                {isCustomDivision && (
                  <p className="text-[10px] text-zinc-400">
                    This division will be automatically linked and saved for your workspace.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Urgency Level</span>
                </label>
                <div className="grid grid-cols-3 gap-2 h-10">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        urgency === lvl
                          ? lvl === 'HIGH'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : lvl === 'MEDIUM'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-[#141524] border-border text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {lvl === 'HIGH' ? 'High' : lvl === 'MEDIUM' ? 'Medium' : 'Low'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Description & Deliverables */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                <span>Description & Expected Deliverables</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed context on what is required, background information, and expected deliverables..."
                rows={3}
                className="w-full bg-[#141524] border border-border focus:border-indigo-500 rounded-lg p-3 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Row 4: Target Deadline & Asset Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Target Deadline</span>
                </label>
                <Input
                  type="date"
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="bg-[#141524] border-border text-xs h-10 text-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Attachment Links (Figma / GDrive / Docs)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://figma.com/... or https://drive.google.com/..."
                  value={assetLinks}
                  onChange={(e) => setAssetLinks(e.target.value)}
                  className="bg-[#141524] border-border text-xs h-10 placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Row 5: Business Objective / Justification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Business Objective / Goal</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Acquire 500 new registered participants"
                  value={businessObjective}
                  onChange={(e) => setBusinessObjective(e.target.value)}
                  className="bg-[#141524] border-border text-xs h-10 placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <span>Target Audience</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Enterprise clients & developer community"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="bg-[#141524] border-border text-xs h-10 placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Info note */}
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
              This request will be routed to the Product & Engineering <strong>Triage Inbox</strong> for review.
              The lead will evaluate technical scope, assets, and estimation before approving it to the active backlog.
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="linear"
                disabled={!title.trim() || (!isCustomDivision && !requesterDivisionId) || (isCustomDivision && !customDivisionName.trim()) || loading || success}
                className="text-xs h-9 px-5 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
