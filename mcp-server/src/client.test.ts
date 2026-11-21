import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { EunomiaClient } from "./client.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("EunomiaClient", () => {
  it("logs in automatically and retries once on 401", async () => {
    let loginCalls = 0;
    let taskCalls = 0;

    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        loginCalls += 1;
        return new Response(JSON.stringify({ accessToken: `tok-${loginCalls}` }), { status: 200 });
      }
      if (url.includes("/tasks")) {
        taskCalls += 1;
        if (taskCalls === 1) {
          return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }
        return new Response(JSON.stringify([{ id: "t1", title: "Asset Task" }]), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    }) as typeof fetch;

    const client = new EunomiaClient({
      apiUrl: "http://localhost:4000/",
      email: "dev@eunomia.local",
      password: "secret",
      defaultWorkspaceId: "ws-1",
    });

    const tasks = await client.request<Array<{ id: string }>>("GET", "/tasks", {
      query: { workspaceId: client.resolveWorkspaceId(), status: "TODO", search: undefined },
    });

    assert.equal(loginCalls, 2);
    assert.equal(taskCalls, 2);
    assert.equal(tasks[0].id, "t1");
  });

  it("throws clear error when workspaceId is missing", () => {
    const client = new EunomiaClient({ apiUrl: "http://localhost:4000", token: "abc" });
    assert.throws(() => client.resolveWorkspaceId(), /workspaceId wajib diisi/);
  });
});
