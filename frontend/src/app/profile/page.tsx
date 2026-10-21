'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { AuthScreen } from '../../components/auth/AuthScreen';
import { api } from '../../lib/api';
import { EunomiaLogo } from '../../components/ui/EunomiaLogo';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  X,
  Repeat,
  Building2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';

function ProfileContent() {
  const router = useRouter();
  const { user, workspace, workspaces, updateProfile, logout, loading, updateActiveWorkspace } =
    useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingCycles, setIsTogglingCycles] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Current workspace permissions
  const currentMember = workspace?.members?.find((m) => m.userId === user?.id);
  const userRole = currentMember?.role || workspace?.role;
  const canManageWorkspace = userRole === 'OWNER' || userRole === 'ADMIN';

  const handleToggleWorkspaceCycles = async () => {
    if (!workspace) return;
    if (!canManageWorkspace) {
      setStatusMessage({
        type: 'error',
        text: 'Only workspace owners and administrators can change feature settings.',
      });
      return;
    }

    const nextState = workspace.cyclesEnabled === false ? true : false;
    setIsTogglingCycles(true);

    try {
      const updated = await api.workspaces.update(workspace.id, {
        cyclesEnabled: nextState,
      });

      updateActiveWorkspace(updated);
      setStatusMessage({
        type: 'success',
        text: nextState
          ? 'Cycles feature enabled for active workspace.'
          : 'Cycles feature disabled for active workspace.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update workspace cycles feature.',
      });
    } finally {
      setIsTogglingCycles(false);
    }
  };

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Handle image upload from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP, or SVG)' });
      return;
    }

    setIsUploadingPhoto(true);
    setStatusMessage(null);

    try {
      const attachment = await api.uploads.upload(file);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const fullUrl = attachment.url.startsWith('http')
        ? attachment.url
        : `${apiBase}${attachment.url}`;
      setAvatarUrl(fullUrl);
      setStatusMessage({ type: 'success', text: 'Photo uploaded! Click "Save Changes" to apply.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload photo' });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Generate random avatar using DiceBear styles
  const handleRandomizeAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 9);
    const styles = ['bottts', 'adventurer', 'avataaars', 'fun-emoji', 'lorelei'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const generatedUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`;
    setAvatarUrl(generatedUrl);
    setStatusMessage({ type: 'success', text: 'New avatar generated! Click "Save Changes" to apply.' });
  };

  // Reset to default initials avatar
  const handleResetToInitials = () => {
    const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
    setAvatarUrl(initialsUrl);
    setStatusMessage({ type: 'success', text: 'Avatar reset to initials! Click "Save Changes" to apply.' });
  };

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setStatusMessage({ type: 'error', text: 'Please enter your current password to set a new one.' });
        return;
      }
      if (newPassword.length < 6) {
        setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl || undefined,
        email: email.trim().toLowerCase() !== user?.email ? email.trim().toLowerCase() : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-white">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const currentDisplayAvatar =
    avatarUrl ||
    user.avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;

  const hasChanges =
    name !== (user.name || '') ||
    email !== (user.email || '') ||
    avatarUrl !== (user.avatarUrl || '') ||
    newPassword.length > 0;

  return (
    <div className="min-h-screen bg-[#090a0f] text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border/60 bg-[#0c0d14]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-border/60" />

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <EunomiaLogo className="w-4 h-4" />
              <span className="font-semibold text-zinc-200">Eunomia</span>
            </div>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">Settings</span>
            <span className="text-zinc-600">/</span>
            <span className="text-white font-medium">My Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-destructive px-2.5 py-1.5 rounded-md hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-10 px-4 sm:px-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UserIcon className="w-6 h-6 text-primary" />
            <span>Profile Settings</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Manage your personal profile, customize your avatar, and update your login credentials.
          </p>
        </div>

        {/* Status Toast / Alert Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 animate-in fade-in-50 duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-4 h-4 shrink-0 text-destructive" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-zinc-400 hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Avatar / Profile Picture */}
          <div className="p-6 rounded-xl border border-border/70 bg-[#10111a]/80 backdrop-blur-sm space-y-6 shadow-xl">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase text-zinc-400">
                Profile Photo
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                This image represents you across Eunomia in issue assignees, comment mentions, and team lists.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <img
                  src={currentDisplayAvatar}
                  alt={name || 'User'}
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-primary/40 shadow-[0_0_20px_rgba(94,106,210,0.25)] bg-[#181926]"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Upload image"
                >
                  <Camera className="w-6 h-6 mb-1 text-primary" />
                  <span className="text-[10px] font-medium">Change</span>
                </button>
              </div>

              {/* Actions & Buttons */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="h-8 text-xs font-medium border-border/80 bg-[#161724] hover:bg-secondary text-zinc-200 hover:text-white"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-primary" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-primary" />
                        Upload Custom Photo
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRandomizeAvatar}
                    className="h-8 text-xs font-medium border-border/80 bg-[#161724] hover:bg-secondary text-zinc-200 hover:text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                    Randomize Avatar
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToInitials}
                    className="h-8 text-xs text-zinc-400 hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                    Reset to Initials
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="h-8 text-xs text-zinc-400 hover:text-white"
                  >
                    <LinkIcon className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                    Custom URL
                  </Button>
                </div>

                {/* Optional Custom Image URL Input */}
                {showUrlInput && (
                  <div className="pt-2 animate-in fade-in-0 duration-150">
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="flex-1 bg-[#151622] border border-border/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary placeholder:text-zinc-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(false)}
                        className="text-xs text-zinc-400 hover:text-white px-2 py-1"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-zinc-500">
                  Recommended: Square JPG, PNG, or SVG under 10MB.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Personal Information */}
          <div className="p-6 rounded-xl border border-border/70 bg-[#10111a]/80 backdrop-blur-sm space-y-6 shadow-xl">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase text-zinc-400">
                Personal Information
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Update your display name and login email address.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Shown in task comments & logs</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#151622] border border-border/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 uppercase">
                    Badge: <strong className="text-white">{name.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'}</strong>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-zinc-500 font-normal">For notifications & login</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#151622] border border-border/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors font-mono"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Security & Password */}
          <div className="p-6 rounded-xl border border-border/70 bg-[#10111a]/80 backdrop-blur-sm space-y-6 shadow-xl">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase text-zinc-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Security & Password</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Leave these fields blank if you do not wish to change your password.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#151622] border border-border/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>New Password</span>
                  <span className="text-[10px] text-zinc-500">Minimum 6 characters</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full bg-[#151622] border border-border/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              {newPassword && (
                <div className="space-y-1.5 animate-in fade-in-0 duration-150">
                  <label className="text-xs font-semibold text-zinc-300">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full bg-[#151622] border rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-destructive focus:border-destructive'
                        : 'border-border/80 focus:border-primary'
                    }`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[10px] text-destructive">Passwords do not match.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Workspaces & Membership Info */}
          <div className="p-6 rounded-xl border border-border/70 bg-[#10111a]/80 backdrop-blur-sm space-y-4 shadow-xl">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase text-zinc-400">
                Workspace Memberships
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Teams and organizations you currently collaborate with.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
                    ws.id === workspace?.id
                      ? 'bg-primary/10 border-primary/40 text-white'
                      : 'bg-[#151622]/60 border-border/60 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1f2130] to-[#2c2f45] border border-border flex items-center justify-center font-bold text-xs text-white shrink-0">
                      {ws.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-white">{ws.name}</p>
                      <p className="text-[10px] font-mono text-zinc-500 truncate">{ws.slug}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 border border-border text-zinc-300 shrink-0">
                    {ws.id === workspace?.id ? 'Active' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Active Workspace Features & Cycles Toggle */}
          {workspace && (
            <div className="p-6 rounded-xl border border-border/70 bg-[#10111a]/80 backdrop-blur-sm space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide uppercase text-zinc-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>Active Workspace: {workspace.name}</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure feature toggles and workflow modules for this workspace.
                  </p>
                </div>

                <span className="text-[10px] font-mono text-zinc-500 bg-[#151622] px-2.5 py-1 rounded-md border border-border">
                  {canManageWorkspace ? 'Admin / Owner' : 'Member (Read-only)'}
                </span>
              </div>

              <div className="pt-2">
                <div
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    workspace.cyclesEnabled !== false
                      ? 'bg-[#151622]/80 border-primary/30'
                      : 'bg-[#12131d]/60 border-border/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          workspace.cyclesEnabled !== false
                            ? 'bg-primary/20 border border-primary/40 text-primary'
                            : 'bg-zinc-800/60 border border-zinc-700 text-zinc-500'
                        }`}
                      >
                        <Repeat className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">Cycles Feature</span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${
                              workspace.cyclesEnabled !== false
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            {workspace.cyclesEnabled !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Allow team members to organize and track issues into timeboxed sprints and cycles.
                          Toggle off to hide cycles navigation, views, and issue assignments.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={workspace.cyclesEnabled !== false}
                      disabled={!canManageWorkspace || isTogglingCycles}
                      onClick={handleToggleWorkspaceCycles}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                        workspace.cyclesEnabled !== false ? 'bg-primary' : 'bg-zinc-700'
                      }`}
                    >
                      <span className="sr-only">Toggle Cycles</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                          workspace.cyclesEnabled !== false ? 'translate-x-5' : 'translate-x-0'
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
          )}

          {/* Bottom Sticky Action Bar */}
          <div className="sticky bottom-6 p-4 rounded-xl border border-border/80 bg-[#12131e]/95 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 z-30">
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              {hasChanges ? (
                <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  You have unsaved changes
                </span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Profile up to date
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (user) {
                    setName(user.name || '');
                    setEmail(user.email || '');
                    setAvatarUrl(user.avatarUrl || '');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setStatusMessage(null);
                  }
                }}
                disabled={!hasChanges || isSaving}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Reset
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={!hasChanges || isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 shadow-[0_0_15px_rgba(94,106,210,0.4)]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}
