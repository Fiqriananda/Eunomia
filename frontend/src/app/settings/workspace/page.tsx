'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import { AuthScreen } from '../../../components/auth/AuthScreen';
import { api } from '../../../lib/api';
import { Division } from '../../../types';
import { resolveMediaUrl } from '../../../components/ui/MarkdownRenderer';
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Repeat,
  Save,
  Trash2,
  Upload,
  Plus,
  Shield,
  Layers,
  Sparkles,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

function WorkspaceSettingsContent() {
  const router = useRouter();
  const { user, workspace, workspaces, updateActiveWorkspace, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workspaceName, setWorkspaceName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isTogglingCycles, setIsTogglingCycles] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Divisions State
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [showAddDivision, setShowAddDivision] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState('');
  const [newDivisionIsTechnical, setNewDivisionIsTechnical] = useState(false);
  const [isSubmittingDivision, setIsSubmittingDivision] = useState(false);
  const [deletingDivisionId, setDeletingDivisionId] = useState<string | null>(null);

  // Sync state with current workspace
  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
      setLogoUrl(workspace.logoUrl || null);
    }
  }, [workspace]);

  // Load divisions
  useEffect(() => {
    if (workspace) {
      setIsLoadingDivisions(true);
      api.workspaces
        .getDivisions(workspace.id)
        .then((data) => setDivisions(data))
        .catch((err) => console.error('Failed to load divisions:', err))
        .finally(() => setIsLoadingDivisions(false));
    }
  }, [workspace]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
        <span className="text-sm">Loading workspace settings...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center text-zinc-300 gap-4 p-4">
        <AlertCircle className="w-10 h-10 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">No active workspace found</h2>
        <p className="text-xs text-zinc-400">Please select or create a workspace first.</p>
        <Link href="/">
          <Button variant="linear" size="sm">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const currentMember = workspace.members?.find((m) => m.userId === user.id);
  const userRole = currentMember?.role || workspace.role;
  const canManage = userRole === 'OWNER' || userRole === 'ADMIN';
  const cyclesEnabled = workspace.cyclesEnabled !== false;

  // Handle Logo Upload
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canManage) {
      setFeedback({
        type: 'error',
        message: 'Only workspace owners and administrators can change the workspace logo.',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFeedback({
        type: 'error',
        message: 'Please upload an image file (PNG, JPG, SVG, WebP).',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'File size exceeds 5MB limit.',
      });
      return;
    }

    setIsUploadingLogo(true);
    setFeedback(null);

    try {
      const uploadRes = await api.uploads.upload(file);
      const newLogoUrl = uploadRes.url;

      const updated = await api.workspaces.update(workspace.id, {
        logoUrl: newLogoUrl,
      });

      setLogoUrl(newLogoUrl);
      updateActiveWorkspace(updated);
      setFeedback({
        type: 'success',
        message: 'Workspace logo updated successfully!',
      });
    } catch (err: any) {
      console.error('Failed to upload logo:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to upload workspace logo. Please try again.',
      });
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Handle Remove Logo
  const handleRemoveLogo = async () => {
    if (!canManage) return;

    setIsUploadingLogo(true);
    setFeedback(null);
    try {
      const updated = await api.workspaces.update(workspace.id, {
        logoUrl: null,
      });
      setLogoUrl(null);
      updateActiveWorkspace(updated);
      setFeedback({
        type: 'success',
        message: 'Workspace logo removed. Reverted to default initial icon.',
      });
    } catch (err: any) {
      console.error('Failed to remove logo:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to remove logo.',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Save Workspace Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const trimmed = workspaceName.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Workspace name cannot be empty.' });
      return;
    }

    setIsSavingName(true);
    setFeedback(null);
    try {
      const updated = await api.workspaces.update(workspace.id, {
        name: trimmed,
      });
      updateActiveWorkspace(updated);
      setFeedback({
        type: 'success',
        message: 'Workspace name updated successfully!',
      });
    } catch (err: any) {
      console.error('Failed to update workspace name:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update workspace name.',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Toggle Cycles
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
        message: err.message || 'Failed to update feature settings.',
      });
    } finally {
      setIsTogglingCycles(false);
    }
  };

  // Handle Create Division
  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const trimmed = newDivisionName.trim();
    if (!trimmed) return;

    setIsSubmittingDivision(true);
    setFeedback(null);

    try {
      const created = await api.workspaces.createDivision(workspace.id, {
        name: trimmed,
        isTechnical: newDivisionIsTechnical,
      });

      setDivisions((prev) => [...prev, created]);
      setNewDivisionName('');
      setNewDivisionIsTechnical(false);
      setShowAddDivision(false);
      setFeedback({
        type: 'success',
        message: `Division "${created.name}" created successfully.`,
      });
    } catch (err: any) {
      console.error('Failed to create division:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to create division.',
      });
    } finally {
      setIsSubmittingDivision(false);
    }
  };

  // Handle Delete Division
  const handleDeleteDivision = async (divisionId: string) => {
    if (!canManage) return;
    setDeletingDivisionId(divisionId);
    setFeedback(null);

    try {
      await api.workspaces.deleteDivision(workspace.id, divisionId);
      setDivisions((prev) => prev.filter((d) => d.id !== divisionId));
      setFeedback({
        type: 'success',
        message: 'Division deleted successfully.',
      });
    } catch (err: any) {
      console.error('Failed to delete division:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete division.',
      });
    } finally {
      setDeletingDivisionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-foreground flex flex-col font-sans select-text">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full h-12 flex items-center justify-between px-4 sm:px-8 border-b border-[#1f202b] bg-[#090a0f]/95 backdrop-blur-md select-none shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-[#1a1b26] text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Back to board"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Board</span>
          </Link>

          <span className="text-zinc-600">/</span>

          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img
                src={resolveMediaUrl(logoUrl)}
                alt={workspace.name}
                className="w-4 h-4 rounded object-cover shadow-sm"
              />
            ) : (
              <span className="w-4 h-4 rounded bg-[#5e6ad2] text-white flex items-center justify-center font-bold text-[9px]">
                {workspace.name?.[0] || 'W'}
              </span>
            )}
            <span className="text-xs text-zinc-300 font-medium truncate max-w-[150px]">
              {workspace.name}
            </span>
          </div>

          <span className="text-zinc-600">/</span>

          <span className="text-xs font-semibold text-white">
            Workspace Settings
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1a1b28] border border-[#2b2c3d] text-zinc-300 flex items-center gap-1">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span>{userRole}</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Banner Alert for Feedback */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-white p-0.5 rounded"
            >
              &times;
            </button>
          </div>
        )}

        {/* Permissions Warning for Non-Admins */}
        {!canManage && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              You are currently viewing workspace settings in read-only mode. Only workspace Owners and Administrators can modify branding, feature toggles, and divisions.
            </span>
          </div>
        )}

        {/* Section 1: Workspace Branding & Logo */}
        <section className="rounded-2xl bg-[#11121d] border border-[#202234] p-6 space-y-6 shadow-xl">
          <div className="border-b border-[#202234] pb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Workspace Logo & Branding</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Customize the logo and name displayed across the sidebar, navigation, and invitations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Logo Preview */}
            <div className="relative group shrink-0">
              {logoUrl ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#2e3048] bg-[#161726] shadow-md flex items-center justify-center relative">
                  <img
                    src={resolveMediaUrl(logoUrl)}
                    alt={workspace.name}
                    className="w-full h-full object-cover"
                  />
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#5e6ad2] text-white flex items-center justify-center font-bold text-3xl shadow-lg border border-indigo-400/30 relative">
                  {workspace.name?.[0] || 'W'}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              )}

              {canManage && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border border-[#11121d] transition-all cursor-pointer"
                  title="Upload new logo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Logo Actions & Help Text */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-white">Workspace Icon</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  Recommended size: 256x256 pixels. Supported formats: PNG, JPG, WebP, SVG (max 5MB).
                  This logo replaces the default initial badge in the sidebar and top navigation.
                </p>
              </div>

              {canManage && (
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="linear"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="text-xs h-8 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  </Button>

                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={isUploadingLogo}
                      className="text-xs h-8 px-3 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-[#2b2c3d] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Workspace Name Form */}
          <form onSubmit={handleSaveName} className="space-y-4 pt-4 border-t border-[#202234]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Workspace Name
              </label>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!canManage || isSavingName}
                  placeholder="e.g. Acme Studio"
                  className="flex-1 bg-[#161726] border border-[#282a40] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors disabled:opacity-60"
                />
                {canManage && (
                  <Button
                    type="submit"
                    variant="linear"
                    size="sm"
                    disabled={isSavingName || workspaceName.trim() === workspace.name}
                    className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
                  >
                    {isSavingName ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>Save Name</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-zinc-500">
              <span>Workspace ID: <code className="text-zinc-400 font-mono">{workspace.id}</code></span>
              <span>Slug: <code className="text-zinc-400 font-mono">{workspace.slug}</code></span>
            </div>
          </form>
        </section>

        {/* Section 2: Features & Modules */}
        <section className="rounded-2xl bg-[#11121d] border border-[#202234] p-6 space-y-6 shadow-xl">
          <div className="border-b border-[#202234] pb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-400" />
              <span>Features & Workflows</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Toggle sprint cycles and workflow modules for your team.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#151624] border border-[#232538]">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Cycles (Sprints)</span>
                {cyclesEnabled ? (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Enabled
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-lg">
                Group work into 2-week scheduled sprint cycles with automated burn-down charts, scope tracking, and progress metrics.
              </p>
            </div>

            {canManage && (
              <Button
                type="button"
                variant={cyclesEnabled ? 'destructive' : 'linear'}
                size="sm"
                onClick={handleToggleCycles}
                disabled={isTogglingCycles}
                className="text-xs h-8 px-4 self-start sm:self-auto cursor-pointer"
              >
                {isTogglingCycles ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                <span>{cyclesEnabled ? 'Disable Cycles' : 'Enable Cycles'}</span>
              </Button>
            )}
          </div>
        </section>

        {/* Section 3: Custom Requesting & Technical Divisions */}
        <section className="rounded-2xl bg-[#11121d] border border-[#202234] p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202234] pb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Custom Divisions & Departments</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configure requesting business units (Marketing, Sales, Legal, Operations) and engineering divisions.
              </p>
            </div>

            {canManage && (
              <Button
                type="button"
                variant="linear"
                size="sm"
                onClick={() => setShowAddDivision(!showAddDivision)}
                className="text-xs h-8 px-3 bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Division</span>
              </Button>
            )}
          </div>

          {/* Add Division Inline Form */}
          {showAddDivision && (
            <form
              onSubmit={handleCreateDivision}
              className="p-4 rounded-xl bg-[#151726] border border-purple-500/30 space-y-3"
            >
              <div className="text-xs font-semibold text-white">Create New Division</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Division name (e.g. Marketing, People Operations)"
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                  className="flex-1 bg-[#10111d] border border-[#2b2d44] focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                  autoFocus
                />
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newDivisionIsTechnical}
                    onChange={(e) => setNewDivisionIsTechnical(e.target.checked)}
                    className="rounded border-[#2b2d44] bg-[#10111d] text-purple-600 focus:ring-0"
                  />
                  <span>Technical Division</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDivision(false)}
                  className="h-7 text-xs px-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingDivision || !newDivisionName.trim()}
                  className="h-7 text-xs px-3 bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {isSubmittingDivision ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  <span>Create</span>
                </Button>
              </div>
            </form>
          )}

          {/* Divisions List */}
          {isLoadingDivisions ? (
            <div className="py-8 flex items-center justify-center text-zinc-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-xs">Loading divisions...</span>
            </div>
          ) : divisions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 italic rounded-xl border border-dashed border-[#202234]">
              No custom divisions added yet. Click &ldquo;Add Division&rdquo; to define requesting departments.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {divisions.map((div) => (
                <div
                  key={div.id}
                  className="p-3 rounded-xl bg-[#151624] border border-[#202234] flex items-center justify-between gap-3 group hover:border-[#30334c] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {div.name}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {div.isTechnical ? 'Technical Engineering Team' : 'Requesting Stakeholder Team'}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDivision(div.id)}
                      disabled={deletingDivisionId === div.id}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Delete division"
                    >
                      {deletingDivisionId === div.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4: Members Overview */}
        <section className="rounded-2xl bg-[#11121d] border border-[#202234] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Team Members</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                This workspace has {workspace.members?.length || 1} team member{((workspace.members?.length || 1) > 1) ? 's' : ''}.
              </p>
            </div>

            <Link href="/?tab=team">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-300 hover:text-white border border-[#232538]">
                <span>Manage Team</span>
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  return (
    <AuthProvider>
      <WorkspaceSettingsContent />
    </AuthProvider>
  );
}
