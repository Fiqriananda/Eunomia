'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { WorkspaceInvitation } from '../../../types';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import {
  Building2,
  Check,
  X,
  Shield,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  LogOut,
  Mail,
  Lock,
  User,
  KeyRound,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import Link from 'next/link';

function InvitationPageContent() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const { user, loading: authLoading, logout, refreshWorkspacesAndProjects } = useAuth();
  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Form state for unauthenticated users
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchInvitation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.invitations.getByToken(token);
        setInvitation(data);
        if (data.email) {
          const defaultName = data.email.split('@')[0];
          setFullName(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
        }
      } catch (err: any) {
        setError(err.message || 'Invitation not found or has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Handle acceptance when user is logged in
  const handleAcceptLoggedIn = async () => {
    if (!token) return;
    try {
      setActionLoading(true);
      setError(null);
      await api.invitations.accept(token);
      setAcceptedSuccess(true);
      await refreshWorkspacesAndProjects();
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
      setActionLoading(false);
    }
  };

  // Handle acceptance when user has no account or is not logged in
  const handleAcceptNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await api.invitations.acceptPublic(token, {
        name: fullName.trim() || undefined,
        password: password.trim(),
      });

      if (res.accessToken) {
        localStorage.setItem('linear_token', res.accessToken);
      }
      if (res.workspace?.id) {
        localStorage.setItem('linear_active_ws', res.workspace.id);
      }

      setAcceptedSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to set up account and accept invitation.');
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    try {
      setActionLoading(true);
      setError(null);
      await api.invitations.decline(token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation.');
      setActionLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4 text-zinc-300">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-medium text-zinc-400">Loading workspace invitation...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0f1019] border border-border/70 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Invitation Invalid or Expired</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            {error || 'This invitation link might have already been used, canceled by the workspace administrator, or has expired.'}
          </p>
          <Link href="/">
            <Button variant="outline" className="text-xs border-border/80 text-zinc-200">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  // Already accepted
  if (invitation.status === 'ACCEPTED' || acceptedSuccess) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0f1019] border border-emerald-500/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Welcome to {invitation.workspace?.name}!</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            You are now a member of the workspace. Redirecting you to your team board...
          </p>
          <Button
            onClick={() => (window.location.href = '/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs w-full flex items-center justify-center gap-2"
          >
            <span>Go to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Declined
  if (invitation.status === 'DECLINED') {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0f1019] border border-border/70 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Invitation Declined</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            You previously declined this invitation to join {invitation.workspace?.name}.
          </p>
          <Link href="/">
            <Button variant="outline" className="text-xs border-border/80 text-zinc-200">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEmailMatching = user ? user.email.toLowerCase() === invitation.email.toLowerCase() : false;

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0e0f18]/90 backdrop-blur-xl border border-border/70 rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.6)] overflow-hidden relative z-10">
        {/* Top Brand Banner */}
        <div className="px-7 pt-7 pb-5 border-b border-border/50 bg-gradient-to-b from-[#151726]/60 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-primary flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Eunomia</span>
              <p className="text-xs font-medium text-zinc-300">Workspace Invitation</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invitation</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-7 space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Join <span className="text-indigo-400">{invitation.workspace?.name}</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">{invitation.invitedBy?.name || 'A team manager'}</strong> invited you to collaborate on tasks as <span className="font-semibold text-indigo-300">{invitation.role}</span>.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invitation Details Summary Card */}
          <div className="bg-[#131522]/70 border border-border/60 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Workspace:</span>
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {invitation.workspace?.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Assigned Role:</span>
              <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-primary/15 text-primary-foreground border border-primary/30 flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" />
                {invitation.role}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Invited Email:</span>
              <span className="font-mono text-zinc-300 bg-[#090a0f] px-2 py-0.5 rounded border border-border/50 text-[11px]">
                {invitation.email}
              </span>
            </div>
          </div>

          {/* Flow 1: User does not have account or is not logged in */}
          {!user ? (
            <form onSubmit={handleAcceptNewAccount} className="space-y-4 pt-1">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Set your display name and password below to create your account and join <strong>{invitation.workspace?.name}</strong>.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Full Name</span>
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="bg-[#141520] border-border text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Password</span>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="bg-[#141520] border-border text-xs h-9"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 shadow-lg shadow-primary/25 flex items-center justify-center gap-2 mt-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting up your workspace...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Password & Accept Invitation</span>
                  </>
                )}
              </Button>
            </form>
          ) : !isEmailMatching ? (
            /* Flow 2: User is logged in, but with a different email */
            <div className="space-y-4 pt-1">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300 mb-0.5">Different Account Signed In</p>
                  <p className="text-zinc-400">
                    This invite was addressed to <strong className="text-zinc-200">{invitation.email}</strong>, but you are currently signed in as <strong className="text-zinc-200">{user.email}</strong>.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => logout()}
                className="w-full border-border/80 text-zinc-300 hover:text-white text-xs h-9 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out & Switch Account</span>
              </Button>
            </div>
          ) : (
            /* Flow 3: User is already logged in with matching email */
            <div className="space-y-3 pt-1">
              <Button
                onClick={handleAcceptLoggedIn}
                disabled={actionLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining Workspace...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Accept Invitation & Join</span>
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleDecline}
                disabled={actionLoading}
                className="w-full text-zinc-400 hover:text-zinc-200 text-xs h-9"
              >
                <span>Decline Invitation</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4 text-zinc-300">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-xs font-medium text-zinc-400">Loading workspace invitation...</p>
        </div>
      }
    >
      <AuthProvider>
        <InvitationPageContent />
      </AuthProvider>
    </Suspense>
  );
}
