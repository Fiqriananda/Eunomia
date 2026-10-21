'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskPriority, TaskStatus, WorkspaceMember, TaskComment, Project, TaskReaction } from '../../types';
import { PriorityIcon, PRIORITY_CONFIG } from './PriorityIcon';
import { StatusIcon, STATUS_CONFIG } from './StatusIcon';
import { FileUploader } from './FileUploader';
import {
  X,
  Trash2,
  Calendar,
  User as UserIcon,
  Tag,
  Check,
  Copy,
  Star,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  MessageSquare,
  Send,
  CornerDownLeft,
  FolderKanban,
  ExternalLink,
  Loader2,
  Share2,
  Plus,
  Search,
  GitBranch,
  AtSign,
  Edit3,
  Hash,
  GitFork,
  Link as LinkIcon,
  Image as ImageIcon,
  ArrowLeft,
  Pencil,
  Link2,
  Smile,
} from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { SubIssuesSection } from './SubIssuesSection';
import { RelatedIssuesSection } from './RelatedIssuesSection';
import { MarkdownRenderer, resolveMediaUrl } from '../ui/MarkdownRenderer';
import { LinearRichEditor } from './LinearRichEditor';
import { ReactionsBar } from './ReactionsBar';

const PRESET_LABEL_COLORS: Record<string, string> = {
  Bug: '#ef4444',
  Feature: '#a855f7',
  Improvement: '#3b82f6',
  Design: '#ec4899',
  Frontend: '#06b6d4',
  Backend: '#10b981',
  Critical: '#f97316',
  Performance: '#14b8a6',
  Research: '#8b5cf6',
  Storage: '#6366f1',
};

const getLabelColor = (name: string) => {
  if (PRESET_LABEL_COLORS[name]) return PRESET_LABEL_COLORS[name];
  const palette = ['#a855f7', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

const renderCommentContentWithMentions = (content: string, membersList: WorkspaceMember[]) => {
  return <MarkdownRenderer content={content} membersList={membersList} />;
};

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  members?: WorkspaceMember[];
  projects?: Project[];
  allTasks?: Task[];
  onNavigateTask?: (task: Task) => void;
}

const PRIORITIES: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  members = [],
  projects = [],
  allTasks = [],
  onNavigateTask,
}: TaskDetailModalProps) {
  const { user, workspace } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('NO_PRIORITY');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelSearch, setLabelSearch] = useState('');
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mention Tagging State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(0);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(-1);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Prefix Modal State
  const [showPrefixModal, setShowPrefixModal] = useState(false);
  const [newPrefix, setNewPrefix] = useState('');
  const [updatingPrefix, setUpdatingPrefix] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const labelsDropdownRef = useRef<HTMLDivElement>(null);
  const [descPreview, setDescPreview] = useState(false);
  const [isUploadingDescImage, setIsUploadingDescImage] = useState(false);
  const [isUploadingCommentImage, setIsUploadingCommentImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Socket context for live reaction updates
  const { socket } = useSocket();

  // Task reactions state
  const [taskReactions, setTaskReactions] = useState<TaskReaction[]>(task?.reactions || []);

  // Comment edit & copy link state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Edit Comment Mention Autocomplete state
  const editCommentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [editingMentionQuery, setEditingMentionQuery] = useState<string | null>(null);
  const [editingMentionIndex, setEditingMentionIndex] = useState(0);
  const [editingMentionCursorPos, setEditingMentionCursorPos] = useState(-1);

  // Deep-link anchor detection for #comment-...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#comment-')) {
        const commentId = hash.replace('#comment-', '');
        setHighlightedCommentId(commentId);
        setTimeout(() => {
          const el = document.getElementById(`comment-${commentId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
        const timer = setTimeout(() => {
          setHighlightedCommentId(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [task?.id, comments.length]);

  // Collect all unique labels ever used in this workspace plus standard preset labels
  const allWorkspaceLabels = useMemo(() => {
    const defaultLabels = [
      'Feature',
      'Bug',
      'Improvement',
      'Critical',
      'Design',
      'Frontend',
      'Backend',
      'Performance',
      'Research',
      'Storage',
    ];
    const set = new Set<string>(defaultLabels);
    allTasks.forEach((t) => {
      (t.labels || []).forEach((lbl) => set.add(lbl));
    });
    labels.forEach((lbl) => set.add(lbl));
    return Array.from(set);
  }, [allTasks, labels]);

  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return allWorkspaceLabels;
    const q = labelSearch.toLowerCase();
    return allWorkspaceLabels.filter((lbl) => lbl.toLowerCase().includes(q));
  }, [allWorkspaceLabels, labelSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        labelsDropdownRef.current &&
        !labelsDropdownRef.current.contains(e.target as Node)
      ) {
        setShowLabelsDropdown(false);
      }
    };
    if (showLabelsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLabelsDropdown]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId || null);
      setProjectId(task.projectId);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setLabels(task.labels || []);
      setComments(task.comments || []);
      setTaskReactions(task.reactions || []);
      setShowDeleteConfirm(false);
      setShowLabelsDropdown(false);
    }
  }, [task]);

  // Real-time reactions from WebSocket
  useEffect(() => {
    if (!socket || !task?.id) return;

    const handleTaskReactionToggled = (data: {
      taskId: string;
      emoji: string;
      userId: string;
      user?: any;
      action: 'added' | 'removed';
    }) => {
      if (data.taskId === task.id) {
        setTaskReactions((prev) => {
          if (data.action === 'added') {
            const exists = prev.some((r) => r.emoji === data.emoji && r.userId === data.userId);
            if (exists) return prev;
            return [
              ...prev,
              {
                id: `sock-${Date.now()}`,
                emoji: data.emoji,
                taskId: data.taskId,
                userId: data.userId,
                user: data.user,
                createdAt: new Date().toISOString(),
              },
            ];
          } else {
            return prev.filter((r) => !(r.emoji === data.emoji && r.userId === data.userId));
          }
        });
      }
    };

    const handleCommentReactionToggled = (data: {
      taskId: string;
      commentId: string;
      emoji: string;
      userId: string;
      user?: any;
      action: 'added' | 'removed';
    }) => {
      if (data.taskId === task.id) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== data.commentId) return c;
            const current = c.reactions || [];
            if (data.action === 'added') {
              const exists = current.some((r) => r.emoji === data.emoji && r.userId === data.userId);
              if (exists) return c;
              return {
                ...c,
                reactions: [
                  ...current,
                  {
                    id: `sock-${Date.now()}`,
                    emoji: data.emoji,
                    commentId: data.commentId,
                    userId: data.userId,
                    user: data.user,
                    createdAt: new Date().toISOString(),
                  },
                ],
              };
            } else {
              return {
                ...c,
                reactions: current.filter((r) => !(r.emoji === data.emoji && r.userId === data.userId)),
              };
            }
          }),
        );
      }
    };

    socket.on('task:reaction:toggled', handleTaskReactionToggled);
    socket.on('comment:reaction:toggled', handleCommentReactionToggled);

    return () => {
      socket.off('task:reaction:toggled', handleTaskReactionToggled);
      socket.off('comment:reaction:toggled', handleCommentReactionToggled);
    };
  }, [socket, task?.id]);

  if (!isOpen || !task) return null;

  // Calculate current task index among all tasks for 1 / N navigation
  const currentIndex = allTasks.findIndex((t) => t.id === task.id);
  const totalTasks = allTasks.length;

  const handlePrevTask = () => {
    if (currentIndex > 0 && onNavigateTask) {
      onNavigateTask(allTasks[currentIndex - 1]);
    }
  };

  const handleNextTask = () => {
    if (currentIndex < totalTasks - 1 && onNavigateTask) {
      onNavigateTask(allTasks[currentIndex + 1]);
    }
  };

  // Instant inline title change & blur
  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      onUpdate(task.id, { title: title.trim() });
    }
  };

  // Instant inline description blur
  const handleDescBlur = () => {
    if (description !== (task.description || '')) {
      onUpdate(task.id, { description });
    }
  };

  const handleUploadImageFile = async (
    file: File,
    textarea: HTMLTextAreaElement | null,
    currentVal: string,
    onValueUpdate: (val: string | ((prev: string) => string)) => void,
    onSave?: (val: string) => void,
    setIsUploading?: (val: boolean) => void,
  ) => {
    if (!file.type.startsWith('image/')) return;

    if (setIsUploading) setIsUploading(true);
    const ext = file.type.split('/')[1] || 'png';
    const cleanFileName = file.name && file.name !== 'image.png'
      ? file.name
      : `image-${Date.now()}.${ext}`;

    const placeholder = `\n![Uploading ${cleanFileName}...]()\n`;

    const start = textarea?.selectionStart ?? currentVal.length;
    const end = textarea?.selectionEnd ?? currentVal.length;
    const before = currentVal.slice(0, start);
    const after = currentVal.slice(end);
    const textWithPlaceholder = before + placeholder + after;

    onValueUpdate(textWithPlaceholder);

    try {
      const res = await api.uploads.upload(file, task?.id);
      const finalUrl = resolveMediaUrl(res.url);
      const markdown = `\n![${cleanFileName}](${finalUrl})\n`;

      onValueUpdate((prev: string) => {
        const updated = prev.includes(placeholder)
          ? prev.replace(placeholder, markdown)
          : `${prev}${markdown}`;
        if (onSave) {
          onSave(updated);
        }
        return updated;
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      onValueUpdate((prev: string) => {
        return prev.replace(placeholder, `\n<!-- Upload failed: ${err.message || 'Upload error'} -->\n`);
      });
    } finally {
      if (setIsUploading) setIsUploading(false);
    }
  };

  const handlePasteToTextarea = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    currentVal: string,
    onValueUpdate: (val: string | ((prev: string) => string)) => void,
    onSave?: (val: string) => void,
    setIsUploading?: (val: boolean) => void,
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imgItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (!imgItem) return;

    e.preventDefault();
    const file = imgItem.getAsFile();
    if (file) {
      handleUploadImageFile(file, e.currentTarget, currentVal, onValueUpdate, onSave, setIsUploading);
    }
  };

  const handleDropToTextarea = (
    e: React.DragEvent<HTMLTextAreaElement>,
    currentVal: string,
    onValueUpdate: (val: string | ((prev: string) => string)) => void,
    onSave?: (val: string) => void,
    setIsUploading?: (val: boolean) => void,
  ) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imgFile = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (imgFile) {
      e.preventDefault();
      handleUploadImageFile(imgFile, e.currentTarget, currentVal, onValueUpdate, onSave, setIsUploading);
    }
  };

  // Immediate Property Changes (click to edit directly)
  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    onUpdate(task.id, { status: newStatus });
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    setPriority(newPriority);
    onUpdate(task.id, { priority: newPriority });
  };

  const handleAssigneeChange = (newAssigneeId: string | null) => {
    setAssigneeId(newAssigneeId);
    onUpdate(task.id, { assigneeId: newAssigneeId });
  };

  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    onUpdate(task.id, { projectId: newProjectId });
  };

  const handleDueDateChange = (newDate: string) => {
    setDueDate(newDate);
    onUpdate(task.id, { dueDate: newDate ? new Date(newDate).toISOString() : null });
  };

  const handleToggleLabel = (lbl: string) => {
    if (!task) return;
    const updated = labels.includes(lbl) ? labels.filter((l) => l !== lbl) : [...labels, lbl];
    setLabels(updated);
    onUpdate(task.id, { labels: updated });
  };

  const handleCreateLabel = (name: string) => {
    if (!task) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = Array.from(new Set([...labels, trimmed]));
    setLabels(updated);
    setLabelSearch('');
    onUpdate(task.id, { labels: updated });
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const updated = labels.filter((l) => l !== labelToRemove);
    setLabels(updated);
    onUpdate(task.id, { labels: updated });
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyBranch = () => {
    if (!task) return;
    const cleanTitle = (task.title || 'issue')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 45);
    const branchName = `${task.identifier.toLowerCase()}-${cleanTitle}`;

    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(branchName);
      setCopiedBranch(true);
      setTimeout(() => setCopiedBranch(false), 2000);
    }
  };

  // Mention Autocomplete Matching
  const matchingMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();
    return members
      .filter((m) => {
        const name = (m.user?.name || '').toLowerCase();
        const email = (m.user?.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 5);
  }, [members, mentionQuery]);

  const handleCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewCommentText(text);

    // Look backward from cursor to detect '@'
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if (
        (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtPos === 0) &&
        !textAfterAt.includes('\n') &&
        textAfterAt.length <= 25
      ) {
        setMentionQuery(textAfterAt);
        setMentionCursorPos(lastAtPos);
        setMentionIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (userName: string) => {
    if (mentionCursorPos === -1) return;
    const textBeforeAt = newCommentText.slice(0, mentionCursorPos);
    const currentCursor =
      commentTextareaRef.current?.selectionStart ||
      mentionCursorPos + (mentionQuery?.length || 0) + 1;
    const textAfterCursor = newCommentText.slice(currentCursor);
    const inserted = `${textBeforeAt}@${userName} ${textAfterCursor}`;
    setNewCommentText(inserted);
    setMentionQuery(null);

    setTimeout(() => {
      if (commentTextareaRef.current) {
        commentTextareaRef.current.focus();
        const newPos = mentionCursorPos + userName.length + 2;
        commentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && matchingMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % matchingMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + matchingMembers.length) % matchingMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = matchingMembers[mentionIndex];
        if (selected?.user?.name) {
          handleSelectMention(selected.user.name);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const activeProject = projects.find((p) => p.id === projectId) || task?.project;

  const handleUpdatePrefix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = newPrefix.trim().toUpperCase();
    if (!cleanKey || !activeProject || !task) return;
    setUpdatingPrefix(true);
    try {
      await api.projects.update(activeProject.id, { key: cleanKey });
      let suffix = '1';
      const match = task.identifier.match(/-(\d+)$/);
      if (match) suffix = match[1];
      const newIdentifier = `${cleanKey}-${suffix}`;

      onUpdate(task.id, { identifier: newIdentifier });
      setShowPrefixModal(false);
    } catch (err) {
      console.error('Failed to update project prefix:', err);
    } finally {
      setUpdatingPrefix(false);
    }
  };

  // Comments Handling
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    const content = newCommentText.trim();

    // Optimistic comment creation
    const tempComment: TaskComment = {
      id: `temp-${Date.now()}`,
      content,
      taskId: task.id,
      userId: user?.id || 'me',
      user: user || { id: 'me', name: 'You', email: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, tempComment]);
    setNewCommentText('');

    try {
      const serverComment = await api.tasks.addComment(task.id, content);
      setComments((prev) => {
        const alreadyHasServerComment = prev.some((c) => c.id === serverComment.id);
        if (alreadyHasServerComment) {
          return prev.filter((c) => c.id !== tempComment.id);
        }
        return prev.map((c) => (c.id === tempComment.id ? serverComment : c));
      });
      // Update task in parent state
      onUpdate(task.id, {
        comments: [
          ...(task.comments || []).filter((c) => c.id !== tempComment.id && c.id !== serverComment.id),
          serverComment,
        ],
      });
    } catch (err) {
      console.error('Failed to post comment:', err);
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await api.tasks.deleteComment(task.id, commentId);
      onUpdate(task.id, {
        comments: (task.comments || []).filter((c) => c.id !== commentId),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!task || !editingCommentText.trim() || isUpdatingComment) return;
    setIsUpdatingComment(true);
    const content = editingCommentText.trim();
    try {
      const updated = await api.tasks.updateComment(task.id, commentId, content);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c)),
      );
      onUpdate(task.id, {
        comments: (task.comments || []).map((c) =>
          c.id === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c,
        ),
      });
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleCopyCommentLink = (commentId: string) => {
    if (!task) return;
    const url = `${window.location.origin}/issue/${task.id}#comment-${commentId}`;
    navigator.clipboard.writeText(url);
    window.history.replaceState(null, '', `#comment-${commentId}`);
    setCopiedCommentId(commentId);
    setHighlightedCommentId(commentId);
    setTimeout(() => {
      setCopiedCommentId((curr) => (curr === commentId ? null : curr));
    }, 2000);
  };

  // Edit Comment Mention Autocomplete Matching
  const matchingEditMembers = useMemo(() => {
    if (editingMentionQuery === null) return [];
    const q = editingMentionQuery.toLowerCase().trim();
    return members
      .filter((m) => {
        const name = (m.user?.name || '').toLowerCase();
        const email = (m.user?.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 5);
  }, [members, editingMentionQuery]);

  const handleEditCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    setEditingCommentText(text);

    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if (
        (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtPos === 0) &&
        !textAfterAt.includes('\n') &&
        textAfterAt.length <= 25
      ) {
        setEditingMentionQuery(textAfterAt);
        setEditingMentionCursorPos(lastAtPos);
        setEditingMentionIndex(0);
        return;
      }
    }
    setEditingMentionQuery(null);
  };

  const handleSelectEditMention = (userName: string) => {
    if (editingMentionCursorPos === -1) return;
    const textBeforeAt = editingCommentText.slice(0, editingMentionCursorPos);
    const currentCursor =
      editCommentTextareaRef.current?.selectionStart ||
      editingMentionCursorPos + (editingMentionQuery?.length || 0) + 1;
    const textAfterCursor = editingCommentText.slice(currentCursor);
    const inserted = `${textBeforeAt}@${userName} ${textAfterCursor}`;
    setEditingCommentText(inserted);
    setEditingMentionQuery(null);

    setTimeout(() => {
      if (editCommentTextareaRef.current) {
        editCommentTextareaRef.current.focus();
        const newPos = editingMentionCursorPos + userName.length + 2;
        editCommentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleEditCommentKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    commentId: string,
  ) => {
    if (editingMentionQuery !== null && matchingEditMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setEditingMentionIndex((prev) => (prev + 1) % matchingEditMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setEditingMentionIndex((prev) => (prev - 1 + matchingEditMembers.length) % matchingEditMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = matchingEditMembers[editingMentionIndex];
        if (selected?.user?.name) {
          handleSelectEditMention(selected.user.name);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditingMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEditComment(commentId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditComment();
    }
  };

  // Reactions Handlers
  const handleToggleTaskReaction = async (emoji: string) => {
    if (!task || !user) return;
    const existing = taskReactions.find((r) => r.emoji === emoji && r.userId === user.id);
    let updated: TaskReaction[];
    if (existing) {
      updated = taskReactions.filter((r) => r.id !== existing.id && !(r.emoji === emoji && r.userId === user.id));
    } else {
      const opt: TaskReaction = {
        id: `opt-${Date.now()}`,
        emoji,
        taskId: task.id,
        userId: user.id,
        user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
        createdAt: new Date().toISOString(),
      };
      updated = [...taskReactions, opt];
    }
    setTaskReactions(updated);
    onUpdate(task.id, { reactions: updated });

    try {
      const res = await api.tasks.toggleTaskReaction(task.id, emoji);
      if (res.action === 'added' && res.reaction) {
        setTaskReactions((prev) => [
          ...prev.filter((r) => !(r.emoji === emoji && r.userId === user.id)),
          res.reaction!,
        ]);
      }
    } catch (err) {
      console.error('Failed to toggle task reaction:', err);
      setTaskReactions(task.reactions || []);
    }
  };

  const handleToggleCommentReaction = async (commentId: string, emoji: string) => {
    if (!task || !user) return;
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const currentReactions = c.reactions || [];
        const existing = currentReactions.find((r) => r.emoji === emoji && r.userId === user.id);
        const updatedReactions = existing
          ? currentReactions.filter((r) => !(r.emoji === emoji && r.userId === user.id))
          : [
              ...currentReactions,
              {
                id: `opt-${Date.now()}`,
                emoji,
                commentId,
                userId: user.id,
                user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
                createdAt: new Date().toISOString(),
              },
            ];
        return { ...c, reactions: updatedReactions };
      }),
    );

    try {
      const res = await api.tasks.toggleCommentReaction(task.id, commentId, emoji);
      if (res.action === 'added' && res.reaction) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              reactions: [
                ...(c.reactions || []).filter((r) => !(r.emoji === emoji && r.userId === user.id)),
                res.reaction!,
              ],
            };
          }),
        );
      }
    } catch (err) {
      console.error('Failed to toggle comment reaction:', err);
    }
  };

  const currentAssignee = members.find((m) => m.userId === assigneeId)?.user || task.assignee;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window matching Linear Layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-6xl h-full sm:h-[92vh] rounded-none sm:rounded-xl border-0 sm:border border-border bg-[#0d0e15] shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Top Breadcrumb & Actions Bar (Matching screenshot) */}
          <div className="flex h-12 items-center justify-between px-3 sm:px-6 border-b border-border/70 bg-[#11121c]/90 select-none shrink-0">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground overflow-hidden">
              <button
                onClick={onClose}
                className="p-1 -ml-1 rounded hover:bg-secondary text-zinc-400 hover:text-white sm:hidden mr-0.5"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-zinc-300 font-medium">
                <span className="w-4 h-4 rounded bg-[#5e6ad2] text-[10px] text-white flex items-center justify-center font-bold">
                  {workspace?.name?.[0] || 'L'}
                </span>
                <span>{workspace?.name || 'Workspace'}</span>
              </div>

              <span className="hidden sm:inline">›</span>

              <span className="shrink-0 text-zinc-400 hidden sm:inline">Issues</span>

              <span className="hidden sm:inline">›</span>

              <button
                type="button"
                onClick={() => {
                  setNewPrefix(activeProject?.key || 'TJAR');
                  setShowPrefixModal(true);
                }}
                className="flex items-center gap-1 font-mono font-medium text-zinc-200 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 px-1.5 py-0.5 rounded text-xs transition-colors shrink-0 group cursor-pointer"
                title="Click to change project issue prefix (e.g. TJAR)"
              >
                <span>{task.identifier}</span>
                <Edit3 className="w-2.5 h-2.5 text-zinc-500 group-hover:text-indigo-400 ml-0.5" />
              </button>

              <span className="text-zinc-500 hidden md:inline truncate max-w-[260px]">
                {task.title}
              </span>

              <button
                className="p-1 rounded hover:bg-secondary text-zinc-500 hover:text-amber-400 transition-colors ml-1"
                title="Favorite"
              >
                <Star className="w-3.5 h-3.5" />
              </button>

              <button
                className="p-1 rounded hover:bg-secondary text-zinc-500 hover:text-zinc-300 transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Actions, Navigation & Close */}
            <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
              {/* Copy Git Branch Name Button */}
              <button
                type="button"
                onClick={handleCopyBranch}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161724] hover:bg-[#1f2030] text-zinc-300 hover:text-white border border-[#2b2c3a] text-xs font-mono transition-all group shrink-0"
                title={`Copy git branch: ${task.identifier.toLowerCase()}-${(task.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              >
                {copiedBranch ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span className="text-emerald-400 font-sans font-medium text-[11px]">Branch copied!</span>
                  </>
                ) : (
                  <>
                    <GitBranch className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
                    <span className="text-zinc-300 group-hover:text-white font-sans text-[11px]">Copy branch</span>
                  </>
                )}
              </button>

              {totalTasks > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 px-2 border-r border-border/60 mr-1">
                  <span>
                    {currentIndex + 1} / {totalTasks}
                  </span>
                  <button
                    onClick={handlePrevTask}
                    disabled={currentIndex <= 0}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Previous issue"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextTask}
                    disabled={currentIndex >= totalTasks - 1}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Next issue"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary text-zinc-400 hover:text-white transition-colors"
                title="Copy issue link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied</span>
                  </>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="p-1.5 rounded hover:bg-destructive/15 text-zinc-500 hover:text-destructive transition-colors"
                title="Delete issue"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-secondary text-zinc-400 hover:text-white transition-colors ml-1"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2.5 flex items-center justify-between text-xs text-destructive shrink-0">
              <span>Are you sure you want to permanently delete {task.identifier}?</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(task.id)}
                  className="h-6 text-xs"
                >
                  Confirm Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Main Body: Two-column layout (Left: Title, Description, Uploads, Comments | Right: Properties sidebar) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Left Main Area: Scrollable */}
            <div className="flex-1 overflow-y-visible lg:overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
              {/* Sub-issue parent link banner */}
              {task.parent && (
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161726] border border-[#2b2c3d] text-xs text-zinc-300">
                    <GitFork className="w-3.5 h-3.5 text-indigo-400 rotate-180" />
                    <span className="text-zinc-500">Sub-issue of</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTask && onNavigateTask(task.parent as Task)}
                      className="font-medium text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span className="font-mono text-zinc-400">{task.parent.identifier}</span>
                      <span className="truncate max-w-[240px]">{task.parent.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate(task.id, { parentId: null })}
                      className="p-0.5 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-rose-400 transition-colors ml-1"
                      title="Unlink from parent"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Issue Title (Click directly to edit inline!) */}
              <div>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-0 border-b border-transparent hover:border-border/40 focus:border-primary focus:outline-none text-foreground py-1 transition-all rounded"
                  placeholder="Issue title..."
                  title="Click directly to edit title"
                />
              </div>

              {/* Description Area (Click directly to edit inline!) */}
              <div className="space-y-2 group">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Description</span>
                  <span className="text-[10px] text-zinc-500">
                    Auto-saves
                  </span>
                </div>

                <LinearRichEditor
                  value={description}
                  onChange={(val) => {
                    setDescription(val);
                    onUpdate(task.id, { description: val });
                  }}
                  onBlur={handleDescBlur}
                  taskId={task.id}
                  members={members}
                  onImageClick={(url) => setLightboxUrl(url)}
                  placeholder="Click here to add description, notes, or links... (Paste images directly to embed inline)"
                />

                {/* Task Reactions */}
                <div className="pt-2 flex items-center gap-2">
                  <ReactionsBar
                    reactions={taskReactions}
                    currentUserId={user?.id}
                    onToggleReaction={handleToggleTaskReaction}
                    size="md"
                  />
                </div>
              </div>

              {/* Sub-issues Section */}
              <SubIssuesSection
                parentTask={task}
                subTasks={task.subTasks || []}
                members={members}
                allTasks={allTasks}
                onSubTasksChange={(updatedSubTasks) => {
                  onUpdate(task.id, { subTasks: updatedSubTasks });
                }}
                onNavigate={onNavigateTask}
              />

              {/* Related Issues Section */}
              <RelatedIssuesSection
                task={task}
                allTasks={allTasks}
                onTaskChange={(updatedTask) => {
                  onUpdate(task.id, updatedTask);
                }}
                onNavigate={onNavigateTask}
              />

              {/* Attachments Section */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attachments & Uploads</span>
                  </span>
                </div>

                <FileUploader
                  taskId={task.id}
                  attachments={task.attachments || []}
                  onUploadSuccess={(att) => {
                    const updatedAttachments = [...(task.attachments || []), att];
                    onUpdate(task.id, { attachments: updatedAttachments });
                  }}
                  onDeleteSuccess={(id) => {
                    const updatedAttachments = (task.attachments || []).filter((a) => a.id !== id);
                    onUpdate(task.id, { attachments: updatedAttachments });
                  }}
                />
              </div>

              {/* Activity & Comments Section (Matches Linear comments) */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Activity & Comments ({comments.length})</span>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-600">
                      No comments yet. Leave the first comment below!
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        id={`comment-${c.id}`}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-300 group relative ${
                          highlightedCommentId === c.id
                            ? 'bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20'
                            : 'bg-[#12131d]/80 border-border/50 hover:border-border'
                        }`}
                      >
                        <img
                          src={
                            c.user?.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              c.user?.name || 'User',
                            )}`
                          }
                          alt={c.user?.name || 'User'}
                          className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-border mt-0.5"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {c.user?.name || 'Team Member'}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(c.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {c.updatedAt &&
                              new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 2000 && (
                                <span
                                  className="text-[10px] text-zinc-500 italic"
                                  title={`Edited at ${new Date(c.updatedAt).toLocaleTimeString()}`}
                                >
                                  (edited)
                                </span>
                              )}
                          </div>

                          {editingCommentId === c.id ? (
                            <div className="mt-2 space-y-2 relative">
                              {/* Mentions autocomplete popup while editing comment */}
                              {editingMentionQuery !== null && matchingEditMembers.length > 0 && (
                                <div className="absolute left-0 bottom-full mb-1 z-50 w-64 rounded-xl border border-border/80 bg-[#0e0f18]/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                  <div className="px-3 py-1.5 border-b border-border/50 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <AtSign className="w-3 h-3 text-indigo-400" />
                                      <span>Mention team member</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-normal">↑↓ navigate, ↵ select</span>
                                  </div>
                                  <div className="space-y-0.5 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                    {matchingEditMembers.map((m, idx) => (
                                      <button
                                        key={m.userId}
                                        type="button"
                                        onClick={() => handleSelectEditMention(m.user?.name || 'User')}
                                        className={cn(
                                          'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                                          idx === editingMentionIndex
                                            ? 'bg-indigo-600/20 text-white font-medium'
                                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                                        )}
                                      >
                                        <img
                                          src={
                                            m.user?.avatarUrl ||
                                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                              m.user?.name || 'User',
                                            )}`
                                          }
                                          alt={m.user?.name || 'User'}
                                          className="w-5 h-5 rounded-full object-cover shrink-0"
                                        />
                                        <div className="min-w-0 flex-1 truncate">
                                          <div className="font-medium text-white truncate text-xs">
                                            {m.user?.name}
                                          </div>
                                          <div className="text-[10px] text-zinc-500 truncate">
                                            {m.user?.email}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <textarea
                                ref={editCommentTextareaRef}
                                value={editingCommentText}
                                onChange={handleEditCommentTextChange}
                                onKeyDown={(e) => handleEditCommentKeyDown(e, c.id)}
                                rows={3}
                                className="w-full bg-[#161726] border border-border focus:border-indigo-500 rounded-lg p-2.5 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
                                autoFocus
                              />

                              {/* Comment image / mention live preview when editing */}
                              {editingCommentText && (editingCommentText.includes('@') || editingCommentText.includes('![')) && (
                                <div className="p-2 border border-border/40 bg-[#0a0b12]/60 rounded text-xs space-y-1">
                                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                                    Live Preview
                                  </span>
                                  <MarkdownRenderer content={editingCommentText} membersList={members} />
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-zinc-500">
                                    Esc to cancel • Cmd+Enter to save
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = editingCommentText ? `${editingCommentText} @` : '@';
                                      setEditingCommentText(text);
                                      setEditingMentionQuery('');
                                      setEditingMentionCursorPos(text.length - 1);
                                      setEditingMentionIndex(0);
                                      setTimeout(() => {
                                        if (editCommentTextareaRef.current) {
                                          editCommentTextareaRef.current.focus();
                                          editCommentTextareaRef.current.setSelectionRange(text.length, text.length);
                                        }
                                      }, 10);
                                    }}
                                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                                    title="Mention a team member"
                                  >
                                    <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Mention</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEditComment}
                                    disabled={isUpdatingComment}
                                    className="h-6 text-xs px-2 text-zinc-400 hover:text-white"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="linear"
                                    size="sm"
                                    onClick={() => handleSaveEditComment(c.id)}
                                    disabled={!editingCommentText.trim() || isUpdatingComment}
                                    className="h-6 text-xs px-2.5"
                                  >
                                    {isUpdatingComment ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Check className="w-3 h-3 mr-1" />
                                    )}
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="mt-1.5 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {renderCommentContentWithMentions(c.content, members)}
                              </div>

                              {/* Comment Reactions */}
                              <div className="mt-2">
                                <ReactionsBar
                                  reactions={c.reactions || []}
                                  currentUserId={user?.id}
                                  onToggleReaction={(emoji) => handleToggleCommentReaction(c.id, emoji)}
                                  size="sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Copy Link to Comment */}
                          <button
                            onClick={() => handleCopyCommentLink(c.id)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors relative"
                            title={copiedCommentId === c.id ? 'Copied!' : 'Copy link to comment'}
                          >
                            {copiedCommentId === c.id ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied</span>
                              </span>
                            ) : (
                              <Link2 className="w-3 h-3" />
                            )}
                          </button>

                          {/* Edit Comment */}
                          {(c.userId === user?.id || workspace?.role === 'OWNER' || workspace?.role === 'ADMIN') && (
                            <button
                              onClick={() => handleStartEditComment(c)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                              title="Edit comment"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}

                          {/* Delete Comment */}
                          {(c.userId === user?.id || workspace?.role === 'OWNER' || workspace?.role === 'ADMIN') && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="p-1 rounded hover:bg-destructive/20 text-zinc-500 hover:text-destructive transition-all"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Composer with Mentions */}
                <div className="relative">
                  {/* Mentions Autocomplete Floating Dropdown */}
                  {mentionQuery !== null && matchingMembers.length > 0 && (
                    <div className="absolute bottom-full left-10 mb-2 z-50 w-72 rounded-xl bg-[#191a24] border border-[#2b2c3a] shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 backdrop-blur-md">
                      <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-zinc-400 border-b border-[#2b2c3a]/70 mb-1">
                        <div className="flex items-center gap-1.5">
                          <AtSign className="w-3 h-3 text-indigo-400" />
                          <span>Mention team member</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-normal">↑↓ navigate, ↵ select</span>
                      </div>
                      <div className="space-y-0.5 max-h-48 overflow-y-auto">
                        {matchingMembers.map((m, idx) => (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => handleSelectMention(m.user?.name || 'User')}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                              idx === mentionIndex
                                ? 'bg-[#282a38] text-white font-medium'
                                : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                            )}
                          >
                            <img
                              src={
                                m.user?.avatarUrl ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                  m.user?.name || 'User',
                                )}`
                              }
                              alt={m.user?.name || 'User'}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1 truncate">
                              <div className="font-medium text-white truncate text-xs">
                                {m.user?.name}
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate">
                                {m.user?.email}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleAddComment}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#141522] border border-border/80 focus-within:border-primary/80 transition-colors"
                  >
                    <img
                      src={
                        user?.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          user?.name || 'Me',
                        )}`
                      }
                      alt={user?.name || 'Me'}
                      className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-border mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <textarea
                        ref={commentTextareaRef}
                        value={newCommentText}
                        onChange={handleCommentTextChange}
                        onKeyDown={handleCommentKeyDown}
                        onPaste={(e) =>
                          handlePasteToTextarea(
                            e,
                            newCommentText,
                            setNewCommentText,
                            undefined,
                            setIsUploadingCommentImage,
                          )
                        }
                        onDrop={(e) =>
                          handleDropToTextarea(
                            e,
                            newCommentText,
                            setNewCommentText,
                            undefined,
                            setIsUploadingCommentImage,
                          )
                        }
                        onDragOver={(e) => e.preventDefault()}
                        rows={2}
                        placeholder="Leave a comment... (Paste images directly here, type @ to mention, Cmd + Enter to send)"
                        className="w-full bg-transparent border-0 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
                      />

                      {/* Comment image live preview */}
                      {newCommentText && newCommentText.includes('![') && (
                        <div className="p-2 border-t border-border/30 bg-[#0a0b12]/50 my-1 rounded">
                          <MarkdownRenderer
                            content={
                              newCommentText
                                .split('\n')
                                .filter((l) => l.trim().startsWith('!['))
                                .join('\n')
                            }
                            membersList={members}
                            onImageClick={(url) => setLightboxUrl(url)}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const text = newCommentText ? `${newCommentText} @` : '@';
                              setNewCommentText(text);
                              setMentionQuery('');
                              setMentionCursorPos(text.length - 1);
                              setMentionIndex(0);
                              setTimeout(() => {
                                if (commentTextareaRef.current) {
                                  commentTextareaRef.current.focus();
                                  commentTextareaRef.current.setSelectionRange(text.length, text.length);
                                }
                              }, 10);
                            }}
                            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                            title="Mention a team member"
                          >
                            <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Mention</span>
                          </button>

                          {isUploadingCommentImage ? (
                            <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium animate-pulse">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading image...</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-600 hidden sm:inline">
                              Paste images to upload
                            </span>
                          )}
                        </div>

                        <Button
                          type="submit"
                          variant="linear"
                          size="sm"
                          disabled={!newCommentText.trim() || submittingComment}
                          className="h-7 text-xs px-3 ml-auto"
                        >
                          {submittingComment ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Send className="w-3 h-3 mr-1" />
                          )}
                          Comment
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Properties (Matches Linear sidebar from screenshot) */}
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border/70 bg-[#0f1019] p-4 sm:p-5 space-y-6 shrink-0 lg:overflow-y-auto select-none">
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Properties
              </div>

              <div className="space-y-4 text-xs">
                {/* Status Property */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                      className="w-full appearance-none bg-[#161825] hover:bg-[#1a1d2e] border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer flex items-center transition-colors"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_CONFIG[s].label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                      <StatusIcon status={status} />
                    </div>
                  </div>
                </div>

                {/* Priority Property */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium">Priority</label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                      className="w-full appearance-none bg-[#161825] hover:bg-[#1a1d2e] border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {PRIORITY_CONFIG[p].label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                      <PriorityIcon priority={priority} />
                    </div>
                  </div>
                </div>

                {/* Assignee Property */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium">Assignee</label>
                  <div className="relative">
                    <select
                      value={assigneeId || ''}
                      onChange={(e) => handleAssigneeChange(e.target.value || null)}
                      className="w-full appearance-none bg-[#161825] hover:bg-[#1a1d2e] border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center">
                      {currentAssignee ? (
                        <img
                          src={
                            currentAssignee.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              currentAssignee.name,
                            )}`
                          }
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Property */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium">Project</label>
                  <div className="relative">
                    <select
                      value={projectId}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      className="w-full appearance-none bg-[#161825] hover:bg-[#1a1d2e] border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.key})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                      <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  </div>
                </div>

                {/* Due Date Property */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium">Due Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => handleDueDateChange(e.target.value)}
                      className="w-full bg-[#161825] hover:bg-[#1a1d2e] border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Labels Section */}
              <div className="space-y-2 pt-4 border-t border-border/50 relative" ref={labelsDropdownRef}>
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <span>Labels</span>
                  <button
                    type="button"
                    onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                    className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors"
                    title="Add or edit labels"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  {labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-zinc-800/90 text-zinc-200 border border-zinc-700/60"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getLabelColor(lbl) }}
                      />
                      <span>{lbl}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(lbl)}
                        className="hover:text-destructive text-zinc-500 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                    className="text-xs text-zinc-400 hover:text-white hover:bg-secondary/70 border border-dashed border-border/80 rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add label</span>
                  </button>
                </div>

                {/* Floating Linear Labels Dropdown */}
                {showLabelsDropdown && (
                  <div className="absolute left-0 bottom-full mb-1 z-50 w-64 rounded-xl bg-[#191a24] border border-[#2b2c3a] shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 backdrop-blur-md">
                    {/* Search / Filter Input */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-[#2b2c3a]/70 mb-1">
                      <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Filter or create label..."
                        value={labelSearch}
                        onChange={(e) => setLabelSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && labelSearch.trim()) {
                            e.preventDefault();
                            handleCreateLabel(labelSearch.trim());
                          }
                        }}
                        autoFocus
                        className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>

                    {/* List of Existing Workspace Labels */}
                    <div className="overflow-y-auto space-y-0.5 max-h-48 py-0.5 pr-0.5">
                      {filteredLabels.map((lbl) => {
                        const isSelected = labels.includes(lbl);
                        return (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => handleToggleLabel(lbl)}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                              isSelected
                                ? 'bg-[#282a38] text-white font-medium'
                                : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: getLabelColor(lbl) }}
                              />
                              <span className="truncate">{lbl}</span>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}

                      {filteredLabels.length === 0 && !labelSearch.trim() && (
                        <div className="px-2.5 py-3 text-center text-xs text-zinc-500">
                          No labels found
                        </div>
                      )}
                    </div>

                    {/* Option to create a new label if search term is typed */}
                    {labelSearch.trim() &&
                      !allWorkspaceLabels.some(
                        (l) => l.toLowerCase() === labelSearch.trim().toLowerCase(),
                      ) && (
                        <button
                          type="button"
                          onClick={() => handleCreateLabel(labelSearch.trim())}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-primary hover:bg-primary/10 transition-colors font-medium border-t border-[#2b2c3a]/50 mt-1"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Create label &ldquo;{labelSearch.trim()}&rdquo;</span>
                        </button>
                      )}
                  </div>
                )}
              </div>

              {/* Creator Info */}
              <div className="pt-4 border-t border-border/50 text-xs space-y-1">
                <span className="text-[11px] text-zinc-500 font-medium">Created by</span>
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={
                      task.creator?.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        task.creator?.name || 'Alex',
                      )}`
                    }
                    alt=""
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
                  />
                  <span className="text-zinc-300 font-medium">{task.creator?.name || 'Alex Vance'}</span>
                </div>
                <span className="text-[10px] text-zinc-500 block pt-0.5">
                  {new Date(task.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modal to Change Issue Prefix / Project Key */}
        {showPrefixModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setShowPrefixModal(false)}
            />
            <div className="relative w-full max-w-md rounded-xl border border-[#2b2c3a] bg-[#12131d] shadow-2xl p-5 space-y-4 z-10 animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Change Issue Prefix Key</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrefixModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdatePrefix} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">
                    Prefix Key (e.g. TJAR, LIN, PROJ)
                  </label>
                  <input
                    type="text"
                    value={newPrefix}
                    onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                    placeholder="e.g. TJAR"
                    maxLength={10}
                    autoFocus
                    className="w-full bg-[#181926] border border-[#2b2c3a] rounded-lg px-3 py-2 text-sm text-white font-mono uppercase tracking-wider focus:outline-none focus:border-primary"
                    required
                  />
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    All current issues under this project will automatically be renamed to this prefix (e.g.{' '}
                    <span className="font-mono text-indigo-300">{newPrefix.trim().toUpperCase() || 'TJAR'}-1</span>
                    ), and newly created issues will increment automatically ({newPrefix.trim().toUpperCase() || 'TJAR'}-2, etc.).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrefixModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="linear"
                    size="sm"
                    disabled={!newPrefix.trim() || updatingPrefix}
                    className="text-xs px-3"
                  >
                    {updatingPrefix ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                    Save Prefix
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lightbox Image Preview Modal */}
        {lightboxUrl && (
          <div
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[90vh] bg-[#0f1018] border border-border/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-[#141522]">
                <span className="text-xs font-medium text-zinc-300 truncate max-w-md">
                  Image Preview
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={lightboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs flex items-center gap-1"
                    title="Open original"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Original</span>
                  </a>
                  <button
                    onClick={() => setLightboxUrl(null)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center bg-[#07080d]">
                <img
                  src={lightboxUrl}
                  alt="Enlarged preview"
                  className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
