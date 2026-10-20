'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkspaceMember } from '../../types';
import { api } from '../../lib/api';
import { X, UserPlus, Mail, User, Shield, Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onMemberInvited: (member?: any) => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  workspaceId,
  onMemberInvited,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const member = await api.workspaces.inviteMember(workspaceId, {
        email: email.trim(),
        name: name.trim() || undefined,
        role,
      });

      onMemberInvited(member);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setEmail('');
        setName('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to invite team member');
    } finally {
      setLoading(false);
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
          className="relative w-full max-w-md rounded-xl border border-border bg-[#0e1017] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/70 bg-[#12131d]/80">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Invite Team Member
              </span>
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
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {success ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-white">Invitation sent!</h4>
                <p className="text-xs text-muted-foreground">
                  An invitation has been sent via email & inbox. The recipient must accept to join your workspace.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Only Admins & Owners can invite members. An invitation link will be delivered directly to their email and Eunomia inbox to accept.
                </p>

                {error && (
                  <div className="p-2.5 rounded bg-destructive/15 border border-destructive/30 text-destructive text-xs">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Email Address</span>
                  </label>
                  <Input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="bg-[#141520] border-border text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Full Name (Optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="bg-[#141520] border-border text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Role</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-[#141520] border border-border text-xs rounded px-2.5 py-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="MEMBER">Member (Can create, edit, and comment on tasks)</option>
                    <option value="ADMIN">Admin (Can manage workspace settings)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="linear"
                    disabled={!email.trim() || loading}
                    className="text-xs h-8 px-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Inviting...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
