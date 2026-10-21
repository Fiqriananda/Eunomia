'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  X,
  Settings,
  Repeat,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Save,
} from 'lucide-react';
import { Button } from '../ui/button';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceSettingsModal({ isOpen, onClose }: WorkspaceSettingsModalProps) {
  const { user, workspace, updateActiveWorkspace } = useAuth();

  const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isTogglingCycles, setIsTogglingCycles] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Sync workspace name when workspace changes
  React.useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
    }
  }, [workspace]);

  if (!isOpen || !workspace) return null;

  // Determine current user role
  const currentMember = workspace.members?.find((m) => m.userId === user?.id);
  const userRole = currentMember?.role || workspace.role;
  const canManage = userRole === 'OWNER' || userRole === 'ADMIN';

  const cyclesEnabled = workspace.cyclesEnabled !== false;

  const handleToggleCycles = async () => {
    if (!canManage) {
      setFeedback({
        type: 'error',
        message: 'Only workspace owners and administrators can modify feature settings.',
      });
      return;
    }

    const nextState = !cyclesEnabled;
    setIsTogglingCycles(true);
    setFeedback(null);

    try {
      const updated = await api.workspaces.update(workspace.id, {
        cyclesEnabled: nextState,
      });

      updateActiveWorkspace(updated);
      setFeedback({
        type: 'success',
        message: nextState
          ? 'Cycles feature has been enabled for this workspace.'
          : 'Cycles feature has been disabled for this workspace.',
      });
    } catch (err: any) {
      console.error('Failed to toggle cycles:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update workspace settings.',
      });
    } finally {
      setIsTogglingCycles(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setFeedback({
        type: 'error',
        message: 'Only workspace owners and administrators can modify workspace details.',
      });
      return;
    }

    if (!workspaceName.trim()) {
      setFeedback({ type: 'error', message: 'Workspace name cannot be empty.' });
      return;
    }

    setIsUpdatingName(true);
    setFeedback(null);

    try {
      const updated = await api.workspaces.update(workspace.id, {
        name: workspaceName.trim(),
      });

      updateActiveWorkspace(updated);
      setFeedback({
        type: 'success',
        message: 'Workspace name updated successfully.',
      });
    } catch (err: any) {
      console.error('Failed to update workspace name:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update workspace name.',
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

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
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 bg-[#141522]/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Workspace Settings</h3>
                <p className="text-[11px] text-zinc-400">
                  Manage configuration and features for{' '}
                  <span className="text-zinc-200 font-medium">{workspace.name}</span>
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

          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[78vh] overflow-y-auto">
            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                <button
                  onClick={() => setFeedback(null)}
                  className="p-1 hover:opacity-75 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Permission Notice if not Admin/Owner */}
            {!canManage && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  You are a Member of this workspace. Only Owners and Admins can modify settings.
                </span>
              </div>
            )}

            {/* Workspace General Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>General Information</span>
              </h4>

              <form onSubmit={handleSaveName} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Workspace Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      disabled={!canManage || isUpdatingName}
                      className="flex-1 bg-[#151622] border border-border/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary disabled:opacity-50 transition-colors"
                      placeholder="Workspace name"
                    />
                    {canManage && workspaceName !== workspace.name && (
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isUpdatingName}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-3 shrink-0"
                      >
                        {isUpdatingName ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5 mr-1" />
                        )}
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Workspace URL Identifier</label>
                  <div className="bg-[#151622]/50 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-zinc-400 select-all flex items-center justify-between">
                    <span>{workspace.slug}</span>
                    <span className="text-[10px] text-zinc-500">Read-only</span>
                  </div>
                </div>
              </form>
            </div>

            <div className="h-px bg-border/60" />

            {/* Feature Modules & Toggles */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Feature Modules
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Enable or disable specific features per workspace according to your team's workflow.
                </p>
              </div>

              {/* Cycles Feature Toggle Card */}
              <div
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  cyclesEnabled
                    ? 'bg-[#151622]/80 border-primary/30 shadow-[0_0_20px_rgba(94,106,210,0.06)]'
                    : 'bg-[#12131d]/60 border-border/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        cyclesEnabled
                          ? 'bg-primary/20 border border-primary/40 text-primary'
                          : 'bg-zinc-800/60 border border-zinc-700 text-zinc-500'
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Cycles</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${
                            cyclesEnabled
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {cyclesEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Plan, manage, and iterate work in recurring sprint cycles. When disabled, the
                        Cycles view and cycle selector across tasks and issues are completely hidden.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cyclesEnabled}
                    disabled={!canManage || isTogglingCycles}
                    onClick={handleToggleCycles}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                      cyclesEnabled ? 'bg-primary' : 'bg-zinc-700'
                    }`}
                  >
                    <span className="sr-only">Toggle Cycles</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        cyclesEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {isTogglingCycles && (
                        <Loader2 className="w-3 h-3 animate-spin text-zinc-700" />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-border/60 bg-[#141522]/40 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              Workspace ID: {workspace.id.substring(0, 8)}...
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-border/80 text-zinc-300 hover:text-white"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
