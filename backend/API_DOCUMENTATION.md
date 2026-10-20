# 🚀 Linear Clone Backend API Documentation (Full Specification)

Dokumentasi lengkap seluruh REST API endpoint untuk backend **Linear Clone / Motion** (NestJS 12 + Prisma ORM + PostgreSQL). Dokumentasi ini dirancang agar siap dikonsumsi langsung oleh AI / pengembang client (Flutter, React Native, iOS, Android, Next.js).

---

## 📌 1. Informasi Umum & Konfigurasi Koneksi

- **Base URL Server**: `http://localhost:4000`
- **Base URL untuk Android Emulator**: `http://10.0.2.2:4000`
- **Base URL untuk iOS Simulator**: `http://localhost:4000`
- **Swagger Interactive UI**: `http://localhost:4000/api/docs` (atau shortcut `http://localhost:4000/docs`)
- **Format Data**: JSON (`application/json`) kecuali endpoint upload file (`multipart/form-data`)
- **Autentikasi**: Bearer Token (JWT).
  ```http
  Authorization: Bearer <access_token>
  ```
- **Akun Demo / Testing Cepat**:
  - Email: `demo@linear.app`
  - Password: `password123`

---

## 🧭 2. Enum & Data Types

### `TaskStatus`
| Value | Label | Deskripsi |
| :--- | :--- | :--- |
| `BACKLOG` | Backlog | Tugas yang masih di antrean |
| `TODO` | Todo | Tugas siap dikerjakan |
| `IN_PROGRESS` | In Progress | Tugas sedang aktif dikerjakan |
| `DONE` | Done | Tugas selesai |
| `CANCELED` | Canceled | Tugas dibatalkan |

### `TaskPriority`
| Value | Level | Warna Hex | Deskripsi |
| :--- | :---: | :--- | :--- |
| `NO_PRIORITY` | 0 | `#94a3b8` | Tanpa prioritas |
| `LOW` | 1 | `#0ea5e9` | Prioritas rendah |
| `MEDIUM` | 2 | `#f59e0b` | Prioritas sedang |
| `HIGH` | 3 | `#f97316` | Prioritas tinggi |
| `URGENT` | 4 | `#f43f5e` | Prioritas mendesak |

### `WorkspaceRole`
- `OWNER`
- `ADMIN`
- `MEMBER`

### `TaskRelationType`
- `RELATED`
- `BLOCKS`
- `BLOCKED_BY`
- `DUPLICATE`

---

## 📱 3. Mobile-Optimized Endpoints (`/mobile/*`)

Endpoint ini dirancang khusus untuk aplikasi mobile (Flutter / React Native). Data sudah dikonsolidasi agar meminimalkan network latency dan menghemat bandwidth.

---

### 3.1. `GET /mobile/config`
Mengambil konfigurasi awal aplikasi mobile (metadata status, warna prioritas, fitur aktif).

- **Auth**: Tidak perlu (Public)
- **Response `200 OK`**:
```json
{
  "apiVersion": "1.0.0",
  "minSupportedAppVersion": "1.0.0",
  "serverTime": "2026-10-19T12:30:39.861Z",
  "statuses": [
    { "key": "BACKLOG", "label": "Backlog", "color": "#94a3b8" },
    { "key": "TODO", "label": "Todo", "color": "#e2e8f0" },
    { "key": "IN_PROGRESS", "label": "In Progress", "color": "#f59e0b" },
    { "key": "DONE", "label": "Done", "color": "#6366f1" },
    { "key": "CANCELED", "label": "Canceled", "color": "#64748b" }
  ],
  "priorities": [
    { "key": "NO_PRIORITY", "label": "No Priority", "level": 0, "color": "#94a3b8" },
    { "key": "LOW", "label": "Low", "level": 1, "color": "#0ea5e9" },
    { "key": "MEDIUM", "label": "Medium", "level": 2, "color": "#f59e0b" },
    { "key": "HIGH", "label": "High", "level": 3, "color": "#f97316" },
    { "key": "URGENT", "label": "Urgent", "level": 4, "color": "#f43f5e" }
  ],
  "features": {
    "fileUploads": true,
    "subtasks": true,
    "relations": true,
    "inbox": true,
    "pushNotifications": false
  }
}
```

---

### 3.2. `GET /mobile/home`
Endpoint dashboard utama mobile. Mengembalikan profil user, workspace aktif, rekap statistik counter, daftar task darurat/assigned, dan status breakdown hanya dalam 1 request.

- **Auth**: Wajib (`Bearer <token>`)
- **Query Params**:
  - `workspaceId` *(string, optional)*: Jika kosong, otomatis memakai workspace utama user.
- **Response `200 OK`**:
```json
{
  "user": {
    "id": "f9c39861-c9b3-4899-b683-1b0d3438da5c",
    "name": "Alex Vance",
    "email": "demo@linear.app",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
  },
  "currentWorkspace": {
    "id": "9f70060a-4c04-4fe2-8dcd-843b9cdacd3b",
    "name": "Acme Product Team",
    "slug": "acme-product",
    "role": "OWNER"
  },
  "availableWorkspaces": [
    {
      "id": "9f70060a-4c04-4fe2-8dcd-843b9cdacd3b",
      "name": "Acme Product Team",
      "slug": "acme-product",
      "role": "OWNER"
    }
  ],
  "stats": {
    "assignedCount": 5,
    "inProgressCount": 2,
    "dueSoonCount": 1,
    "urgentCount": 3,
    "completedThisWeekCount": 8,
    "unreadNotificationsCount": 4
  },
  "myAssignedTasks": [
    {
      "id": "72e7be96-312c-431f-91eb-00b445be6b95",
      "identifier": "TJAR-2",
      "title": "Implement drag-and-drop priority reordering",
      "description": "Enable instant drag and drop across columns",
      "status": "IN_PROGRESS",
      "customStatus": null,
      "priority": "HIGH",
      "dueDate": "2026-10-25T12:00:00.000Z",
      "labels": ["Feature", "Frontend"],
      "project": {
        "id": "22e704a5-a5bb-4a14-8b2f-30b8cf0bdfee",
        "name": "Core Platform",
        "key": "TJAR",
        "color": "#5e6ad2"
      },
      "assignee": {
        "id": "f9c39861-c9b3-4899-b683-1b0d3438da5c",
        "name": "Alex Vance",
        "avatarUrl": null
      },
      "subtasksCount": 2,
      "subtasksCompletedCount": 1,
      "commentsCount": 4,
      "attachmentsCount": 1,
      "createdAt": "2026-10-15T01:27:24.722Z",
      "updatedAt": "2026-10-15T04:56:04.039Z"
    }
  ],
  "projects": [
    {
      "id": "22e704a5-a5bb-4a14-8b2f-30b8cf0bdfee",
      "name": "Core Platform",
      "key": "TJAR",
      "color": "#5e6ad2",
      "taskCount": 16
    }
  ],
  "statusBreakdown": [
    { "status": "BACKLOG", "label": "Backlog", "count": 3 },
    { "status": "TODO", "label": "Todo", "count": 1 },
    { "status": "IN_PROGRESS", "label": "In Progress", "count": 4 },
    { "status": "DONE", "label": "Done", "count": 2 },
    { "status": "CANCELED", "label": "Canceled", "count": 0 }
  ]
}
```

---

### 3.3. `GET /mobile/tasks`
Mengambil daftar task dengan paginasi, filter khusus, dan pencarian teks.

- **Auth**: Wajib (`Bearer <token>`)
- **Query Params**:
  - `workspaceId` *(string, optional)*
  - `projectId` *(string, optional)*
  - `filter` *(enum: `assigned_to_me` | `created_by_me` | `all`, default: `assigned_to_me`)*
  - `status` *(enum: `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE`, `CANCELED`, optional)*
  - `priority` *(enum: `NO_PRIORITY`, `LOW`, `MEDIUM`, `HIGH`, `URGENT`, optional)*
  - `search` *(string, optional)*
  - `page` *(number, default: 1)*
  - `limit` *(number, default: 20)*
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "72e7be96-312c-431f-91eb-00b445be6b95",
      "identifier": "TJAR-2",
      "title": "Implement drag-and-drop priority",
      "description": "Description...",
      "status": "IN_PROGRESS",
      "customStatus": null,
      "priority": "HIGH",
      "dueDate": null,
      "labels": ["Frontend"],
      "project": { "id": "proj_1", "name": "Core", "key": "TJAR", "color": "#5e6ad2" },
      "assignee": { "id": "usr_1", "name": "Alex", "avatarUrl": null },
      "subtasksCount": 0,
      "subtasksCompletedCount": 0,
      "commentsCount": 2,
      "attachmentsCount": 0,
      "createdAt": "2026-10-15T01:27:24.722Z",
      "updatedAt": "2026-10-15T04:56:04.039Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3,
  "hasMore": true
}
```

---

### 3.4. `GET /mobile/tasks/:id`
Mengambil detail lengkap 1 task untuk layar Task Detail di mobile (termasuk subtasks, komentar, attachment, relasi).

- **Auth**: Wajib (`Bearer <token>`)
- **Path Params**: `id` *(string)*
- **Response `200 OK`**:
```json
{
  "id": "72e7be96-312c-431f-91eb-00b445be6b95",
  "identifier": "TJAR-2",
  "title": "Implement drag-and-drop priority reordering",
  "description": "Full markdown description...",
  "status": "IN_PROGRESS",
  "customStatus": null,
  "priority": "HIGH",
  "dueDate": "2026-10-25T12:00:00.000Z",
  "labels": ["Feature", "Frontend"],
  "workspace": { "id": "ws_1", "name": "Acme Product Team", "slug": "acme-product" },
  "project": { "id": "proj_1", "name": "Core Platform", "key": "TJAR", "color": "#5e6ad2" },
  "creator": { "id": "usr_1", "name": "Alex", "email": "demo@linear.app", "avatarUrl": null },
  "assignee": { "id": "usr_1", "name": "Alex", "email": "demo@linear.app", "avatarUrl": null },
  "parent": null,
  "subtasks": [
    {
      "id": "sub_1",
      "identifier": "TJAR-3",
      "title": "Add animations",
      "status": "DONE",
      "priority": "MEDIUM",
      "assignee": { "id": "usr_1", "name": "Alex", "email": "demo@linear.app", "avatarUrl": null }
    }
  ],
  "comments": [
    {
      "id": "comm_1",
      "content": "Working on this now from mobile",
      "createdAt": "2026-10-19T09:15:00.000Z",
      "user": { "id": "usr_1", "name": "Alex", "email": "demo@linear.app", "avatarUrl": null }
    }
  ],
  "attachments": [
    {
      "id": "att_1",
      "filename": "f31ab28...png",
      "originalName": "screenshot.png",
      "mimeType": "image/png",
      "size": 245000,
      "url": "/uploads/f31ab28...png",
      "createdAt": "2026-10-19T09:10:00.000Z"
    }
  ],
  "createdAt": "2026-10-15T01:27:24.722Z",
  "updatedAt": "2026-10-15T04:56:04.039Z"
}
```

---

### 3.5. `POST /mobile/tasks`
Pembuatan task cepat dari mobile (Floating Action Button `+`). Jika `workspaceId` atau `projectId` tidak diisi, backend otomatis mencarikan workspace dan project default milik user.

- **Auth**: Wajib (`Bearer <token>`)
- **Request Body**:
```json
{
  "title": "Selesaikan integrasi mobile client",
  "description": "Deskripsi opsional dalam format markdown",
  "workspaceId": "9f70060a-4c04-4fe2-8dcd-843b9cdacd3b", // Opsional
  "projectId": "22e704a5-a5bb-4a14-8b2f-30b8cf0bdfee",   // Opsional
  "status": "TODO",                                      // Opsional (default TODO)
  "priority": "URGENT",                                  // Opsional (default NO_PRIORITY)
  "assigneeId": "f9c39861-c9b3-4899-b683-1b0d3438da5c", // Opsional
  "dueDate": "2026-10-25T12:00:00.000Z",                 // Opsional
  "labels": ["Mobile", "Release"],                       // Opsional
  "parentId": null                                       // Opsional (jika subtask)
}
```
- **Response `201 Created`**: Objek Task yang baru dibuat lengkap dengan identifier unik (misal: `TJAR-478`).

---

### 3.6. `PATCH /mobile/tasks/:id/status`
Update status cepat 1-tap (misal swipe kartu untuk mark as DONE).

- **Auth**: Wajib (`Bearer <token>`)
- **Request Body**:
```json
{
  "status": "DONE",
  "customStatus": null
}
```
- **Response `200 OK`**: Objek Task terbaru.

---

### 3.7. `PATCH /mobile/tasks/:id/priority`
Update level prioritas dari picker mobile.

- **Auth**: Wajib (`Bearer <token>`)
- **Request Body**:
```json
{
  "priority": "HIGH"
}
```
- **Response `200 OK`**: Objek Task terbaru.

---

### 3.8. `POST /mobile/tasks/:id/comments`
Kirim komentar baru pada task dari mobile.

- **Auth**: Wajib (`Bearer <token>`)
- **Request Body**:
```json
{
  "content": "Sudah saya uji coba di emulator dan berjalan lancar."
}
```
- **Response `201 Created`**: Objek komentar baru.

---

### 3.9. `GET /mobile/notifications`
Mengambil inbox notifikasi dan jumlah badge belum dibaca untuk icon lonceng.

- **Auth**: Wajib (`Bearer <token>`)
- **Query Params**:
  - `unreadOnly` *(boolean string: `true` | `false`, optional)*
- **Response `200 OK`**:
```json
{
  "notifications": [
    {
      "id": "notif_1",
      "type": "ASSIGNED",
      "title": "Assigned to TJAR-2",
      "body": "You were assigned to Implement drag-and-drop",
      "isRead": false,
      "readAt": null,
      "taskId": "72e7be96-312c-431f-91eb-00b445be6b95",
      "task": {
        "id": "72e7be96-312c-431f-91eb-00b445be6b95",
        "identifier": "TJAR-2",
        "title": "Implement drag-and-drop priority"
      },
      "actor": {
        "id": "usr_2",
        "name": "Sarah Connor",
        "avatarUrl": null
      },
      "createdAt": "2026-10-19T08:00:00.000Z"
    }
  ],
  "unreadCount": 1
}
```

---

### 3.10. `PATCH /mobile/notifications/:id/read`
Menandai 1 notifikasi telah dibaca saat di-tap.

- **Auth**: Wajib (`Bearer <token>`)
- **Response `200 OK`**

---

### 3.11. `POST /mobile/notifications/read-all`
Menandai semua notifikasi telah dibaca (clear unread badge).

- **Auth**: Wajib (`Bearer <token>`)
- **Response `200 OK`**

---

## 🔐 4. Autentikasi (`/auth/*`)

---

### 4.1. `POST /auth/register`
Mendaftarkan akun baru.

- **Auth**: Public
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Budi Santoso"
}
```
- **Response `201 Created`**:
```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Budi Santoso",
    "avatarUrl": null
  },
  "workspace": {
    "id": "uuid",
    "name": "Budi Santoso's Workspace",
    "slug": "budi-santoso-workspace"
  }
}
```

---

### 4.2. `POST /auth/login`
Masuk dengan akun terdaftar.

- **Auth**: Public
- **Request Body**:
```json
{
  "email": "demo@linear.app",
  "password": "password123"
}
```
- **Response `200 OK`**:
```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "f9c39861-c9b3-4899-b683-1b0d3438da5c",
    "email": "demo@linear.app",
    "name": "Alex Vance",
    "avatarUrl": "https://..."
  },
  "workspace": { ... },
  "defaultProject": { ... }
}
```

---

### 4.3. `GET /auth/me`
Mengambil data profil user yang sedang login beserta daftar workspace miliknya.

- **Auth**: Wajib (`Bearer <token>`)
- **Response `200 OK`**:
```json
{
  "id": "f9c39861-c9b3-4899-b683-1b0d3438da5c",
  "email": "demo@linear.app",
  "name": "Alex Vance",
  "avatarUrl": "https://...",
  "workspaces": [ ... ]
}
```

---

### 4.4. `PATCH /auth/profile`
Memperbarui profil atau password user.

- **Auth**: Wajib (`Bearer <token>`)
- **Request Body**:
```json
{
  "name": "Alex Vance Updated",
  "avatarUrl": "https://...",
  "currentPassword": "password123", // Diisi jika mau ganti password
  "newPassword": "newpassword123"     // Diisi jika mau ganti password
}
```
- **Response `200 OK`**

---

## 📋 5. Task Management Core (`/tasks/*`)

---

### 5.1. `GET /tasks`
Mengambil list tasks dengan query filter lengkap.

- **Auth**: Wajib (`Bearer <token>`)
- **Query Params**:
  - `workspaceId` *(wajib)*
  - `projectId` *(opsional)*
  - `status` *(opsional)*
  - `priority` *(opsional)*
  - `assigneeId` *(opsional)*
  - `search` *(opsional)*
  - `parentId` *(opsional)*

---

### 5.2. `GET /tasks/:id`
Detail task lengkap beserta activities log, comments, subtasks, dan relations.

---

### 5.3. `POST /tasks`
Membuat task baru di workspace & project tertentu.

- **Request Body**:
```json
{
  "workspaceId": "ws_123",
  "projectId": "proj_123",
  "title": "Judul Task",
  "description": "Deskripsi task",
  "status": "TODO",
  "priority": "HIGH",
  "assigneeId": "usr_123",
  "dueDate": "2026-11-01T00:00:00.000Z",
  "labels": ["Bug", "Urgent"],
  "parentId": null
}
```

---

### 5.4. `PATCH /tasks/:id`
Update sembarang atribut pada task.

---

### 5.5. `DELETE /tasks/:id`
Menghapus task.

---

### 5.6. Subtasks Endpoints
- `POST /tasks/:id/subtasks` — Membuat child subtask baru di bawah task ini.
- `POST /tasks/:id/link-subtask` — Menautkan task yang sudah ada menjadi subtask:
  ```json
  { "subTaskId": "target_task_id" }
  ```
- `DELETE /tasks/:id/subtasks/:subTaskId` — Melepas hubungan subtask dari parent.

---

### 5.7. Task Relations Endpoints
- `POST /tasks/:id/relations` — Menambahkan relasi dependensi (Blocks, Blocked by, Related, Duplicate):
  ```json
  {
    "targetTaskId": "task_id_target",
    "type": "BLOCKS" // "RELATED" | "BLOCKS" | "BLOCKED_BY" | "DUPLICATE"
  }
  ```
- `DELETE /tasks/:id/relations/:relationId` — Menghapus relasi dependensi.

---

### 5.8. `PATCH /tasks/:id/move`
Memindahkan posisi task / drag & drop kolom status atau prioritas:
```json
{
  "status": "IN_PROGRESS",
  "customStatus": null,
  "priority": "URGENT",
  "targetOrder": 1500.5
}
```

---

### 5.9. Komentar & Aktivitas
- `POST /tasks/:id/comments` — `{ "content": "teks komentar" }`
- `DELETE /tasks/:id/comments/:commentId`
- `POST /tasks/:id/activities` — Catat log aktivitas kustom:
  ```json
  {
    "type": "STATUS_CHANGE",
    "details": "moved from Todo to Done",
    "fromValue": "Todo",
    "toValue": "Done"
  }
  ```

---

## 🏢 6. Workspace Management (`/workspaces/*`)

- `GET /workspaces` — Daftar workspace user.
- `GET /workspaces/:id` — Detail workspace.
- `POST /workspaces` — Buat workspace: `{ "name": "Nama Workspace" }`.
- `GET /workspaces/:id/members` — Daftar member dalam workspace.
- `POST /workspaces/:id/invite` — Undang member baru:
  ```json
  {
    "email": "teman@company.com",
    "name": "Nama Teman",
    "role": "MEMBER" // "OWNER" | "ADMIN" | "MEMBER"
  }
  ```
- `GET /workspaces/:id/sections` — List custom workflow sections/columns.
- `POST /workspaces/:id/sections` — Buat section/kolom custom:
  ```json
  {
    "name": "In Review",
    "key": "in_review",
    "color": "#8b5cf6",
    "category": "IN_PROGRESS"
  }
  ```
- `DELETE /workspaces/:id/sections/:sectionId` — Hapus custom section.
- `PATCH /workspaces/:id/columns` — Update urutan kolom board:
  ```json
  {
    "columnOrder": ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"]
  }
  ```

---

## 📁 7. Project Management (`/projects/*`)

- `GET /projects?workspaceId=:id` — Daftar semua project di workspace.
- `POST /projects` — Buat project baru:
  ```json
  {
    "workspaceId": "ws_id",
    "name": "Mobile Client",
    "key": "MOB",
    "description": "Aplikasi Mobile Flutter",
    "color": "#0ea5e9"
  }
  ```
- `PATCH /projects/:id` — Update project:
  ```json
  {
    "name": "Mobile Client v2",
    "color": "#10b981",
    "description": "Updated description"
  }
  ```

---

## 📎 8. File Upload & Attachments (`/uploads/*`)

- `POST /uploads`
  - **Content-Type**: `multipart/form-data`
  - **Form Field**: `file` (Binary file, max 25 MB)
  - **Query Params**: `taskId` *(opsional, untuk langsung mengaitkan attachment ke task)*
  - **Response `201 Created`**:
  ```json
  {
    "id": "att_123",
    "filename": "7f8b9...png",
    "originalName": "foto.png",
    "mimeType": "image/png",
    "size": 154200,
    "url": "/uploads/7f8b9...png"
  }
  ```
- `GET /uploads/:filename` — Akses file statis langsung via HTTP (contoh: `http://localhost:4000/uploads/7f8b9...png`).
- `POST /uploads/:id/link?taskId=:taskId` — Tautkan attachment yang sudah ada ke task.
- `DELETE /uploads/:id` — Hapus file attachment.

---

## 🔔 9. Inbox Stream (`/inbox/*`)

- `GET /inbox?unreadOnly=true` — Ambil list notifikasi user.
- `PATCH /inbox/:id/read` — Tandai notifikasi spesifik sudah dibaca.
- `POST /inbox/read-all` — Tandai semua notifikasi user sudah dibaca.
- `DELETE /inbox/:id` — Hapus notifikasi.

---

## 💡 10. Tips Integrasi untuk Client / Flutter

1. **Gunakan `/mobile/home` saat Booting App**:  
   Hindari memanggil 5 endpoint terpisah saat membuka aplikasi. Cukup panggil `GET /mobile/home` sekali untuk langsung mengisi State User, Workspace, statistik badge, dan kartu task prioritas.
2. **Handle Offline & Cache**:  
   Panggil `GET /mobile/config` untuk menyimpan daftar enum status dan hex warna secara lokal di client.
3. **Paginasi Halus di Mobile List**:  
   Gunakan `GET /mobile/tasks?page=1&limit=20` dengan boolean `hasMore` untuk infinite scroll.
4. **Header Auth Global**:  
   Pasang Dio / HTTP Interceptor di client agar setiap request otomatis menyertakan header:
   ```dart
   options.headers['Authorization'] = 'Bearer $token';
   ```
