'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { EunomiaLogo } from '../ui/EunomiaLogo';

export function AuthScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#090a0f] relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#5e6ad2]/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-border bg-[#0f1018]/90 backdrop-blur-xl p-8 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141522] border border-[#2a2d3d] shadow-[0_0_25px_rgba(255,180,93,0.25)] mb-2">
            <EunomiaLogo className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Eunomia
          </h1>
          <p className="text-xs text-muted-foreground">
            The issue tracker designed for high-performing engineering teams
          </p>
        </div>



        {error && (
          <div className="mb-4 p-2.5 rounded bg-destructive/15 border border-destructive/30 text-destructive text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Full Name</label>
              <Input
                type="text"
                placeholder="Alex Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-[#141520] border-border"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Email Address</label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#141520] border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#141520] border-border"
            />
          </div>

          <Button
            type="submit"
            variant="linear"
            className="w-full h-9 text-xs font-semibold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-muted-foreground hover:text-white transition-colors"
          >
            {isLogin ? (
              <>
                Don&apos;t have an account? <span className="text-[#8a95ff] font-medium">Sign up</span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-[#8a95ff] font-medium">Sign in</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
