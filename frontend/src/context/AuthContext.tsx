'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace, Project } from '../types';
import { api } from '../lib/api';
import { SocketProvider } from './SocketContext';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  project: Project | null;
  workspaces: Workspace[];
  projects: Project[];
  loading: boolean;
  setWorkspace: (ws: Workspace) => void;
  setProject: (proj: Project | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshWorkspacesAndProjects: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    avatarUrl?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const token = localStorage.getItem('linear_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const me = await api.auth.getMe();
      setUser({
        id: me.id,
        email: me.email,
        name: me.name,
        avatarUrl: me.avatarUrl,
      });

      const wsList = await api.workspaces.getAll();
      setWorkspaces(wsList);

      const savedWsId = localStorage.getItem('linear_active_ws');
      const activeWs = wsList.find((w) => w.id === savedWsId) || wsList[0] || null;
      setWorkspaceState(activeWs);

      if (activeWs) {
        const projList = await api.projects.getByWorkspace(activeWs.id);
        setProjects(projList);
        const savedProjId = localStorage.getItem('linear_active_proj');
        const activeProj = projList.find((p) => p.id === savedProjId) || projList[0] || null;
        setProject(activeProj);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('linear_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const setWorkspace = async (ws: Workspace) => {
    setWorkspaceState(ws);
    localStorage.setItem('linear_active_ws', ws.id);
    try {
      const projList = await api.projects.getByWorkspace(ws.id);
      setProjects(projList);
      setProject(projList[0] || null);
      if (projList[0]) {
        localStorage.setItem('linear_active_proj', projList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setProjectHandler = (proj: Project | null) => {
    setProject(proj);
    if (proj) {
      localStorage.setItem('linear_active_proj', proj.id);
    } else {
      localStorage.removeItem('linear_active_proj');
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('linear_token', res.accessToken);
      setUser(res.user);

      const wsList = await api.workspaces.getAll();
      setWorkspaces(wsList);
      const activeWs = res.workspace || wsList[0];
      setWorkspaceState(activeWs);
      if (activeWs) {
        localStorage.setItem('linear_active_ws', activeWs.id);
        const projList = await api.projects.getByWorkspace(activeWs.id);
        setProjects(projList);
        const activeProj = res.defaultProject || projList[0] || null;
        setProject(activeProj);
        if (activeProj) localStorage.setItem('linear_active_proj', activeProj.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const res = await api.auth.register({ email, password, name });
      localStorage.setItem('linear_token', res.accessToken);
      setUser(res.user);

      const wsList = await api.workspaces.getAll();
      setWorkspaces(wsList);
      setWorkspaceState(res.workspace);
      if (res.workspace) {
        localStorage.setItem('linear_active_ws', res.workspace.id);
        const projList = await api.projects.getByWorkspace(res.workspace.id);
        setProjects(projList);
        setProject(res.defaultProject || projList[0] || null);
      }
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    localStorage.removeItem('linear_token');
    localStorage.removeItem('linear_active_ws');
    localStorage.removeItem('linear_active_proj');
    setUser(null);
    setWorkspaceState(null);
    setProject(null);
    setWorkspaces([]);
    setProjects([]);
  };

  const refreshWorkspacesAndProjects = async () => {
    if (!user) return;
    const wsList = await api.workspaces.getAll();
    setWorkspaces(wsList);
    if (workspace) {
      const projList = await api.projects.getByWorkspace(workspace.id);
      setProjects(projList);
    }
  };

  const updateProfile = async (data: {
    name?: string;
    avatarUrl?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const updated = await api.auth.updateProfile(data);
    setUser((prev) => (prev ? { ...prev, ...updated } : updated));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        project,
        workspaces,
        projects,
        loading,
        setWorkspace,
        setProject: setProjectHandler,
        login,
        register,
        logout,
        refreshWorkspacesAndProjects,
        updateProfile,
      }}
    >
      <SocketProvider>{children}</SocketProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
