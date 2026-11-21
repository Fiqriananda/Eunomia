#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EunomiaClient } from "./client.js";

const TASK_STATUS = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELED"] as const;
const TASK_PRIORITY = ["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const client = new EunomiaClient({
  apiUrl: process.env.EUNOMIA_API_URL || "https://eunomiaapi.motionlaboratory.com",
  token: process.env.EUNOMIA_TOKEN,
  email: process.env.EUNOMIA_EMAIL,
  password: process.env.EUNOMIA_PASSWORD,
  defaultWorkspaceId: process.env.EUNOMIA_WORKSPACE_ID,
});

const server = new McpServer({
  name: "eunomia",
  version: "1.0.0",
});

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function fail(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

async function runTool(fn: () => Promise<unknown>) {
  try {
    return ok(await fn());
  } catch (err) {
    return fail(err);
  }
}

server.tool(
  "list_workspaces",
  "List all Eunomia workspaces the authenticated user belongs to",
  {},
  async () => runTool(() => client.request("GET", "/workspaces"))
);

server.tool(
  "list_members",
  "List members in a Eunomia workspace",
  {
    workspaceId: z.string().optional().describe("Workspace ID (uses EUNOMIA_WORKSPACE_ID if omitted)"),
  },
  async ({ workspaceId }) =>
    runTool(() =>
      client.request("GET", `/workspaces/${encodeURIComponent(client.resolveWorkspaceId(workspaceId))}/members`)
    )
);

server.tool(
  "list_projects",
  "List all projects (epics) in a workspace",
  {
    workspaceId: z.string().optional().describe("Workspace ID (uses EUNOMIA_WORKSPACE_ID if omitted)"),
  },
  async ({ workspaceId }) =>
    runTool(() =>
      client.request("GET", "/projects", {
        query: { workspaceId: client.resolveWorkspaceId(workspaceId) },
      })
    )
);

server.tool(
  "create_project",
  "Create a new project / Epic in a workspace",
  {
    workspaceId: z.string().optional().describe("Workspace ID (uses EUNOMIA_WORKSPACE_ID if omitted)"),
    name: z.string().min(1).describe("Project name"),
    key: z.string().optional().describe("Short project key, e.g. AST"),
    description: z.string().optional(),
    color: z.string().optional().describe("Hex color, e.g. #6366f1"),
    status: z.string().optional().describe("Project status, e.g. IN_PROGRESS"),
    targetDate: z.string().optional().describe("Target date (YYYY-MM-DD)"),
    leadId: z.string().optional().describe("Project lead user ID"),
  },
  async ({ workspaceId, ...body }) =>
    runTool(() =>
      client.request("POST", "/projects", {
        body: { workspaceId: client.resolveWorkspaceId(workspaceId), ...body },
      })
    )
);

server.tool(
  "list_cycles",
  "List all cycles / sprints in a workspace",
  {
    workspaceId: z.string().optional().describe("Workspace ID (uses EUNOMIA_WORKSPACE_ID if omitted)"),
  },
  async ({ workspaceId }) =>
    runTool(() =>
      client.request("GET", "/cycles", {
        query: { workspaceId: client.resolveWorkspaceId(workspaceId) },
      })
    )
);

server.tool(
  "list_tasks",
  "List tasks in a workspace with optional filters",
  {
    workspaceId: z.string().optional().describe("Workspace ID (uses EUNOMIA_WORKSPACE_ID if omitted)"),
    projectId: z.string().optional(),
    cycleId: z.string().optional(),
    status: z.enum(TASK_STATUS).optional(),
    priority: z.enum(TASK_PRIORITY).optional(),
    assigneeId: z.string().optional(),
    search: z.string().optional(),
    parentId: z.string().optional(),
  },
  async ({ workspaceId, ...filters }) =>
    runTool(() =>
      client.request("GET", "/tasks", {
        query: { workspaceId: client.resolveWorkspaceId(workspaceId), ...filters },
      })
    )
);

server.tool(
  "get_task",
  "Get full details of a single task by ID",
  {
    taskId: z.string().min(1).describe("Task ID"),
  },
  async ({ taskId }) =>
    runTool(() => client.request("GET", `/tasks/${encodeURIComponent(taskId)}`))
);

server.tool(
  "create_task",
  "Create a new task / issue in Eunomia",
  {
    workspaceId: z.string().optional().describe("Workspace ID (uses EUNOMIA_WORKSPACE_ID if omitted)"),
    projectId: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(TASK_STATUS).optional(),
    priority: z.enum(TASK_PRIORITY).optional(),
    assigneeId: z.string().optional(),
    assigneeIds: z.array(z.string()).optional(),
    dueDate: z.string().optional().describe("ISO date string"),
    labels: z.array(z.string()).optional(),
    parentId: z.string().optional(),
    cycleId: z.string().optional(),
    estimate: z.number().optional(),
  },
  async ({ workspaceId, ...body }) =>
    runTool(() =>
      client.request("POST", "/tasks", {
        body: { workspaceId: client.resolveWorkspaceId(workspaceId), ...body },
      })
    )
);

server.tool(
  "create_subtask",
  "Create a subtask under an existing parent task",
  {
    parentId: z.string().min(1).describe("Parent task ID"),
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(TASK_STATUS).optional(),
    priority: z.enum(TASK_PRIORITY).optional(),
    assigneeId: z.string().optional(),
    assigneeIds: z.array(z.string()).optional(),
    dueDate: z.string().optional(),
    labels: z.array(z.string()).optional(),
    projectId: z.string().optional(),
  },
  async ({ parentId, ...body }) =>
    runTool(() =>
      client.request("POST", `/tasks/${encodeURIComponent(parentId)}/subtasks`, { body })
    )
);

server.tool(
  "update_task",
  "Update an existing task's properties (status, priority, title, description, labels, etc.)",
  {
    taskId: z.string().min(1).describe("Task ID"),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(TASK_STATUS).optional(),
    priority: z.enum(TASK_PRIORITY).optional(),
    assigneeId: z.string().nullable().optional(),
    assigneeIds: z.array(z.string()).optional(),
    dueDate: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
    projectId: z.string().optional(),
    parentId: z.string().nullable().optional(),
    cycleId: z.string().nullable().optional(),
    estimate: z.number().optional(),
  },
  async ({ taskId, ...body }) =>
    runTool(() =>
      client.request("PATCH", `/tasks/${encodeURIComponent(taskId)}`, { body })
    )
);

server.tool(
  "add_comment",
  "Add a comment to a task",
  {
    taskId: z.string().min(1).describe("Task ID"),
    content: z.string().min(1).describe("Comment text"),
    parentId: z.string().optional().describe("Parent comment ID for threaded replies"),
  },
  async ({ taskId, content, parentId }) =>
    runTool(() =>
      client.request("POST", `/tasks/${encodeURIComponent(taskId)}/comments`, {
        body: { content, ...(parentId ? { parentId } : {}) },
      })
    )
);

server.tool(
  "add_task_relation",
  "Link two tasks (e.g. BLOCKS, RELATED, DUPLICATE)",
  {
    taskId: z.string().min(1).describe("Source task ID"),
    targetTaskId: z.string().min(1).describe("Target task ID"),
    type: z.string().optional().describe("Relation type, e.g. BLOCKS, RELATED, DUPLICATE"),
  },
  async ({ taskId, targetTaskId, type }) =>
    runTool(() =>
      client.request("POST", `/tasks/${encodeURIComponent(taskId)}/relations`, {
        body: { targetTaskId, ...(type ? { type } : {}) },
      })
    )
);

const transport = new StdioServerTransport();
await server.connect(transport);
