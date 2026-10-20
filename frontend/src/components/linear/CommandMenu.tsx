'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Task } from '../../types';
import { Search, Plus, LayoutGrid, List, SlidersHorizontal, LogOut, CheckCircle2 } from 'lucide-react';
import { PriorityIcon } from './PriorityIcon';
import { StatusIcon } from './StatusIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: () => void;
  onChangeView: (view: 'board-priority' | 'board-status' | 'list') => void;
  onLogout: () => void;
}

export function CommandMenu({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onOpenCreateTask,
  onChangeView,
  onLogout,
}: CommandMenuProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg rounded-xl border border-border bg-[#11121b] shadow-2xl overflow-hidden"
        >
          <Command className="w-full bg-transparent text-foreground">
            <div className="flex items-center px-3 border-b border-border/60">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <Command.Input
                placeholder="Type a command or search issues..."
                className="w-full bg-transparent py-3 text-sm focus:outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
              <Command.Empty className="py-6 text-center text-muted-foreground">
                No matching results found.
              </Command.Empty>

              <Command.Group heading="Actions" className="text-zinc-500 font-semibold px-2 py-1 uppercase text-[10px] tracking-wider">
                <Command.Item
                  onSelect={() => {
                    onOpenCreateTask();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer text-foreground aria-selected:bg-secondary"
                >
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Create new issue</span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">C</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    onChangeView('board-priority');
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer text-foreground aria-selected:bg-secondary"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Switch to Priority Board</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    onChangeView('board-status');
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer text-foreground aria-selected:bg-secondary"
                >
                  <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  <span>Switch to Status Board</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    onChangeView('list');
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer text-foreground aria-selected:bg-secondary"
                >
                  <List className="w-4 h-4 text-emerald-400" />
                  <span>Switch to List View</span>
                </Command.Item>
              </Command.Group>

              {tasks.length > 0 && (
                <Command.Group heading="Issues" className="text-zinc-500 font-semibold px-2 py-1 uppercase text-[10px] tracking-wider mt-2">
                  {tasks.slice(0, 15).map((t) => (
                    <Command.Item
                      key={t.id}
                      onSelect={() => {
                        onSelectTask(t);
                        onClose();
                      }}
                      className="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-secondary cursor-pointer text-foreground aria-selected:bg-secondary"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIcon status={t.status} />
                        <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                          {t.identifier}
                        </span>
                        <span className="truncate">{t.title}</span>
                      </div>
                      <PriorityIcon priority={t.priority} />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Account" className="text-zinc-500 font-semibold px-2 py-1 uppercase text-[10px] tracking-wider mt-2">
                <Command.Item
                  onSelect={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-destructive/20 text-destructive cursor-pointer aria-selected:bg-destructive/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
