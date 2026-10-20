'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { AuthScreen } from '../../../components/auth/AuthScreen';
import { Task, TaskPriority, TaskStatus, WorkspaceMember, TaskComment, Project, WorkflowSection, TaskActivity, Cycle } from '../../../types';
import { PriorityIcon, PRIORITY_CONFIG } from '../../../components/linear/PriorityIcon';
import { StatusIcon, STATUS_CONFIG } from '../../../components/linear/StatusIcon';
import { FileUploader } from '../../../components/linear/FileUploader';
import { SubIssuesSection } from '../../../components/linear/SubIssuesSection';
import { RelatedIssuesSection } from '../../../components/linear/RelatedIssuesSection';
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
  FolderKanban,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Search,
  GitBranch,
  AtSign,
  Edit3,
  Hash,
  GitFork,
  Link as LinkIcon,
  RotateCw,
  RotateCcw,
  Target,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { MarkdownRenderer, resolveMediaUrl } from '../../../components/ui/MarkdownRenderer';
import { LinearRichEditor } from '../../../components/linear/LinearRichEditor';

const PRIORITIES: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

const PRESET_LABEL_COLORS: Record<string, string> = {
  Feature: '#a855f7',
  Bug: '#ef4444',
  Improvement: '#3b82f6',
  Critical: '#f43f5e',
  Design: '#f97316',
  Frontend: '#0ea5e9',
  Backend: '#10b981',
  Performance: '#14b8a6',
  Storage: '#6366f1',
  Research: '#8b5cf6',
  Documentation: '#84cc16',
  Security: '#e11d48',
};

export const getLabelColor = (name: string) => {
  if (PRESET_LABEL_COLORS[name]) return PRESET_LABEL_COLORS[name];
  const palette = ['#a855f7', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

export const renderCommentContentWithMentions = (content: string, membersList: WorkspaceMember[]) => {
  return <MarkdownRenderer content={content} membersList={membersList} />;
};

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function IssueDetailContent() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const { user, workspace, projects, loading: authLoading } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [customStatus, setCustomStatus] = useState<string | null>(null);
  const [sections, setSections] = useState<WorkflowSection[]>([]);
  const [priority, setPriority] = useState<TaskPriority>('NO_PRIORITY');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelSearch, setLabelSearch] = useState('');

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

  const handleToggleLabel = (lbl: string) => {
    const updated = labels.includes(lbl) ? labels.filter((l) => l !== lbl) : [...labels, lbl];
    setLabels(updated);
    triggerSave({ labels: updated });
  };

  const handleCreateLabel = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!labels.includes(trimmed)) {
      const updated = [...labels, trimmed];
      setLabels(updated);
      triggerSave({ labels: updated });
    }
    setLabelSearch('');
  };

  // Auto-save feedback state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Socket & Real-time Collaboration
  const { socket } = useSocket();

  // Cycles & Estimates
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<number>(1);
  const [descPreview, setDescPreview] = useState(false);

  // Comments & Activities
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
  const subIssuesRef = useRef<HTMLDivElement>(null);
  const relatedIssuesRef = useRef<HTMLDivElement>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [isUploadingDescImage, setIsUploadingDescImage] = useState(false);
  const [isUploadingCommentImage, setIsUploadingCommentImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Real-time typing & auto-save timer refs
  const taskRef = useRef<Task | null>(task);
  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const descTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalTitleTypeRef = useRef<number>(0);
  const lastLocalDescTypeRef = useRef<number>(0);
  const [typingIndicator, setTypingIndicator] = useState<{
    userName: string;
    field: 'title' | 'description';
  } | null>(null);

  // Ensure workspace room and task room are joined for real-time collaboration
  useEffect(() => {
    if (!socket || !taskId) return;
    socket.emit('join_task', { taskId });
    const wsId = task?.workspaceId || workspace?.id;
    if (wsId) {
      socket.emit('join_workspace', { workspaceId: wsId });
    }
    return () => {
      socket.emit('leave_task', { taskId });
    };
  }, [socket, taskId, task?.workspaceId, workspace?.id]);

  // Auto-resize description textarea
  const adjustTextareaHeight = () => {
    if (descTextareaRef.current) {
      descTextareaRef.current.style.height = 'auto';
      descTextareaRef.current.style.height = `${Math.max(160, descTextareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [description]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.property-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Real-time WebSockets listeners for live collaboration
  useEffect(() => {
    if (!socket || !taskId) return;

    const handleCommentCreated = (data: { taskId: string; comment: TaskComment }) => {
      if (data.taskId === taskId) {
        setComments((prev) => {
          if (prev.some((c) => c.id === data.comment.id)) return prev;
          return [...prev, data.comment];
        });
      }
    };

    const handleTaskTyping = (data: {
      workspaceId?: string;
      taskId: string;
      field: 'title' | 'description';
      value: string;
      userId: string;
      userName: string;
      senderSocketId?: string;
    }) => {
      if (data.taskId !== taskId) return;
      if (data.senderSocketId && socket && data.senderSocketId === socket.id) return;

      const isLocalTypingTitle = Date.now() - lastLocalTitleTypeRef.current < 700;
      const isLocalTypingDesc = Date.now() - lastLocalDescTypeRef.current < 700;

      if (data.field === 'title') {
        if (!isLocalTypingTitle) {
          setTitle(data.value);
        }
      } else if (data.field === 'description') {
        if (!isLocalTypingDesc) {
          setDescription(data.value);
        }
      }

      setTypingIndicator({
        userName: data.userName || 'A teammate',
        field: data.field,
      });

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingIndicator(null);
      }, 1500);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.id === taskId) {
        setTask((prev) => (prev ? { ...prev, ...updatedTask } : updatedTask));
        const isLocalTypingTitle = Date.now() - lastLocalTitleTypeRef.current < 700;
        const isLocalTypingDesc = Date.now() - lastLocalDescTypeRef.current < 700;
        if (!isLocalTypingTitle) {
          setTitle(updatedTask.title);
        }
        if (!isLocalTypingDesc) {
          setDescription(updatedTask.description || '');
        }
        setStatus(updatedTask.status);
        setCustomStatus(updatedTask.customStatus || null);
        setPriority(updatedTask.priority);
        setAssigneeId(updatedTask.assigneeId || null);
        if (updatedTask.cycleId !== undefined) setCycleId(updatedTask.cycleId || null);
        if (updatedTask.estimate !== undefined) setEstimate(updatedTask.estimate || 1);
        if (updatedTask.dueDate !== undefined) {
          setDueDate(updatedTask.dueDate ? new Date(updatedTask.dueDate).toISOString().split('T')[0] : '');
        }
        if (updatedTask.labels) {
          setLabels(updatedTask.labels);
        }
        if (updatedTask.activities) {
          setActivities(updatedTask.activities);
        }
      }
    };

    const handleTaskMoved = (data: { taskId: string; task?: Task; status?: TaskStatus; customStatus?: string | null; priority?: TaskPriority }) => {
      if (data.taskId === taskId) {
        if (data.task) {
          setTask((prev) => (prev ? { ...prev, ...data.task } : data.task!));
          if (data.task.title && document.activeElement !== titleInputRef.current) {
            setTitle(data.task.title);
          }
          if (data.task.description !== undefined && document.activeElement !== descTextareaRef.current) {
            setDescription(data.task.description || '');
          }
        }
        if (data.status) setStatus(data.status);
        if (data.customStatus !== undefined) setCustomStatus(data.customStatus);
        if (data.priority) setPriority(data.priority);
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('task:typing', handleTaskTyping);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('task:typing', handleTaskTyping);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (descTimerRef.current) clearTimeout(descTimerRef.current);
    };
  }, [socket, taskId, user?.id]);

  // Fetch task and context
  useEffect(() => {
    if (!taskId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const fetchedTask = await api.tasks.getById(taskId);
        setTask(fetchedTask);
        setTitle(fetchedTask.title);
        setDescription(fetchedTask.description || '');
        setStatus(fetchedTask.status);
        setCustomStatus(fetchedTask.customStatus || null);
        setPriority(fetchedTask.priority);
        setAssigneeId(fetchedTask.assigneeId || null);
        setProjectId(fetchedTask.projectId);
        setCycleId(fetchedTask.cycleId || null);
        setEstimate(fetchedTask.estimate || 1);
        setDueDate(fetchedTask.dueDate ? new Date(fetchedTask.dueDate).toISOString().split('T')[0] : '');
        setLabels(fetchedTask.labels || []);
        setComments(fetchedTask.comments || []);
        setActivities(fetchedTask.activities || []);

        if (fetchedTask.workspaceId) {
          const [wsDetails, tasksList, wsSections, wsCycles] = await Promise.all([
            api.workspaces.getById(fetchedTask.workspaceId),
            api.tasks.getAll({ workspaceId: fetchedTask.workspaceId }),
            api.workspaces.getSections(fetchedTask.workspaceId).catch(() => []),
            api.cycles.getAll(fetchedTask.workspaceId).catch(() => []),
          ]);
          setMembers(wsDetails.members || []);
          setAllTasks(tasksList);
          setSections(wsSections || []);
          setCycles(wsCycles || []);
        }
      } catch (err) {
        console.error('Failed to load issue:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId]);

  // Debounced auto-save for description & title
  const triggerSave = useCallback(
    async (updates: Partial<Task>) => {
      const currentTaskId = taskRef.current?.id || taskId;
      if (!currentTaskId) return;
      setSaveStatus('saving');
      try {
        const updated = await api.tasks.update(currentTaskId, updates);
        setTask((prev) => (prev ? { ...prev, ...updates, ...(updated || {}) } : null));
        if (updated && Array.isArray(updated.activities)) {
          setActivities(updated.activities);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('idle');
      }
    },
    [taskId],
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    lastLocalTitleTypeRef.current = Date.now();

    const wsId = taskRef.current?.workspaceId || workspace?.id;
    if (socket) {
      socket.emit('task:typing', {
        workspaceId: wsId,
        taskId: taskId,
        field: 'title',
        value: val,
        userId: user?.id,
        userName: user?.name || 'A teammate',
      });
    }

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      if (val.trim() && val.trim() !== taskRef.current?.title) {
        triggerSave({ title: val.trim() });
      }
    }, 600);
  };

  const handleTitleBlur = () => {
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }
    if (taskRef.current && title.trim() && title.trim() !== taskRef.current.title) {
      triggerSave({ title: title.trim() });
    }
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    lastLocalDescTypeRef.current = Date.now();

    const wsId = taskRef.current?.workspaceId || workspace?.id;
    if (socket) {
      socket.emit('task:typing', {
        workspaceId: wsId,
        taskId: taskId,
        field: 'description',
        value: val,
        userId: user?.id,
        userName: user?.name || 'A teammate',
      });
    }

    if (descTimerRef.current) clearTimeout(descTimerRef.current);
    descTimerRef.current = setTimeout(() => {
      if (val !== (taskRef.current?.description || '')) {
        triggerSave({ description: val });
      }
    }, 800);
  };

  const handleDescBlur = () => {
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
    }
    if (taskRef.current && description !== (taskRef.current.description || '')) {
      triggerSave({ description });
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
      const res = await api.uploads.upload(file, taskId);
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

  // Immediate Property Changes
  const handleStatusChange = async (newStatus: TaskStatus, newCustomStatus?: string | null) => {
    const fromLabel = customStatus
      ? sections.find((s) => s.key === customStatus)?.name || customStatus
      : STATUS_CONFIG[status]?.label || status;
    const toLabel = newCustomStatus
      ? sections.find((s) => s.key === newCustomStatus)?.name || newCustomStatus
      : STATUS_CONFIG[newStatus]?.label || newStatus;

    if (fromLabel !== toLabel && task) {
      const optimisticAct: TaskActivity = {
        id: `opt-${Date.now()}`,
        type: 'STATUS_CHANGE',
        fromValue: fromLabel,
        toValue: toLabel,
        details: `moved from ${fromLabel} to ${toLabel}`,
        taskId: task.id,
        userId: user?.id || 'me',
        user: user || { id: 'me', name: 'You', email: '' },
        createdAt: new Date().toISOString(),
      };
      setActivities((prev) => [optimisticAct, ...prev]);
    }

    setStatus(newStatus);
    setCustomStatus(newCustomStatus || null);
    setActiveDropdown(null);
    triggerSave({ status: newStatus, customStatus: newCustomStatus || null });
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setPriority(newPriority);
    setActiveDropdown(null);
    triggerSave({ priority: newPriority });
  };

  const handleAssigneeChange = async (newAssigneeId: string | null) => {
    if (task) {
      const newMember = newAssigneeId ? members.find((m) => m.userId === newAssigneeId) : null;
      const newName = newMember?.user?.name || (newAssigneeId ? 'Someone' : null);
      const optimisticAct: TaskActivity = {
        id: `opt-${Date.now()}`,
        type: 'ASSIGNEE_CHANGE',
        fromValue: assigneeId ? members.find((m) => m.userId === assigneeId)?.user?.name || null : null,
        toValue: newName,
        details: newName ? `re-assigned to ${newName}` : 'unassigned this issue',
        taskId: task.id,
        userId: user?.id || 'me',
        user: user || { id: 'me', name: 'You', email: '' },
        createdAt: new Date().toISOString(),
      };
      setActivities((prev) => [optimisticAct, ...prev]);
    }

    setAssigneeId(newAssigneeId);
    setActiveDropdown(null);
    triggerSave({ assigneeId: newAssigneeId });
  };

  const handleProjectChange = async (newProjectId: string) => {
    setProjectId(newProjectId);
    setActiveDropdown(null);
    triggerSave({ projectId: newProjectId });
  };

  const handleCycleChange = async (newCycleId: string | null) => {
    setCycleId(newCycleId);
    setActiveDropdown(null);
    triggerSave({ cycleId: newCycleId });
  };

  const handleEstimateChange = async (newEstimate: number) => {
    setEstimate(newEstimate);
    setActiveDropdown(null);
    triggerSave({ estimate: newEstimate });
  };

  // Keyboard shortcut listener (Linear style: S for status, P for priority, A for assignee, 0-5 to select)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        setActiveDropdown(null);
        return;
      }

      if (activeDropdown === 'status') {
        if (e.key === '1') {
          e.preventDefault();
          handleStatusChange('BACKLOG');
        } else if (e.key === '2') {
          e.preventDefault();
          handleStatusChange('TODO');
        } else if (e.key === '3') {
          e.preventDefault();
          handleStatusChange('IN_PROGRESS');
        } else if (e.key === '4') {
          e.preventDefault();
          handleStatusChange('DONE');
        } else if (e.key === '5') {
          e.preventDefault();
          handleStatusChange('CANCELED');
        }
        return;
      }

      if (activeDropdown === 'priority') {
        if (e.key === '0') {
          e.preventDefault();
          handlePriorityChange('NO_PRIORITY');
        } else if (e.key === '1') {
          e.preventDefault();
          handlePriorityChange('URGENT');
        } else if (e.key === '2') {
          e.preventDefault();
          handlePriorityChange('HIGH');
        } else if (e.key === '3') {
          e.preventDefault();
          handlePriorityChange('MEDIUM');
        } else if (e.key === '4') {
          e.preventDefault();
          handlePriorityChange('LOW');
        }
        return;
      }

      if (!isInput) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'status' ? null : 'status'));
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'priority' ? null : 'priority'));
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'assignee' ? null : 'assignee'));
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'labels' ? null : 'labels'));
          setLabelSearch('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDropdown, task]);

  const handleDueDateChange = async (newDate: string) => {
    setDueDate(newDate);
    triggerSave({ dueDate: newDate ? new Date(newDate).toISOString() : null });
  };

  const handleRemoveLabel = async (labelToRemove: string) => {
    const updated = labels.filter((l) => l !== labelToRemove);
    setLabels(updated);
    triggerSave({ labels: updated });
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    try {
      await api.tasks.delete(task.id);
      router.push('/');
    } catch (err) {
      console.error(err);
    }
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

      // Linear behavior: automatically move to In Progress when developer copies branch name!
      if (status !== 'IN_PROGRESS' || customStatus) {
        handleStatusChange('IN_PROGRESS', null);
      }
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

  // Update Project Prefix Key (e.g. TJAR)
  const handleUpdatePrefix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = newPrefix.trim().toUpperCase();
    if (!cleanKey || !activeProject) return;
    setUpdatingPrefix(true);
    try {
      await api.projects.update(activeProject.id, { key: cleanKey });

      // Update current task identifier in memory
      setTask((prev) => {
        if (!prev) return null;
        let suffix = '1';
        const match = prev.identifier.match(/-(\d+)$/);
        if (match) suffix = match[1];
        return {
          ...prev,
          identifier: `${cleanKey}-${suffix}`,
          project: prev.project ? { ...prev.project, key: cleanKey } : undefined,
        };
      });

      // Update all tasks belonging to this project in memory
      setAllTasks((prev) =>
        prev.map((t) => {
          if (t.projectId === activeProject.id) {
            let s = '1';
            const m = t.identifier.match(/-(\d+)$/);
            if (m) s = m[1];
            return { ...t, identifier: `${cleanKey}-${s}` };
          }
          return t;
        }),
      );

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
    if (!newCommentText.trim() || submittingComment || !task) return;

    setSubmittingComment(true);
    const content = newCommentText.trim();

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
      setComments((prev) => prev.map((c) => (c.id === tempComment.id ? serverComment : c)));
    } catch (err) {
      console.error('Failed to post comment:', err);
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await api.tasks.deleteComment(task.id, commentId);
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-foreground flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Issue not found</h2>
        <p className="text-xs text-muted-foreground mb-4">The issue may have been removed or moved.</p>
        <Link href="/">
          <Button variant="linear" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Issues
          </Button>
        </Link>
      </div>
    );
  }

  const currentIndex = allTasks.findIndex((t) => t.id === task.id);
  const totalTasks = allTasks.length;

  const handlePrevTask = () => {
    if (currentIndex > 0) {
      router.push(`/issue/${allTasks[currentIndex - 1].id}`);
    }
  };

  const handleNextTask = () => {
    if (currentIndex < totalTasks - 1) {
      router.push(`/issue/${allTasks[currentIndex + 1].id}`);
    }
  };

  const activeProject = projects.find((p) => p.id === projectId) || task.project;
  const currentAssignee = members.find((m) => m.userId === assigneeId)?.user || task.assignee;

  return (
    <div className="min-h-screen bg-[#090a0f] text-foreground flex flex-col font-sans select-text">
      {/* Top Header Bar matching user's screenshot */}
      <header className="sticky top-0 z-40 w-full h-12 flex items-center justify-between px-4 sm:px-8 border-b border-border/60 bg-[#090a0f]/95 backdrop-blur-md select-none shrink-0">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
          <Link
            href="/"
            className="flex items-center gap-1.5 shrink-0 text-zinc-300 hover:text-white font-medium transition-colors"
          >
            <span className="w-4 h-4 rounded bg-[#5e6ad2] text-[10px] text-white flex items-center justify-center font-bold">
              {workspace?.name?.[0] || 'L'}
            </span>
            <span>{workspace?.name || 'Workspace'}</span>
          </Link>

          <span>›</span>

          <Link href="/" className="shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors">
            Issues
          </Link>

          <span>›</span>

          {task.parent && (
            <>
              <Link
                href={`/issue/${task.parent.id}`}
                className="shrink-0 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-mono text-xs max-w-[160px] truncate"
                title={task.parent.title}
              >
                <GitFork className="w-3 h-3 text-indigo-400 rotate-180 shrink-0" />
                <span className="truncate">{task.parent.identifier}</span>
              </Link>
              <span>›</span>
            </>
          )}

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

          <span className="text-zinc-500 hidden md:inline truncate max-w-[340px]">
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

        {/* Right: Auto-save status, Navigation, Actions & Back */}
        <div className="flex items-center gap-2.5 shrink-0 text-xs text-muted-foreground">
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

          {/* Real-time Auto-save feedback */}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400 mr-2 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 mr-2">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Saved</span>
            </span>
          )}

          {/* Live Typing Indicator in Header */}
          {typingIndicator && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-400 mr-2 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block" />
              <span>{typingIndicator.userName} is typing...</span>
            </span>
          )}

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
            className="p-1.5 rounded hover:bg-secondary text-zinc-400 hover:text-white transition-colors"
            title="Copy link"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="p-1.5 rounded hover:bg-destructive/15 text-zinc-500 hover:text-destructive transition-colors"
            title="Delete issue"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <Link
            href="/"
            className="p-1.5 rounded hover:bg-secondary text-zinc-400 hover:text-white transition-colors ml-1"
            title="Back to board (Esc)"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Archived / Trash Banner */}
      {task.isArchived && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-red-300 shrink-0">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>This issue is archived in the trash bin.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const restored = await api.tasks.restore(task.id);
                setTask((prev) => (prev ? { ...prev, isArchived: false, deletedAt: null } : null));
              }}
              className="h-6 text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Issue</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                const ok = window.confirm(`Permanently remove ${task.identifier}? This cannot be undone.`);
                if (!ok) return;
                await api.tasks.permanentDelete(task.id);
                router.push('/');
              }}
              className="h-6 text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Permanently</span>
            </Button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2.5 flex items-center justify-between text-xs text-destructive shrink-0">
          <span>Delete {task.identifier}: Move to trash or remove permanently?</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteTask}
              className="h-6 text-xs border-destructive/30 hover:bg-destructive/15 text-destructive"
            >
              Move to Trash
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                const ok = window.confirm(`Permanently remove ${task.identifier}? This cannot be undone.`);
                if (!ok) return;
                await api.tasks.permanentDelete(task.id);
                router.push('/');
              }}
              className="h-6 text-xs"
            >
              Delete Permanently
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

      {/* Main Content matching Linear's second screenshot */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 gap-10">
        {/* Left Column: Title & Document Body */}
        <div className="flex-1 space-y-6">
          {/* Issue Title (Click anywhere to edit!) */}
          <div className="relative">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-0 border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none text-foreground py-1 transition-all rounded"
              placeholder="Issue title..."
              title="Click directly to edit title"
            />
            {typingIndicator && typingIndicator.field === 'title' && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-400 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-ping" />
                <span>{typingIndicator.userName} is editing title...</span>
              </div>
            )}
          </div>

          {/* Sub-issue / Parent link banner (Like Linear screenshot) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className="text-zinc-500">Project:</span>
            <span className="font-medium text-zinc-300">{activeProject?.name || 'General'}</span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-[11px] text-zinc-500">{task.identifier}</span>

            {task.parent && (
              <>
                <span className="text-zinc-600">•</span>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161726] border border-[#2b2c3d] text-zinc-300">
                  <GitFork className="w-3 h-3 text-indigo-400 rotate-180" />
                  <span className="text-zinc-500 text-[11px]">Sub-issue of</span>
                  <Link
                    href={`/issue/${task.parent.id}`}
                    className="font-medium text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span className="font-mono text-zinc-400 text-[11px]">{task.parent.identifier}</span>
                    <span className="truncate max-w-[200px]">{task.parent.title}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.tasks.update(task.id, { parentId: null });
                      setTask((prev) => (prev ? { ...prev, parentId: null, parent: null } : null));
                    }}
                    className="p-0.5 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                    title="Remove from parent issue"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Description Section (Seamless document editor with Markdown toolbar & Preview) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Description:</span>
                {typingIndicator && typingIndicator.field === 'description' && (
                  <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-normal animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-ping" />
                    {typingIndicator.userName} is typing...
                  </span>
                )}
                <div className="flex items-center gap-1 bg-[#141522] p-0.5 rounded border border-border/50">
                  <button
                    type="button"
                    onClick={() => {
                      const text = description ? `${description} **bold**` : '**bold**';
                      setDescription(text);
                      triggerSave({ description: text });
                    }}
                    className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-[11px]"
                    title="Bold (**text**)"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = description ? `${description} *italic*` : '*italic*';
                      setDescription(text);
                      triggerSave({ description: text });
                    }}
                    className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white italic text-[11px]"
                    title="Italic (*text*)"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = description ? `${description}\n\`code\`` : '`code`';
                      setDescription(text);
                      triggerSave({ description: text });
                    }}
                    className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-[10px]"
                    title="Inline Code"
                  >
                    &lt;/&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = description ? `${description}\n- ` : '- ';
                      setDescription(text);
                      triggerSave({ description: text });
                    }}
                    className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px]"
                    title="Bullet List"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = description ? `${description} @` : '@';
                      setDescription(text);
                    }}
                    className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-indigo-400 hover:text-indigo-300 text-[11px] font-bold"
                    title="Mention team member"
                  >
                    @
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 font-normal">
                  Auto-saves
                </span>
              </div>
            </div>

            <LinearRichEditor
              value={description}
              onChange={(val) => {
                setDescription(val);
                handleDescChange(val);
              }}
              onBlur={handleDescBlur}
              taskId={taskId}
              members={members}
              onImageClick={(url) => setLightboxUrl(url)}
              placeholder="Add description, requirements, bullet points, or context... (Paste images directly here)"
            />
          </div>

          {/* Quick relation icons matching Linear screenshot right below description */}
          <div className="flex items-center gap-2 pt-1 pb-1 text-zinc-500">
            <button
              type="button"
              onClick={() => subIssuesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="p-1.5 rounded hover:bg-[#1a1b26] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Jump to Sub-issues"
            >
              <GitFork className="w-4 h-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => relatedIssuesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="p-1.5 rounded hover:bg-[#1a1b26] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Jump to Related issues"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-issues Section (exact layout from screenshot) */}
          <div ref={subIssuesRef}>
            <SubIssuesSection
              parentTask={task}
              subTasks={task.subTasks || []}
              members={members}
              allTasks={allTasks}
              onSubTasksChange={(updatedSubTasks) => {
                setTask((prev) => (prev ? { ...prev, subTasks: updatedSubTasks } : null));
              }}
            />
          </div>

          {/* Related Issues Section */}
          <div ref={relatedIssuesRef}>
            <RelatedIssuesSection
              task={task}
              allTasks={allTasks}
              onTaskChange={(updatedTask) => {
                setTask(updatedTask);
              }}
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 pt-6 border-t border-border/40">
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
                setTask((prev) => (prev ? { ...prev, attachments: updatedAttachments } : null));
              }}
              onDeleteSuccess={(id) => {
                const updatedAttachments = (task.attachments || []).filter((a) => a.id !== id);
                setTask((prev) => (prev ? { ...prev, attachments: updatedAttachments } : null));
              }}
            />
          </div>

          {/* Activity & Comments Stream */}
          <div className="space-y-4 pt-8 border-t border-border/40">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Activity & Comments ({comments.length + activities.length})</span>
            </div>

            {/* Activities Timeline */}
            {activities.length > 0 && (
              <div className="relative pl-7 space-y-4 py-2 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1px] before:bg-[#2b2c3a]">
                {activities.map((act) => {
                  const initials = (act.user?.name || 'User')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div key={act.id} className="relative flex items-center gap-2.5 text-xs text-zinc-300">
                      {/* Left timeline circle / icon */}
                      <div className="absolute -left-7 w-[23px] h-[23px] rounded-full flex items-center justify-center shrink-0 z-10 bg-[#090a0f]">
                        {act.type === 'STATUS_CHANGE' ? (
                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30">
                            <Clock className="w-2.5 h-2.5" />
                          </div>
                        ) : act.type === 'ASSIGNEE_CHANGE' ? (
                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-sky-500 text-white font-bold text-[8px] ring-1 ring-sky-400/30">
                            {initials}
                          </div>
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
                            <GitBranch className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {/* Timeline message matching user's screenshot */}
                      <div className="leading-snug truncate">
                        <span className="font-medium text-zinc-100">{act.user?.name || 'Someone'}</span>{' '}
                        <span className="text-zinc-400">{act.details}</span>{' '}
                        <span className="text-zinc-600">•</span>{' '}
                        <span className="text-zinc-500 text-[11px]">{formatTimeAgo(act.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 && activities.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-600">
                  No activity or comments yet.
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-[#11121c]/70 border border-border/40 hover:border-border transition-colors group relative"
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
                      </div>

                      <div className="mt-1.5 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {renderCommentContentWithMentions(c.content, members)}
                      </div>
                    </div>

                    {c.userId === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-zinc-500 hover:text-destructive transition-all"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
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
                className="flex items-start gap-3 p-3.5 rounded-lg bg-[#12131e] border border-border/70 focus-within:border-primary/80 transition-colors"
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

        {/* Right Column: Properties Sidebar (Exact layout from Linear second screenshot) */}
        <div className="w-full lg:w-64 space-y-6 shrink-0 select-none pt-2">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Properties
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Status Row */}
            <div className="property-dropdown-container relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left"
              >
                {(() => {
                  const currentCustomSection = customStatus
                    ? sections.find((s) => s.key === customStatus)
                    : null;
                  return (
                    <div className="flex items-center gap-2.5">
                      <StatusIcon
                        status={currentCustomSection ? currentCustomSection.name : status}
                        color={currentCustomSection?.color}
                      />
                      <span className="text-zinc-200 font-medium group-hover:text-white truncate">
                        {currentCustomSection
                          ? currentCustomSection.name
                          : STATUS_CONFIG[status]?.label || status}
                      </span>
                    </div>
                  );
                })()}
              </button>

              {activeDropdown === 'status' && (
                <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                    <span>Change status...</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                      S
                    </kbd>
                  </div>
                  {[
                    { s: 'BACKLOG' as TaskStatus, label: 'Backlog', shortcut: '1' },
                    { s: 'TODO' as TaskStatus, label: 'Todo', shortcut: '2' },
                    { s: 'IN_PROGRESS' as TaskStatus, label: 'In Progress', shortcut: '3' },
                    { s: 'DONE' as TaskStatus, label: 'Done', shortcut: '4' },
                    { s: 'CANCELED' as TaskStatus, label: 'Canceled', shortcut: '5' },
                  ].map((item) => (
                    <button
                      key={item.s}
                      onClick={() => handleStatusChange(item.s, null)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                        item.s === status && !customStatus
                          ? 'bg-[#282a38] text-white font-medium'
                          : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StatusIcon status={item.s} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.s === status && !customStatus && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                        <span className="text-[11px] font-mono text-zinc-500">{item.shortcut}</span>
                      </div>
                    </button>
                  ))}

                  {sections.length > 0 && (
                    <>
                      <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-500 border-t border-[#2b2c3a]/70 mt-1 pt-1.5">
                        Custom Sections
                      </div>
                      {sections.map((sec) => (
                        <button
                          key={sec.id}
                          onClick={() => handleStatusChange(sec.category || 'IN_PROGRESS', sec.key)}
                          className={cn(
                            'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                            customStatus === sec.key
                              ? 'bg-[#282a38] text-white font-medium'
                              : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <StatusIcon status={sec.name} color={sec.color} />
                            <span className="truncate">{sec.name}</span>
                          </div>
                          {customStatus === sec.key && (
                            <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Workspace / Team Info (Matching screenshot: [T] Tjar) */}
            <div className="py-1.5 px-2.5 flex items-center gap-2.5 rounded-lg text-zinc-300">
              <span className="w-4 h-4 rounded bg-[#5e6ad2] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                {workspace?.name?.[0] || 'T'}
              </span>
              <span className="font-medium text-zinc-300 truncate">
                {workspace?.name || 'Workspace'}
              </span>
            </div>

            {/* Parent Issue Property Row */}
            <div className="property-dropdown-container relative">
              {task.parent ? (
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#151624] border border-[#2b2c3d] text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <GitFork className="w-3.5 h-3.5 text-indigo-400 rotate-180 shrink-0" />
                    <Link
                      href={`/issue/${task.parent.id}`}
                      className="text-zinc-200 hover:text-white truncate font-medium"
                      title={task.parent.title}
                    >
                      <span className="font-mono text-zinc-400 mr-1.5">{task.parent.identifier}</span>
                      <span>{task.parent.title}</span>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.tasks.update(task.id, { parentId: null });
                      setTask((prev) => (prev ? { ...prev, parentId: null, parent: null } : null));
                    }}
                    className="p-1 rounded hover:bg-rose-500/15 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Unlink parent"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowParentPicker(!showParentPicker)}
                    className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-200">
                      <GitFork className="w-3.5 h-3.5 rotate-180" />
                      <span>Set parent issue...</span>
                    </div>
                  </button>

                  {showParentPicker && (
                    <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2" />
                        <input
                          type="text"
                          autoFocus
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          placeholder="Search parent issue..."
                          className="w-full bg-[#12131d] text-xs text-white placeholder:text-zinc-500 pl-7 pr-2.5 py-1 rounded border border-[#2b2c3a] focus:outline-none"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {allTasks
                          .filter(
                            (t) =>
                              t.id !== task.id &&
                              t.parentId !== task.id &&
                              (parentSearch.trim() === '' ||
                                t.title.toLowerCase().includes(parentSearch.toLowerCase()) ||
                                t.identifier.toLowerCase().includes(parentSearch.toLowerCase())),
                          )
                          .slice(0, 5)
                          .map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={async () => {
                                const updated = await api.tasks.update(task.id, { parentId: t.id });
                                setTask((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        parentId: t.id,
                                        parent: {
                                          id: t.id,
                                          identifier: t.identifier,
                                          title: t.title,
                                          status: t.status,
                                        },
                                      }
                                    : null,
                                );
                                setShowParentPicker(false);
                                setParentSearch('');
                              }}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#20212f] text-left text-xs text-zinc-300 hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                                <span className="font-mono text-[11px] text-zinc-400">{t.identifier}</span>
                                <span className="truncate">{t.title}</span>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Priority Row (Matching screenshot: ··· Set priority) */}
            <div className="property-dropdown-container relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <PriorityIcon priority={priority} />
                  <span className="text-zinc-300 font-medium group-hover:text-white">
                    {priority === 'NO_PRIORITY' ? '··· Set priority' : PRIORITY_CONFIG[priority].label}
                  </span>
                </div>
              </button>

              {activeDropdown === 'priority' && (
                <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                    <span>Set priority to...</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                      P
                    </kbd>
                  </div>
                  {[
                    { p: 'NO_PRIORITY' as TaskPriority, label: 'No priority', shortcut: '0' },
                    { p: 'URGENT' as TaskPriority, label: 'Urgent', shortcut: '1' },
                    { p: 'HIGH' as TaskPriority, label: 'High', shortcut: '2' },
                    { p: 'MEDIUM' as TaskPriority, label: 'Medium', shortcut: '3' },
                    { p: 'LOW' as TaskPriority, label: 'Low', shortcut: '4' },
                  ].map((item) => (
                    <button
                      key={item.p}
                      onClick={() => handlePriorityChange(item.p)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                        item.p === priority
                          ? 'bg-[#282a38] text-white font-medium'
                          : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PriorityIcon priority={item.p} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.p === priority && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                        <span className="text-[11px] font-mono text-zinc-500">{item.shortcut}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assignee Row */}
            <div className="property-dropdown-container relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'assignee' ? null : 'assignee')}
                className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  {currentAssignee ? (
                    <>
                      <img
                        src={
                          currentAssignee.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            currentAssignee.name,
                          )}`
                        }
                        alt=""
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                      />
                      <span className="text-zinc-300 font-medium group-hover:text-white truncate">
                        {currentAssignee.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-zinc-500">··· Assign</span>
                    </>
                  )}
                </div>
              </button>

              {activeDropdown === 'assignee' && (
                <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                    <span>Assign to...</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                      A
                    </kbd>
                  </div>
                  <button
                    onClick={() => handleAssigneeChange(null)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                      assigneeId === null
                        ? 'bg-[#282a38] text-white font-medium'
                        : 'text-zinc-400 hover:bg-[#232432] hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Unassigned</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {assigneeId === null && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      <span className="text-[11px] font-mono text-zinc-500">-</span>
                    </div>
                  </button>
                  {members.map((m, idx) => (
                    <button
                      key={m.userId}
                      onClick={() => handleAssigneeChange(m.userId)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                        m.userId === assigneeId
                          ? 'bg-[#282a38] text-white font-medium'
                          : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        <img
                          src={
                            m.user.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              m.user.name,
                            )}`
                          }
                          alt=""
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="truncate">{m.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.userId === assigneeId && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                        <span className="text-[11px] font-mono text-zinc-500">{idx + 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Labels Section */}
          <div className="space-y-2 pt-4 border-t border-border/40 property-dropdown-container relative">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Labels
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(activeDropdown === 'labels' ? null : 'labels');
                  setLabelSearch('');
                }}
                className="text-[11px] text-zinc-400 hover:text-white hover:bg-secondary/70 rounded px-1.5 py-0.5 transition-colors flex items-center gap-1"
                title="Add or manage labels (L)"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Attached Labels List */}
            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[#1a1b28] text-zinc-200 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getLabelColor(lbl) }}
                  />
                  <span>{lbl}</span>
                  <button
                    onClick={() => handleRemoveLabel(lbl)}
                    className="hover:text-destructive text-zinc-500 hover:text-white transition-colors ml-0.5"
                    title="Remove label"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(activeDropdown === 'labels' ? null : 'labels');
                  setLabelSearch('');
                }}
                className="w-6 h-6 rounded-md border border-dashed border-zinc-700/80 hover:border-zinc-500 hover:bg-secondary/40 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                title="Add label (L)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Linear Labels Dropdown Menu with Search and All Existing Labels */}
            {activeDropdown === 'labels' && (
              <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100 max-h-72 overflow-hidden flex flex-col">
                {/* Search Bar with L badge */}
                <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[#2b2c3a]/70 mb-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
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
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60 shrink-0">
                    L
                  </kbd>
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

          {/* Project Section */}
          <div className="space-y-1.5 pt-4 border-t border-border/40 property-dropdown-container relative">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Project</span>
              {activeProject && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPrefix(activeProject.key);
                    setShowPrefixModal(true);
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/20 transition-colors"
                  title="Change project prefix key (e.g. TJAR)"
                >
                  <span className="font-bold">{activeProject.key}</span>
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'project' ? null : 'project')}
              className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-300 font-medium group-hover:text-white">
                  {activeProject?.name || '+ Add to project'}
                </span>
              </div>
            </button>

            {activeDropdown === 'project' && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                  <span>Move to project...</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                    M
                  </kbd>
                </div>
                {projects.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => handleProjectChange(p.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                      p.id === projectId
                        ? 'bg-[#282a38] text-white font-medium'
                        : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#5e6ad2' }}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {p.id === projectId && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      <span className="text-[10px] font-mono text-zinc-500">{idx + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due Date Section */}
          <div className="space-y-1.5 pt-4 border-t border-border/40 text-xs">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Due Date
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="w-full bg-[#141522] hover:bg-[#181a2b] border border-border/70 rounded-md px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors"
            />
          </div>

          {/* Cycle (Sprint) Property Row */}
          <div className="space-y-1.5 pt-4 border-t border-border/40 property-dropdown-container relative">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Cycle (Sprint)
            </div>

            {(() => {
              const activeCycleObj = cycles.find((c) => c.id === cycleId) || task.cycle;
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'cycle' ? null : 'cycle')}
                    className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-zinc-300 font-medium group-hover:text-white truncate">
                        {activeCycleObj?.name || '··· No Cycle'}
                      </span>
                    </div>
                  </button>

                  {activeDropdown === 'cycle' && (
                    <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                      <div className="px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                        Select Cycle (Sprint)...
                      </div>
                      <button
                        onClick={() => handleCycleChange(null)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                          cycleId === null
                            ? 'bg-[#282a38] text-white font-medium'
                            : 'text-zinc-400 hover:bg-[#232432] hover:text-white',
                        )}
                      >
                        <span>No Cycle</span>
                        {cycleId === null && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      </button>
                      {cycles.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleCycleChange(c.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                            c.id === cycleId
                              ? 'bg-[#282a38] text-white font-medium'
                              : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                c.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-indigo-400'
                              }`}
                            />
                            <span className="truncate">{c.name}</span>
                          </div>
                          {c.id === cycleId && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Estimate (Story Points) Property Row */}
          <div className="space-y-1.5 pt-4 border-t border-border/40 property-dropdown-container relative">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Estimate
            </div>

            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'estimate' ? null : 'estimate')}
              className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-zinc-300 font-medium group-hover:text-white">
                  {estimate ? `${estimate} points` : '··· Estimate'}
                </span>
              </div>
            </button>

            {activeDropdown === 'estimate' && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                  Story Points Estimate
                </div>
                {[
                  { pts: 1, label: '1 point (Small)' },
                  { pts: 2, label: '2 points' },
                  { pts: 3, label: '3 points (Medium)' },
                  { pts: 5, label: '5 points (Large)' },
                  { pts: 8, label: '8 points (XL)' },
                  { pts: 13, label: '13 points (Epic)' },
                ].map((item) => (
                  <button
                    key={item.pts}
                    onClick={() => handleEstimateChange(item.pts)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                      estimate === item.pts
                        ? 'bg-[#282a38] text-white font-medium'
                        : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                    )}
                  >
                    <span>{item.label}</span>
                    {estimate === item.pts && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Creator Info */}
          <div className="pt-4 border-t border-border/40 text-xs space-y-1">
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
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
  );
}

export default function IssuePage() {
  return (
    <AuthProvider>
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <IssueDetailContent />
      </React.Suspense>
    </AuthProvider>
  );
}
