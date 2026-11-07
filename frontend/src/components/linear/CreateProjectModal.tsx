'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderKanban, Calendar, User, Tag, Palette, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Project } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  initialData?: Project | null;
}

const COLOR_OPTIONS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Blue', hex: '#3b82f6' },
];

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'CANCELED', label: 'Canceled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CreateProjectModalProps) {
  const { workspace, user } = useAuth();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [targetDate, setTargetDate] = useState('');
  const [leadId, setLeadId] = useState('');

  const [isManualKey, setIsManualKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when editing or opening
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setKey(initialData.key || '');
      setDescription(initialData.description || '');
      setColor(initialData.color || '#6366f1');
      setStatus(initialData.status || 'IN_PROGRESS');
      setTargetDate(initialData.targetDate ? initialData.targetDate.split('T')[0] : '');
      setLeadId(initialData.leadId || '');
      setIsManualKey(true);
    } else {
      setName('');
      setKey('');
      setDescription('');
      setColor('#6366f1');
      setStatus('IN_PROGRESS');
      setTargetDate('');
      setLeadId(user?.id || '');
      setIsManualKey(false);
    }
    setErrorMessage(null);
  }, [initialData, isOpen, user]);

  // Auto-generate key from name if not manually modified
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isManualKey && !initialData) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      let generatedKey = '';
      if (words.length >= 2) {
        generatedKey = words.map((w) => w[0]).join('').substring(0, 4).toUpperCase();
      } else if (val.length > 0) {
        generatedKey = val.substring(0, 3).toUpperCase();
      }
      setKey(generatedKey.replace(/[^A-Z0-9]/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (initialData) {
        const updated = await api.projects.update(initialData.id, {
          name: trimmedName,
          key: key.trim().toUpperCase() || undefined,
          description: description.trim() || undefined,
          color,
          status,
          targetDate: targetDate || null,
          leadId: leadId || null,
        });
        onSuccess(updated);
      } else {
        const created = await api.projects.create({
          workspaceId: workspace.id,
          name: trimmedName,
          key: key.trim().toUpperCase() || undefined,
          description: description.trim() || undefined,
          color,
          status,
          targetDate: targetDate || undefined,
          leadId: leadId || undefined,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setErrorMessage(err.message || 'Failed to save project. Please check if key is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg bg-[#10111a] border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-10 text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-[#141522]/50">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm"
                style={{ backgroundColor: `${color}15`, borderColor: `${color}40`, color }}
              >
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {initialData ? 'Edit Project (Epic)' : 'New Project (Epic)'}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Large initiative container grouping individual tasks & cycles
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. PDF Schedule Uploader"
                className="w-full bg-[#141520] border border-border/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>

            {/* Key / Prefix and Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Project Code / Identifier */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Epic Code / Short Key</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Workspace: {workspace?.ticketPrefix || 'LAB'}-*
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      setIsManualKey(true);
                      setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    }}
                    placeholder="e.g. PDF"
                    maxLength={6}
                    className="w-full bg-[#141520] border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono font-medium text-white placeholder-zinc-500 uppercase focus:outline-none focus:border-primary transition-colors"
                  />
                  <Tag className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>


              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Project Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#141520] border border-border/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Description / Epic Overview
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the initiative goals, user value, and key requirements..."
                rows={3}
                className="w-full bg-[#141520] border border-border/80 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Lead and Target Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Project Lead */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Project Lead</span>
                </label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full bg-[#141520] border border-border/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {workspace?.members?.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Target Date</span>
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-[#141520] border border-border/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                />
              </div>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                <span>Color Accent</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {color === c.hex && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-secondary/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{initialData ? 'Update Epic' : 'Create Project'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
