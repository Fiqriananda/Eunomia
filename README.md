# Eunomia – Task & Project Management

A full-stack, Linear-inspired issue tracking and project management platform built with **Next.js 16**, **NestJS 12**, **PostgreSQL**, **Prisma ORM**, **Framer Motion**, and **shadcn/ui**.

![Linear Clone Dashboard](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Key Features

- **Iconic Linear Aesthetics**: Dark obsidian zinc palette (`#090a0f`), authentic Linear priority bars, circular status badges, crisp borders, and subtle glows.
- **Drag & Drop to Priority**: Drag tasks directly across priority columns (**Urgent**, **High**, **Medium**, **Low**, **No Priority**) with instant optimistic updates and animated layout transitions via **Framer Motion** and **@dnd-kit**.
- **Status Kanban & List Views**: Easily toggle between **Priority Board**, **Status Board** (Backlog, Todo, In Progress, Done, Canceled), and **Linear List View**.
- **File Upload & Attachments**: Upload attachments directly into issues with drag & drop dropzone, thumbnail preview, size formatting, and download/delete support.
- **Dedicated Issue Detail Page (`/issue/[id]`)**: Full-screen page (no popup/modal) with instant click-to-edit for title and description, full activity stream with comments (`Cmd+Enter` to send), properties sidebar, attachments, and breadcrumbs.
- **Quick Issue Creation (`C` hotkey)**: Instant modal to create issues with title, description, project, priority, and labels.
- **Command Menu (`Cmd+K` / `Ctrl+K`)**: Rapid navigation, search across tasks, and quick actions using cmdk.
- **Full JWT Authentication**: Sign up, login, user sessions, team workspaces, project grouping, and 1-click Demo Sign In.

---

## 🛠️ Tech Stack

### Frontend (`frontend/`)
- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS v4 & shadcn/ui design tokens
- **Animations**: Framer Motion
- **Drag & Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Icons**: Lucide React
- **Command Palette**: `cmdk`

### Backend (`backend/`)
- **Framework**: NestJS 12 (TypeScript)
- **Database & ORM**: PostgreSQL with Prisma ORM v6
- **Authentication**: Passport.js with JWT Strategy & bcryptjs
- **File Uploads**: Multer disk storage with static file serving (`/uploads/*`)
- **Validation**: class-validator & class-transformer

---

## 🐳 1-Command Docker Deployment (Production)

To start the entire application (PostgreSQL, Backend, Frontend) with a single command:

```bash
docker compose up --build
```

That's it!
- **Frontend App**: [http://localhost:3002](http://localhost:3002)
- **Backend API & WebSockets**: [http://localhost:4000](http://localhost:4000)
- **Swagger Interactive API Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **PostgreSQL Database**: `localhost:5432`

---

## 🛠️ Local Development (Manual)

### 1. Start PostgreSQL
```bash
docker compose up -d postgres
```

### 2. Configure & Run Backend (NestJS)
```bash
cd backend
npm install
npm run db:push     # Synchronizes Prisma schema with PostgreSQL
npm run start:dev   # Runs NestJS on http://localhost:4000
```

### 3. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev         # Runs Next.js on http://localhost:3002
```

Open [http://localhost:3002](http://localhost:3002) to create your account and access your workspace.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd + K` / `Ctrl + K` | Open Command Palette & Search |
| `C` | Create New Issue |
| `Esc` | Close modal / drawer |

---

## 📁 Project Structure

```
Project-management/
├── backend/
│   ├── Dockerfile.prod        # Multi-stage NestJS container & auto-migration
│   ├── docker-entrypoint.sh   # Schema push & startup orchestrator
│   ├── prisma/
│   │   └── schema.prisma      # PostgreSQL models & enums
│   ├── src/                   # NestJS modules, controllers & services
│   └── uploads/               # Stored file attachments
├── frontend/
│   ├── Dockerfile.prod        # Ultra-lean Next.js 16 standalone container
│   └── src/                   # Next.js App Router, components & contexts
└── docker-compose.yaml        # Full-stack orchestrator (Postgres + Backend + Frontend)
```
