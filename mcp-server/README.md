# Eunomia MCP Server

Connector MCP (stdio) untuk menghubungkan Antigravity ke backend **Eunomia** (`Project-management/backend`).

## Setup

```bash
cd /Users/muhammadfiqrianandahakin/Project-management/mcp-server
npm install
npm run build
```

## Konfigurasi di Antigravity

Tambahkan entry `eunomia` ke `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "eunomia": {
      "command": "node",
      "args": ["/Users/muhammadfiqrianandahakin/Project-management/mcp-server/dist/index.js"],
      "env": {
        "EUNOMIA_API_URL": "https://eunomiaapi.motionlaboratory.com",
        "EUNOMIA_EMAIL": "email-kamu@domain.com",
        "EUNOMIA_PASSWORD": "password-kamu",
        "EUNOMIA_WORKSPACE_ID": ""
      }
    }
  }
}
```

- Gunakan `EUNOMIA_API_URL: "http://localhost:4000"` jika menjalankan backend secara lokal.
- Alternatif selain email/password: isi `EUNOMIA_TOKEN` dengan JWT token aktif.
- `EUNOMIA_WORKSPACE_ID` opsional; jika dikosongkan, panggil `list_workspaces` lalu kirim `workspaceId` per tool call.

## Tools Tersedia

- `list_workspaces`, `list_members`
- `list_projects`, `create_project`
- `list_cycles`
- `list_tasks`, `get_task`, `create_task`, `create_subtask`, `update_task`
- `add_comment`, `add_task_relation`
