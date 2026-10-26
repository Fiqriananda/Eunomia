'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { AuthScreen } from '../components/auth/AuthScreen';
import { Navbar } from '../components/linear/Navbar';
import { BoardView } from '../components/linear/BoardView';
import { ListView } from '../components/linear/ListView';
import { CreateTaskModal } from '../components/linear/CreateTaskModal';
import { CommandMenu } from '../components/linear/CommandMenu';
import { Sidebar } from '../components/linear/Sidebar';
import { InviteMemberModal } from '../components/linear/InviteMemberModal';
import { WorkspaceSettingsModal } from '../components/linear/WorkspaceSettingsModal';
import { InboxView } from '../components/linear/InboxView';
import { CyclesView } from '../components/linear/CyclesView';
import { TrashView } from '../components/linear/TrashView';
import { TeamView } from '../components/linear/TeamView';
import { TriageView } from '../components/linear/TriageView';
import { StakeholderRequestsView } from '../components/linear/StakeholderRequestsView';
import { CreateIntakeModal } from '../components/linear/CreateIntakeModal';
import { Task, TaskPriority, TaskStatus, WorkflowSection, Cycle, Division } from '../types';
import { api } from '../lib/api';
import { Loader2, Plus, SlidersHorizontal, Filter, X, Sparkles, UserPlus, RotateCw, Trash2, Layers, Inbox, Users, Menu, GitPullRequest } from 'lucide-react';
import { Button } from '../components/ui/button';

function Dashboard() {
  const router = useRouter();
  const { user, workspace, project, projects, loading, refreshWorkspacesAndProjects } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [sections, setSections] = useState<WorkflowSection[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  // Divisions & Intake Triage state
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [filterDivision, setFilterDivision] = useState<string>('ALL');
  const [triageCount, setTriageCount] = useState<number>(0);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  // Cycles & Trash state
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [filterCycle, setFilterCycle] = useState<string>('ALL');
  const [trashCount, setTrashCount] = useState<number>(0);

  // View & Tab state
  const [sidebarTab, setSidebarTab] = useState<'all' | 'active' | 'backlog' | 'inbox' | 'cycles' | 'trash' | 'team' | 'triage' | 'requests'>('all');
  const [viewMode, setViewMode] = useState<'board-priority' | 'board-status' | 'list'>('board-status');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Fallback to 'all' if user was on 'cycles' tab and cycles got disabled
  useEffect(() => {
    if (workspace?.cyclesEnabled === false && sidebarTab === 'cycles') {
      setSidebarTab('all');
    }
  }, [workspace?.cyclesEnabled, sidebarTab]);

  // Default stakeholders to their dedicated cross-division requests tab
  useEffect(() => {
    if (workspace?.role === 'STAKEHOLDER' && (sidebarTab === 'all' || sidebarTab === 'active' || sidebarTab === 'backlog')) {
      setSidebarTab('requests');
    }
  }, [workspace?.role]);

  // Group default for new task modal
  const [createDefaultPriority, setCreateDefaultPriority] = useState<TaskPriority>('NO_PRIORITY');
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>('TODO');

  const fetchTasks = useCallback(async () => {
    if (!workspace) return;
    setTasksLoading(true);
    try {
      const res = await api.tasks.getAll({
        workspaceId: workspace.id,
        projectId: project ? project.id : undefined,
        archived: false,
      });
      setTasks(res);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [workspace, project]);

  const fetchDivisions = useCallback(async () => {
    if (!workspace) return;
    try {
      const res = await api.workspaces.getDivisions(workspace.id);
      setDivisions(res);
    } catch (err) {
      console.error('Failed to load divisions:', err);
    }
  }, [workspace]);

  const fetchTriageCount = useCallback(async () => {
    if (!workspace) return;
    try {
      const res = await api.tasks.getTriageRequests(workspace.id);
      setTriageCount(res.length);
    } catch (err) {
      // Silently handle
    }
  }, [workspace]);

  const fetchSections = useCallback(async () => {
    if (!workspace) return;
    try {
      const res = await api.workspaces.getSections(workspace.id);
      setSections(res);
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  }, [workspace]);

  const fetchCycles = useCallback(async () => {
    if (!workspace) return;
    try {
      const res = await api.cycles.getAll(workspace.id);
      setCycles(res);
      const active = res.find((c) => c.status === 'ACTIVE') || res[0] || null;
      setActiveCycle(active);
    } catch (err) {
      console.error('Failed to load cycles:', err);
    }
  }, [workspace]);

  const fetchTrashCount = useCallback(async () => {
    if (!workspace) return;
    try {
      const archived = await api.tasks.getAll({
        workspaceId: workspace.id,
        archived: true,
      });
      setTrashCount(archived.length);
    } catch (err) {
      // Silently handle
    }
  }, [workspace]);

  useEffect(() => {
    if (workspace) {
      fetchTasks();
      fetchDivisions();
      fetchTriageCount();
      fetchSections();
      fetchCycles();
      fetchTrashCount();
      if (workspace.columnOrder && workspace.columnOrder.length > 0) {
        setColumnOrder(workspace.columnOrder);
      }
    }
  }, [workspace, project, fetchTasks, fetchDivisions, fetchTriageCount, fetchSections, fetchCycles, fetchTrashCount]);

  // Real-time WebSockets listeners for live collaboration
  useEffect(() => {
    if (!socket || !workspace) return;

    // Task Moved: update card position and order live on all peers
    const handleTaskMoved = (data: {
      taskId: string;
      status?: TaskStatus;
      customStatus?: string | null;
      priority?: TaskPriority;
      targetOrder?: number;
      task?: Task;
    }) => {
      setTasks((current) =>
        current.map((t) => {
          if (t.id === data.taskId) {
            return data.task
              ? data.task
              : {
                  ...t,
                  status: data.status !== undefined ? data.status : t.status,
                  customStatus:
                    data.customStatus !== undefined ? data.customStatus : t.customStatus,
                  priority: data.priority !== undefined ? data.priority : t.priority,
                  order: data.targetOrder !== undefined ? data.targetOrder : t.order,
                };
          }
          return t;
        }),
      );
    };

    // Task Created: display live
    const handleTaskCreated = (newTask: Task) => {
      if (newTask.workspaceId === workspace.id && !newTask.isArchived) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      }
    };

    // Task Updated: update in place live
    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.workspaceId === workspace.id) {
        if (updatedTask.isArchived) {
          setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
          setTrashCount((c) => c + 1);
        } else {
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          );
        }
      }
    };

    // Task Archived (Soft Deleted): remove from active board live
    const handleTaskArchived = (data: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
      setTrashCount((c) => c + 1);
    };

    // Task Restored: add back to active board live
    const handleTaskRestored = (restoredTask: Task) => {
      if (restoredTask.workspaceId === workspace.id) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === restoredTask.id)) return prev;
          return [restoredTask, ...prev];
        });
        setTrashCount((c) => Math.max(0, c - 1));
      }
    };

    // Task Permanently Deleted
    const handleTaskDeleted = (data: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
      setTrashCount((c) => Math.max(0, c - 1));
    };

    // Inbox Notification: increment badge live
    const handleNotification = () => {
      setUnreadInboxCount((prev) => prev + 1);
    };

    // Triage request updates
    const handleTriageUpdated = () => {
      fetchTriageCount();
      fetchTasks();
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:archived', handleTaskArchived);
    socket.on('task:restored', handleTaskRestored);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('notification', handleNotification);
    socket.on('triage:new', handleTriageUpdated);
    socket.on('triage:updated', handleTriageUpdated);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:archived', handleTaskArchived);
      socket.off('task:restored', handleTaskRestored);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('notification', handleNotification);
      socket.off('triage:new', handleTriageUpdated);
      socket.off('triage:updated', handleTriageUpdated);
    };
  }, [socket, workspace, fetchTriageCount, fetchTasks]);

  // Fetch and poll unread inbox notifications
  useEffect(() => {
    if (!user) return;
    const loadUnreadCount = async () => {
      try {
        const res = await api.inbox.get(true);
        setUnreadInboxCount(res.unreadCount || 0);
      } catch (err) {
        // Silently handle if not logged in
      }
    };
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync tab from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'inbox' ||
        tabParam === 'cycles' ||
        tabParam === 'trash' ||
        tabParam === 'triage' ||
        tabParam === 'requests'
      ) {
        setSidebarTab(tabParam as any);
      }
    }
  }, []);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if ((e.key === 'c' || e.key === 'C') && !isInput && !isCreateOpen && !isCommandOpen) {
        e.preventDefault();
        setIsCreateOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateOpen, isCommandOpen]);

  // Column Order Reordering Handler
  const handleUpdateColumnOrder = async (newOrder: string[]) => {
    setColumnOrder(newOrder);
    if (!workspace) return;
    try {
      await api.workspaces.updateColumnOrder(workspace.id, newOrder);
    } catch (err) {
      console.error('Failed to update column order:', err);
    }
  };

  // Section Creation & Deletion Handlers
  const handleCreateSection = async (
    name: string,
    color?: string,
    category?: TaskStatus,
    positionPlacement?: string,
  ) => {
    if (!workspace) return;
    const newSec = await api.workspaces.createSection(workspace.id, { name, color, category });
    setSections((prev) => [...prev, newSec]);

    // Calculate updated column order
    const defaultCols = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];
    const currentCols = columnOrder && columnOrder.length > 0
      ? [...columnOrder]
      : [...defaultCols, ...sections.map((s) => s.key)];

    // Insert new section key at specified position
    let targetIdx = -1;
    if (positionPlacement === 'after_IN_PROGRESS') {
      const idx = currentCols.indexOf('IN_PROGRESS');
      if (idx !== -1) targetIdx = idx + 1;
    } else if (positionPlacement === 'after_TODO') {
      const idx = currentCols.indexOf('TODO');
      if (idx !== -1) targetIdx = idx + 1;
    } else if (positionPlacement === 'after_BACKLOG') {
      const idx = currentCols.indexOf('BACKLOG');
      if (idx !== -1) targetIdx = idx + 1;
    } else if (positionPlacement === 'before_DONE') {
      const idx = currentCols.indexOf('DONE');
      if (idx !== -1) targetIdx = idx;
    }

    let updatedCols: string[];
    if (targetIdx !== -1) {
      updatedCols = [
        ...currentCols.slice(0, targetIdx),
        newSec.key,
        ...currentCols.slice(targetIdx).filter((k) => k !== newSec.key),
      ];
    } else {
      updatedCols = [...currentCols.filter((k) => k !== newSec.key), newSec.key];
    }

    handleUpdateColumnOrder(updatedCols);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!workspace) return;
    const toDelete = sections.find((s) => s.id === sectionId);
    await api.workspaces.deleteSection(workspace.id, sectionId);
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (toDelete) {
      const updatedCols = columnOrder.filter((k) => k !== toDelete.key);
      handleUpdateColumnOrder(updatedCols);
    }
    fetchTasks();
  };

  // Optimistic Move Handler for Drag & Drop
  const handleTaskMove = async (
    taskId: string,
    updates: {
      priority?: TaskPriority;
      status?: TaskStatus;
      customStatus?: string | null;
      targetOrder?: number;
    },
  ) => {
    const previousTasks = [...tasks];

    setTasks((current) =>
      current.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            priority: updates.priority !== undefined ? updates.priority : t.priority,
            status: updates.status !== undefined ? updates.status : t.status,
            customStatus:
              updates.customStatus !== undefined ? updates.customStatus : t.customStatus,
            order: updates.targetOrder !== undefined ? updates.targetOrder : t.order,
          };
        }
        return t;
      }),
    );

    try {
      const updated = await api.tasks.move(taskId, updates);
      setTasks((current) => current.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Failed to move task:', err);
      setTasks(previousTasks);
    }
  };

  // Navigates directly to the dedicated detail page without any popup!
  const handleTaskClick = (task: Task) => {
    router.push(`/issue/${task.id}`);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    );

    try {
      const updated = await api.tasks.update(taskId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        customStatus: updates.customStatus,
        priority: updates.priority,
        assigneeId: updates.assigneeId,
        dueDate: updates.dueDate,
        labels: updates.labels,
      });
      setTasks((current) => current.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Failed to update task:', err);
      fetchTasks();
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    projectId: string;
    status: TaskStatus;
    customStatus?: string | null;
    priority: TaskPriority;
    assigneeId?: string;
    labels?: string[];
    parentId?: string | null;
    cycleId?: string | null;
    estimate?: number;
  }) => {
    if (!workspace) return;
    const newTask = await api.tasks.create({
      ...taskData,
      workspaceId: workspace.id,
    });
    setTasks((prev) => {
      if (prev.some((t) => t.id === newTask.id)) return prev;
      return [newTask, ...prev];
    });
    // Immediately open task detail page for editing
    router.push(`/issue/${newTask.id}`);
  };

  const handleAddTaskToGroup = (groupId: string) => {
    if (viewMode === 'board-priority') {
      setCreateDefaultPriority(groupId as TaskPriority);
      setCreateDefaultStatus('TODO');
    } else {
      const custom = sections.find((s) => s.key === groupId);
      if (custom) {
        setCreateDefaultStatus(custom.category || 'IN_PROGRESS');
      } else {
        setCreateDefaultStatus(groupId as TaskStatus);
      }
      setCreateDefaultPriority('NO_PRIORITY');
    }
    setIsCreateOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const filteredTasks = tasks.filter((t) => {
    // Linear tab filter (All, Active, Backlog)
    if (sidebarTab === 'active' && !(t.status === 'TODO' || t.status === 'IN_PROGRESS')) {
      return false;
    }
    if (sidebarTab === 'backlog' && t.status !== 'BACKLOG') {
      return false;
    }

    // Cycle filter
    if (filterCycle !== 'ALL') {
      if (filterCycle === 'NO_CYCLE' && t.cycleId) return false;
      if (filterCycle !== 'NO_CYCLE' && t.cycleId !== filterCycle) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) || false;
      const matchId = t.identifier.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchId) return false;
    }

    if (filterPriority !== 'ALL' && t.priority !== filterPriority) {
      return false;
    }

    if (filterStatus !== 'ALL' && t.status !== filterStatus) {
      return false;
    }

    if (filterAssignee !== 'ALL' && t.assigneeId !== filterAssignee) {
      return false;
    }

    if (filterDivision !== 'ALL' && t.requesterDivisionId !== filterDivision) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#090a0f] text-foreground flex font-sans">
      {/* Left Sidebar */}
      <Sidebar
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
        currentTab={sidebarTab}
        onTabChange={setSidebarTab}
        unreadInboxCount={unreadInboxCount}
        triageCount={triageCount}
        onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
        onOpenCreateIssue={() => {
          if (workspace?.role === 'STAKEHOLDER') {
            setIsIntakeModalOpen(true);
          } else {
            setCreateDefaultPriority('NO_PRIORITY');
            setCreateDefaultStatus('TODO');
            setIsCreateOpen(true);
          }
        }}
        onOpenInviteModal={() => setIsInviteOpen(true)}
        onOpenCommandMenu={() => setIsCommandOpen(true)}
        onOpenWorkspaceSettings={() => router.push('/settings/workspace')}
        taskCounts={{
          all: tasks.length,
          active: tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
          backlog: tasks.filter((t) => t.status === 'BACKLOG').length,
          trash: trashCount,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
        {/* Top Navigation */}
        <Navbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenInbox={() => setSidebarTab('inbox')}
          unreadInboxCount={unreadInboxCount}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenCreateTask={() => {
            if (workspace?.role === 'STAKEHOLDER') {
              setIsIntakeModalOpen(true);
            } else {
              setCreateDefaultPriority('NO_PRIORITY');
              setCreateDefaultStatus('TODO');
              setIsCreateOpen(true);
            }
          }}
          onOpenCommandMenu={() => setIsCommandOpen(true)}
          onOpenInviteModal={() => setIsInviteOpen(true)}
          onOpenWorkspaceSettings={() => router.push('/settings/workspace')}
          onOpenTeam={() => setSidebarTab('team')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {sidebarTab === 'inbox' ? (
          <InboxView onUnreadCountChange={setUnreadInboxCount} />
        ) : sidebarTab === 'cycles' && workspace && workspace.cyclesEnabled !== false ? (
          <CyclesView
            workspace={workspace}
            onTaskClick={handleTaskClick}
            onOpenCreateTask={(cycleId) => {
              setCreateDefaultPriority('NO_PRIORITY');
              setCreateDefaultStatus('TODO');
              setIsCreateOpen(true);
            }}
          />
        ) : sidebarTab === 'trash' && workspace ? (
          <TrashView
            workspace={workspace}
            onTaskClick={handleTaskClick}
            onTaskRestored={(task) => {
              setTasks((prev) => {
                if (prev.some((t) => t.id === task.id)) return prev;
                return [task, ...prev];
              });
              setTrashCount((c) => Math.max(0, c - 1));
            }}
          />
        ) : sidebarTab === 'team' && workspace ? (
          <TeamView
            workspace={workspace}
            currentUser={user}
            tasks={tasks}
            onSelectMemberTasks={(memberId) => {
              setFilterAssignee(memberId);
              setSidebarTab('all');
            }}
            onRefreshWorkspace={refreshWorkspacesAndProjects}
          />
        ) : sidebarTab === 'triage' && workspace ? (
          <TriageView
            workspace={workspace}
            currentUser={user}
            cycles={cycles}
            onOpenTaskDetail={handleTaskClick}
            onTaskTriaged={(task) => {
              fetchTasks();
              setTriageCount((c) => Math.max(0, c - 1));
            }}
          />
        ) : sidebarTab === 'requests' && workspace ? (
          <StakeholderRequestsView
            workspace={workspace}
            currentUser={user}
            onOpenTaskDetail={handleTaskClick}
          />
        ) : (
          <>
            {/* Filter & Subheader Bar (Matching Linear's Active / Backlog / All tabs) */}
            <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-[#090a0f]/80 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
                {/* View tabs */}
                <div className="flex items-center gap-1 bg-[#141520] p-0.5 rounded-md border border-border/60 shrink-0">
                  <button
                    onClick={() => setSidebarTab('active')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      sidebarTab === 'active'
                        ? 'bg-secondary text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setSidebarTab('backlog')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      sidebarTab === 'backlog'
                        ? 'bg-secondary text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Backlog
                  </button>
                  <button
                    onClick={() => setSidebarTab('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      sidebarTab === 'all'
                        ? 'bg-secondary text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All issues
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-400 font-medium ml-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filter:</span>
                </div>

                {/* Division Filter */}
                <select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                  className="bg-[#141520] border border-border text-xs rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-primary cursor-pointer shrink-0"
                >
                  <option value="ALL">All Divisions</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                {/* Cycle Filter */}
                <select
                  value={filterCycle}
                  onChange={(e) => setFilterCycle(e.target.value)}
                  className="bg-[#141520] border border-border text-xs rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-primary cursor-pointer shrink-0"
                >
                  <option value="ALL">All Cycles</option>
                  <option value="NO_CYCLE">No Cycle</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.status === 'ACTIVE' ? '(Current)' : ''}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-[#141520] border border-border text-xs rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-primary cursor-pointer shrink-0"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="NO_PRIORITY">No Priority</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#141520] border border-border text-xs rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-primary cursor-pointer shrink-0"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELED">Canceled</option>
                </select>

                {(filterPriority !== 'ALL' || filterStatus !== 'ALL' || filterCycle !== 'ALL' || filterDivision !== 'ALL' || filterAssignee !== 'ALL' || searchQuery || sidebarTab !== 'all') && (
                  <button
                    onClick={() => {
                      setSidebarTab('all');
                      setFilterPriority('ALL');
                      setFilterStatus('ALL');
                      setFilterCycle('ALL');
                      setFilterDivision('ALL');
                      setFilterAssignee('ALL');
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-white hover:bg-secondary/60 transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}

                {filterAssignee !== 'ALL' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium shrink-0">
                    <span>
                      Assignee:{' '}
                      {workspace?.members?.find((m) => m.userId === filterAssignee || m.user?.id === filterAssignee)?.user?.name || 'Member'}
                    </span>
                    <button onClick={() => setFilterAssignee('ALL')} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#5e6ad2]/15 border border-[#5e6ad2]/30 text-[#8a95ff] text-xs font-medium hover:bg-[#5e6ad2]/25 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Invite</span>
                </button>
                <div className="text-muted-foreground text-xs font-mono">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'issue' : 'issues'}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-6 overflow-x-auto">
              {tasksLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredTasks.length === 0 && tasks.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-[#0e1017]/50 max-w-md mx-auto">
                  <h3 className="text-base font-semibold text-white">No issues found</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Get started by creating your first task in this project.
                  </p>
                  <Button
                    variant="linear"
                    size="sm"
                    onClick={() => {
                      if (workspace?.role === 'STAKEHOLDER') {
                        setIsIntakeModalOpen(true);
                      } else {
                        setIsCreateOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{workspace?.role === 'STAKEHOLDER' ? 'Submit Request' : 'Create Issue'}</span>
                  </Button>
                </div>
              ) : viewMode === 'board-priority' ? (
                <BoardView
                  tasks={filteredTasks}
                  groupBy="priority"
                  onTaskClick={handleTaskClick}
                  onTaskMove={handleTaskMove}
                  onAddTaskToGroup={handleAddTaskToGroup}
                  customSections={sections}
                  isDragDisabled={workspace?.role === 'STAKEHOLDER'}
                />
              ) : viewMode === 'board-status' ? (
                <BoardView
                  tasks={filteredTasks}
                  groupBy="status"
                  onTaskClick={handleTaskClick}
                  onTaskMove={handleTaskMove}
                  onAddTaskToGroup={handleAddTaskToGroup}
                  customSections={sections}
                  columnOrder={columnOrder}
                  onUpdateColumnOrder={handleUpdateColumnOrder}
                  onCreateSection={handleCreateSection}
                  onDeleteSection={handleDeleteSection}
                  isDragDisabled={workspace?.role === 'STAKEHOLDER'}
                />
              ) : (
                <ListView
                  tasks={filteredTasks}
                  groupBy="priority"
                  onTaskClick={handleTaskClick}
                  onStatusChange={(id, status) => handleTaskUpdate(id, { status })}
                  onPriorityChange={(id, priority) => handleTaskUpdate(id, { priority })}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* Quick Issue Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects}
        defaultProjectId={project?.id}
        defaultPriority={createDefaultPriority}
        defaultStatus={createDefaultStatus}
        members={workspace?.members}
        sections={sections}
        cycles={cycles}
        defaultCycleId={activeCycle?.id || null}
      />

      {/* Quick Command Menu */}
      <CommandMenu
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        tasks={tasks}
        onSelectTask={handleTaskClick}
        onOpenCreateTask={() => setIsCreateOpen(true)}
        onChangeView={setViewMode}
        onLogout={() => {}}
      />

      {/* Team Invite Modal */}
      {workspace && (
        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          workspaceId={workspace.id}
          onMemberInvited={() => {
            refreshWorkspacesAndProjects();
          }}
        />
      )}

      {/* Workspace Settings Modal */}
      {workspace && (
        <WorkspaceSettingsModal
          isOpen={isWorkspaceSettingsOpen}
          onClose={() => setIsWorkspaceSettingsOpen(false)}
        />
      )}

      {/* Cross-Division Intake Request Modal */}
      {workspace && (
        <CreateIntakeModal
          isOpen={isIntakeModalOpen}
          onClose={() => setIsIntakeModalOpen(false)}
          workspace={workspace}
          onRequestCreated={(task) => {
            fetchTasks();
            fetchTriageCount();
            fetchDivisions();
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0a0c12]/95 backdrop-blur-xl border-t border-border/80 z-30 flex items-center justify-around px-2">
        {/* Issues Tab */}
        <button
          onClick={() => setSidebarTab('all')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            sidebarTab === 'all' || sidebarTab === 'active' || sidebarTab === 'backlog'
              ? 'text-indigo-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Issues</span>
        </button>

        {/* Inbox Tab */}
        <button
          onClick={() => setSidebarTab('inbox')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            sidebarTab === 'inbox' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Inbox className="w-4 h-4 mb-0.5" />
          {unreadInboxCount > 0 && (
            <span className="absolute top-0.5 right-[24%] min-w-[14px] h-[14px] bg-indigo-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center px-0.5">
              {unreadInboxCount}
            </span>
          )}
          <span className="text-[10px] font-medium leading-none">Inbox</span>
        </button>

        {/* Center Quick Create Button */}
        <div className="flex items-center justify-center px-1">
          <button
            onClick={() => {
              setCreateDefaultPriority('NO_PRIORITY');
              setCreateDefaultStatus('TODO');
              setIsCreateOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Create new issue"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Cycles or Team Tab */}
        {workspace?.cyclesEnabled !== false ? (
          <button
            onClick={() => setSidebarTab('cycles')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              sidebarTab === 'cycles' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RotateCw className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Cycles</span>
          </button>
        ) : (
          <button
            onClick={() => setSidebarTab('team')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              sidebarTab === 'team' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Team</span>
          </button>
        )}

        {/* Menu (Opens Drawer) */}
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isMobileNavOpen ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
