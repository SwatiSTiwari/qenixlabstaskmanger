# ARCHITECTURE.md

---

## 1. System Overview

TaskFlow is a full-stack task management application that lets authenticated users create, assign, filter, and track tasks in real time. It is built across three layers that communicate over HTTP and WebSockets.

The **Next.js 16 frontend** (port 3000) is a React single-page app. It stores the JWT in `localStorage`, attaches it to every REST call via an `Authorization: Bearer` header, and simultaneously maintains a persistent Socket.IO connection to receive live task events without polling.

The **NestJS backend** (port 3001) exposes a REST API for CRUD operations and a Socket.IO gateway on the `/tasks` namespace. Every REST route is guarded by `JwtAuthGuard`, which validates the token with PassportJS before the controller runs. The same JWT is verified inside the WebSocket gateway's middleware so unauthenticated sockets are rejected before connection is established. Business logic is organised into two NestJS modules — `AuthModule` and `TasksModule`.

**MongoDB** (via Mongoose) is the persistence layer. It holds two collections: `users` (hashed credentials + role) and `tasks` (content + ObjectId references to users). Mongoose population resolves `createdBy` and `assignedTo` fields into full user objects before responses are returned.

---

## 2. Folder Structure

```
taskmanager/                     ← Next.js frontend root
├── app/
│   ├── layout.tsx               ← Root layout: wraps AuthProvider + Toaster
│   ├── page.tsx                 ← Root redirect (→ /dashboard or /login)
│   ├── (auth)/                  ← Route group with centered auth layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/             ← Route group with sidebar+header layout
│       └── dashboard/page.tsx   ← Main task page with real-time integration
├── components/
│   ├── auth/                    ← LoginForm, RegisterForm
│   ├── layout/                  ← DashboardSidebar, DashboardHeader
│   ├── tasks/                   ← TaskCard, TaskList, TaskDialog, TaskFilters
│   └── ui/                      ← shadcn/ui primitives (button, badge, etc.)
├── context/
│   └── AuthContext.tsx          ← Global auth state (user, token, login, logout)
├── hooks/
│   ├── use-task-socket.ts       ← Socket.IO client hook (real-time events)
│   └── use-toast.ts
├── lib/
│   ├── api.ts                   ← Typed fetch wrapper + authService/taskService
│   └── utils.ts
├── types/
│   ├── auth.ts                  ← User, AuthContextType interfaces
│   └── task.ts                  ← Task, TaskStatus, TaskPriority enums
└── public/                      ← Static assets (custom SVG favicon)

backend/                         ← NestJS backend root
└── src/
    ├── main.ts                  ← Bootstrap: IoAdapter, CORS, ValidationPipe
    ├── app.module.ts            ← Root module: ConfigModule, MongooseModule
    ├── auth/
    │   ├── auth.module.ts       ← Imports JwtModule, PassportModule
    │   ├── auth.controller.ts   ← POST /auth/register, POST /auth/login
    │   ├── auth.service.ts      ← bcrypt hash/compare, JWT sign
    │   ├── dto/index.ts         ← RegisterDto, LoginDto, AuthResponseDto
    │   └── strategies/
    │       └── jwt.strategy.ts  ← Extracts and validates Bearer token
    ├── tasks/
    │   ├── tasks.module.ts      ← Imports MongooseModule + JwtModule
    │   ├── tasks.controller.ts  ← REST handlers (all behind JwtAuthGuard)
    │   ├── tasks.service.ts     ← Business logic + emits WebSocket events
    │   ├── tasks.gateway.ts     ← @WebSocketGateway /tasks, JWT middleware
    │   ├── dto/index.ts         ← CreateTaskDto, UpdateTaskDto
    │   └── schemas/
    │       └── task.schema.ts   ← Mongoose Task schema
    ├── users/
    │   └── schemas/
    │       └── user.schema.ts   ← Mongoose User schema
    └── common/
        ├── decorators/
        │   ├── current-user.decorator.ts  ← Extracts req.user into param
        │   └── roles.decorator.ts         ← @Roles() metadata setter
        └── guards/
            ├── jwt-auth.guard.ts          ← Validates JWT on every request
            └── roles.guard.ts             ← Checks role metadata
```

**Why this structure?**
The frontend uses Next.js route groups `(auth)` and `(dashboard)` so each section gets its own layout without the group name appearing in the URL. Components are split by domain (auth, tasks, layout, ui) rather than by type so related files stay together. The backend follows NestJS convention — one folder per module, each containing its controller, service, gateway, DTOs, and schema. `common/` holds cross-cutting concerns (guards, decorators) that do not belong to any single module.

---

## 3. Database Schema

### User Schema — `users` collection

```typescript
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;
  // Display name shown in the UI header and task cards.

  @Prop({ required: true, unique: true })
  email: string;
  // Login identifier. The unique index is enforced at the MongoDB level.

  @Prop({ required: true })
  password: string;
  // bcrypt hash (cost factor 10). Never returned in any response.

  @Prop({ enum: UserRole, default: UserRole.MEMBER })
  role: 'admin' | 'member';
  // Controls RBAC: admins see all tasks; members see only their own.

  createdAt: Date;  // Auto-set by { timestamps: true }
  updatedAt: Date;  // Auto-updated by { timestamps: true }
}
```

### Task Schema — `tasks` collection

```typescript
@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;
  // Short task name — required field, displayed as the card heading.

  @Prop({ default: '' })
  description: string;
  // Optional longer details. Defaults to empty string so the field always exists.

  @Prop({ enum: TaskStatus, default: TaskStatus.TODO })
  status: 'todo' | 'in-progress' | 'done';
  // Lifecycle state. Drives the colour of the status badge on TaskCard.

  @Prop({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: 'low' | 'medium' | 'high';
  // Used for frontend filtering and the priority badge colour.

  @Prop({ type: Date, default: null })
  dueDate: Date | null;
  // Optional deadline. Stored as null when the user does not provide one.

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
  // Set to req.user.userId on creation. Used for ownership checks
  // (members can only update/delete tasks they created).

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId | null;
  // Optional — a second user who can view and work on the task.
  // Members who are assigned a task can read it even if they did not create it.

  createdAt: Date;  // Auto-set by { timestamps: true }
  updatedAt: Date;  // Auto-updated by { timestamps: true }
}
```

Both `createdBy` and `assignedTo` are Mongoose refs. The service always calls `.populate('createdBy assignedTo', 'name email')` before returning data so the frontend receives full user objects instead of raw ObjectIds.

---

## 4. API Endpoints

### Auth — no token required

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| `POST` | `/auth/register` | `{ name, email, password, role? }` | `{ token, user: { id, name, email, role } }` |
| `POST` | `/auth/login` | `{ email, password }` | `{ token, user: { id, name, email, role } }` |

### Tasks — JWT required on every route (`Authorization: Bearer <token>`)

| Method | Path | Query / Body | Response |
|--------|------|-------------|----------|
| `GET` | `/tasks` | Query: `status?`, `priority?`, `sortBy?`, `order?` | `Task[]` (role-filtered) |
| `GET` | `/tasks/:id` | — | `Task` |
| `POST` | `/tasks` | `{ title, description?, priority?, dueDate?, assignedTo? }` | `Task` (created) |
| `PATCH` | `/tasks/:id` | Any subset of task fields, including `status` | `Task` (updated) |
| `DELETE` | `/tasks/:id` | — | `{ message: "Task deleted successfully" }` |

**Role filtering on `GET /tasks`:**
- `admin` — returns every task in the database
- `member` — returns tasks where `createdBy = userId` OR `assignedTo = userId`

**Ownership rules on `PATCH` / `DELETE`:**
- `admin` — can modify any task
- `member` — can only modify tasks where `createdBy = userId`; assignees can read but not mutate

### WebSocket Gateway — namespace `/tasks`

Connection handshake must include `{ auth: { token } }`. Unauthenticated connections receive an error and are dropped.

| Event (server → client) | Payload | When emitted |
|--------------------------|---------|--------------|
| `task.created` | Full populated `Task` object | After successful `POST /tasks` |
| `task.updated` | Full populated `Task` object | After successful `PATCH /tasks/:id` |
| `task.deleted` | `{ taskId: string }` | After successful `DELETE /tasks/:id` |

---

## 5. Auth Flow

### Register

```
1. User submits RegisterForm → POST /auth/register { name, email, password, role }
2. RegisterDto validated by class-validator (email format, password ≥ 6 chars)
3. AuthService queries MongoDB for existing email → 409 ConflictException if found
4. Password hashed: bcrypt.hash(password, 10)
5. User document created in MongoDB
6. JWT signed: jwtService.sign({ sub: user._id, email, role })
7. Response: { token, user: { id, name, email, role } }
8. Frontend: localStorage.setItem('token', token)
9. AuthContext sets user + token in React state
10. Router redirects to /dashboard
```

### Login

```
1. User submits LoginForm → POST /auth/login { email, password }
2. LoginDto validated
3. AuthService queries MongoDB by email → 401 UnauthorizedException if not found
4. bcrypt.compare(plain, hash) → 401 if mismatch
5. JWT signed with same payload shape → steps 7–10 identical to register
```

### Accessing a Protected REST Route

```
1. Frontend calls taskService.getTasks(filters, token)
2. lib/api.ts injects header: Authorization: Bearer <token>
3. JwtAuthGuard intercepts the incoming request
4. PassportJS JwtStrategy extracts the token from the Authorization header
5. jwtService.verify(token, JWT_SECRET) decodes the payload
6. Strategy.validate() returns { userId, email, role } → stored as req.user
7. @CurrentUser() decorator pulls req.user into the controller parameter
8. If token is missing, malformed, or expired → 401 Unauthorized
```

### WebSocket Authentication

```
1. useTaskSocket hook: io('http://localhost:3001/tasks', { auth: { token } })
2. TasksGateway.afterInit() registers a server.use() middleware
3. Middleware reads socket.handshake.auth.token
4. jwtService.verify(token, JWT_SECRET) called synchronously
5. Decoded user attached to socket as socket.user
6. next() called → connection accepted → handleConnection fires
7. If token is missing or invalid → next(new Error(...)) → socket is rejected
8. Frontend connect_error listener catches this and shows a toast; stops reconnecting
```

### Token Lifecycle

- Stored in `localStorage` and rehydrated into `AuthContext` on every page load via `useEffect`
- Expiry controlled by the `JWT_EXPIRATION` env var (default `24h`)
- On logout: `localStorage` cleared, React state reset, Socket.IO disconnected (the `useTaskSocket` hook exits early when `token` is `null`)

---

## 6. AI Tools Used

**Tool: GitHub Copilot (Claude Sonnet) — used throughout**

| Area | What was AI-generated | What I reviewed / changed |
|------|-----------------------|--------------------------|
| `tasks.gateway.ts` | Full WebSocket gateway scaffold with `@WebSocketGateway`, connection handlers, JWT middleware, and emit methods | Removed unnecessary `@SubscribeMessage` handlers (the gateway only broadcasts; it never listens to client messages). Added proper `forwardRef()` to break the circular dependency with `TasksService`. |
| `hooks/use-task-socket.ts` | Socket.IO client hook with reconnection logic and Sonner toasts | Initial version listed the callback props as `useEffect` dependencies, causing the socket to reconnect on every render. Fixed by storing callbacks in `useRef` so only `token` changes trigger a reconnect. |
| `dashboard/page.tsx` real-time integration | `useTaskSocket` wiring, Live/Offline badge, handler stubs | Initial handlers called `fetchTasks()` on every WebSocket event, defeating the point of real-time updates. Rewrote to use in-place `setTasks()` mutations (add to front, replace by `_id`, filter out by `_id`). |
| `tasks.module.ts` | Module scaffold | Had to manually add `JwtModule` import (needed by the gateway for `JwtService`) and export `TasksGateway`. |
| `main.ts` | Bootstrap code | Added `app.useWebSocketAdapter(new IoAdapter(app))` which was missing from the generated version. |
| Initial boilerplate | Auth module, tasks module, schemas, DTOs, guards, decorators | Reviewed every file for correctness; adjusted field defaults, enum values, and error messages to match the required behaviour. |
| `DashboardSidebar.tsx` | Nav item list | Caught and fixed the duplicate `key={item.href}` bug that caused a React console error (both items shared the same href). Changed to `key={item.label}`. |

---

## 7. Decisions & Trade-offs

### JWT in `localStorage` vs `httpOnly` cookie

**Decision:** `localStorage`
**Reason:** Simple to implement, works seamlessly with the fetch-based API client, and the token is accessible to the Socket.IO handshake (cookies require extra configuration with Socket.IO). Sufficient for an assessment context.
**Trade-off:** Vulnerable to XSS in theory. `httpOnly` cookies are more secure because JavaScript cannot read them. With more time I would migrate to `httpOnly` cookies with a `/auth/refresh` endpoint and CSRF protection.

---

### REST + WebSocket vs GraphQL Subscriptions

**Decision:** REST for mutations/queries, Socket.IO for real-time.
**Reason:** REST is explicit and well-understood. Socket.IO integrates cleanly with NestJS `@WebSocketGateway`. Each tool does one job well.
**Trade-off:** Two separate connection types on the client. GraphQL subscriptions would unify queries and real-time into one protocol but add significant setup complexity (schema, resolvers, Apollo).

---

### Binary roles (admin / member) only

**Decision:** Two roles — `admin` sees and modifies everything, `member` sees only their own tasks.
**Reason:** Covers the stated requirements cleanly with a single `if (role !== UserRole.ADMIN)` check.
**Trade-off:** No intermediate roles (e.g. team lead, viewer). A real product would likely need a permissions table rather than a hard-coded enum.

---

### No pagination on `GET /tasks`

**Decision:** Return all matching tasks in one query.
**Reason:** Fine for a small dataset in an assessment. Keeps the frontend simpler.
**Trade-off:** Slow and data-heavy as task count grows. With more time I would add cursor-based pagination (`?cursor=<lastId>&limit=20`) on the API and infinite scroll in the UI.

---

### In-place state updates on WebSocket events vs re-fetching

**Decision:** Mutate the `tasks` array directly inside socket event handlers.
**Reason:** Re-fetching on every event causes a visible flicker and unnecessary database load under concurrent users.
**Trade-off:** The frontend state can briefly be out of sync with the server's access-control rules (e.g. a member briefly sees a task emitted to them that the REST endpoint would have filtered out). Acceptable for this use case; would be addressed with per-user rooms in a production system.

---

### Monorepo (single repo, two folders) vs separate repositories

**Decision:** Both frontend and backend in one repository.
**Reason:** Simpler submission, no cross-repo coordination.
**Trade-off:** The frontend `tsconfig.json` picks up backend source files and shows spurious NestJS decorator errors. In production I would use Turborepo or Nx with a shared `@taskflow/types` package, or keep them as separate repositories.

---

### What I would improve with more time

1. **Pagination** — cursor-based API, infinite scroll on the frontend
2. **`httpOnly` cookie auth** — more secure token storage, prevents XSS token theft
3. **Optimistic UI updates** — update state before the server confirms, roll back on error
4. **Unit + E2E tests** — Jest for service/guard logic, Playwright for full user workflows
5. **Per-user Socket.IO rooms** — emit `task.created/updated/deleted` only to users who are allowed to see that task, rather than broadcasting to everyone
6. **Rate limiting** — `@nestjs/throttler` on `/auth/login` and `/auth/register` to prevent brute-force
7. **MongoDB indexes** — explicit compound indexes on `createdBy + status`, `assignedTo + status` for query performance at scale
