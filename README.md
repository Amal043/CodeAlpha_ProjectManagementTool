# CODEALPHA_Task3 — Collaborative Project Management Tool (TaskFlow)

TaskFlow is a production-style, full-stack collaborative project management application (Trello / Asana alternative) built with **React**, **TypeScript**, **Tailwind CSS** (Violet theme), **Node.js**, **Express.js**, **PostgreSQL**, **Prisma ORM**, **JWT Authentication**, and **Socket.IO** for real-time Kanban collaboration.

---

## 🚀 Key Features

1. **Authentication & Authorization**:
   - Secure User Registration & Login with `bcryptjs` password hashing and JWT tokens.
   - Protected routes & project role-based access control (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).

2. **Project & Team Workspace**:
   - Create workspaces, manage project metadata, and invite existing users by email with specific roles.

3. **Interactive Kanban Board**:
   - Fixed workflow columns: `To Do`, `In Progress`, `Review`, and `Done`.
   - HTML5 Drag-and-Drop column movement (`@hello-pangea/dnd`).
   - Priority badges (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), due date warnings, assignee avatars, and task filters.

4. **Task Details & Real-Time Discussion Feed**:
   - Individual task detail drawers for changing task status, priority, assignee, due date, and posting comments.

5. **Socket.IO Real-Time Engine & In-App Notifications**:
   - Instant WebSocket synchronization: task creation, status updates, column movements, and comments reflect across all connected team members without page refresh.
   - In-app notification popover with unread badge count and read receipts.

---

## 🛠 Project Architecture

```
CODEALPHA_Task3/
├── client/                 # React 18 + TypeScript + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/     # Kanban Board, Task Cards, Modals, Navbar, Sidebar, Notifications
│   │   ├── context/        # AuthContext, SocketContext
│   │   ├── pages/          # LoginPage, RegisterPage, DashboardPage, ProjectDetailPage
│   │   ├── services/       # Axios API client
│   │   └── types/          # TypeScript interface definitions
│   └── package.json
└── server/                 # Node.js + Express + TypeScript + Prisma Backend
    ├── src/
    │   ├── db/             # Prisma Client singleton
    │   ├── middlewares/    # Authentication & Project Role Authorization
    │   ├── routes/         # Auth, Users, Projects, Tasks, Comments, Notifications
    │   ├── socket/         # Socket.IO WebSocket handlers
    │   └── server.ts       # Express app & HTTP listener
    ├── prisma/
    │   ├── schema.prisma   # PostgreSQL Prisma relational schema
    │   └── seed.ts         # Database seed script for test accounts
    └── package.json
```

---

## ⚡ How to Run Locally

### 1. Backend Server Setup (`/server`)

```bash
cd server
npm install

# Generate Prisma Client & Sync Database
npx prisma db push

# Seed Initial Test Data (Alex & Sam)
npm run prisma:seed

# Start Backend Server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Application Setup (`/client`)

```bash
cd client
npm install

# Start Vite Development Server (runs on http://localhost:5173)
npm run dev
```

---

## 🧪 Test Accounts for Multi-User Real-Time Demo

| Name | Email | Password | Role |
| --- | --- | --- | --- |
| Alex Johnson | `alex@taskflow.dev` | `password123` | Owner |
| Sam Rivera | `sam@taskflow.dev` | `password123` | Admin |
| Taylor Chen | `taylor@taskflow.dev` | `password123` | Member |

### Multi-User Verification Steps:
1. Open Browser Window 1 -> Sign in as `alex@taskflow.dev`.
2. Open Browser Window 2 (Incognito) -> Sign in as `sam@taskflow.dev`.
3. Alex creates a task and assigns it to Sam.
4. Sam instantly receives an in-app notification via Socket.IO.
5. Sam drags the task from `To Do` to `In Progress` and posts a comment.
6. Alex's screen updates in real time without refreshing!
