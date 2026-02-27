# TaskFlow - Full-Stack Task Manager

A production-ready full-stack task management application with modern UI, built with NestJS, MongoDB Atlas, and Next.js 16.

## Tech Stack

**Backend:**

- NestJS 10 - Node.js framework with TypeScript
- MongoDB Atlas - Managed NoSQL database in the cloud
- Mongoose - MongoDB object modeling
- JWT - Stateless authentication with Passport.js

**Frontend:**

- Next.js 16 - React framework with App Router
- TypeScript - Type-safe development
- shadcn/ui - Premium component library
- Tailwind CSS v4 - Modern utility-first styling
- Lucide Icons - Beautiful icon system

## Features

### Core Functionality

- **User Authentication**: Register and login with JWT tokens
- **Task Management**: Create, read, update, and delete tasks
- **Role-Based Access Control (RBAC)**: Admin and Member roles with different permissions
- **Task Filtering**: Filter by status, priority, and other attributes
- **Responsive UI**: Mobile-friendly design with shadcn/ui components

### RBAC Permissions

- **Admin**: Can view all tasks, edit/delete any task, assign tasks to team members
- **Member**: Can only manage tasks they created or are assigned to

## Project Structure

```
.
├── backend/                      # NestJS backend
│   ├── src/
│   │   ├── auth/                # Authentication module
│   │   ├── tasks/               # Task management module
│   │   ├── users/               # User schemas
│   │   ├── common/              # Shared guards, decorators
│   │   ├── config/              # Database configuration
│   │   └── main.ts              # Application entry point
│   ├── .env                     # Environment variables
│   └── package.json
│
├── app/                         # Next.js frontend (existing structure)
├── components/                  # React components
├── context/                     # React context providers
├── types/                       # TypeScript type definitions
├── lib/                         # Utility functions
└── package.json
```

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```
2. **Install dependencies:**

   ```bash
   pnpm install
   ```
3. **Set up MongoDB Atlas:**

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account or sign in
   - Create a new cluster (free tier available)
   - Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
   - Replace `username` and `password` with your credentials
4. **Configure environment variables:**
   Copy `.env.example` to `.env` and add your MongoDB Atlas connection string:

   ```bash
   cp .env.example .env
   ```

   Update `MONGODB_URI` with your MongoDB Atlas connection string.
5. **Seed the database (optional):**

   ```bash
   pnpm run seed
   ```

   This creates demo users:

   - Admin user: `admin@task.com` / password `admin123`
   - Member user: `member1@task.com` / password `member123`
   - 4 sample tasks with various statuses
6. **Start the development server:**

   ```bash
   pnpm run start:dev
   ```

   Backend runs on `http://localhost:3001`

### Frontend Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```
2. **Set environment variables:**
   Create `.env.local`:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
3. **Start development server:**

   ```bash
   pnpm run dev
   ```

   Frontend runs on `http://localhost:3000`

## Running Both Services

**Terminal 1 - Backend:**

```bash
cd backend
pnpm run start:dev
```

**Terminal 2 - Frontend:**

```bash
pnpm run dev
```

## API Documentation

### Authentication Endpoints

**POST /auth/register**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**POST /auth/login**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "member"
  }
}
```

### Task Endpoints

All task endpoints require JWT authentication via `Authorization: Bearer <token>` header.

**POST /tasks** - Create task

```json
{
  "title": "Implement feature",
  "description": "Add new feature to dashboard",
  "priority": "high",
  "dueDate": "2026-03-15"
}
```

**GET /tasks** - List tasks (with optional filters)

```
GET /tasks?status=todo&priority=high&sortBy=dueDate&order=asc
```

**GET /tasks/:id** - Get single task

**PATCH /tasks/:id** - Update task

```json
{
  "status": "in-progress",
  "priority": "medium"
}
```

**DELETE /tasks/:id** - Delete task

## Demo Credentials

Use these accounts to test the application:

| Role   | Email            | Password  |
| ------ | ---------------- | --------- |
| Admin  | admin@task.com   | admin123  |
| Member | member1@task.com | member123 |
| Member | member2@task.com | member123 |

## Build for Production

### Backend

```bash
cd backend
pnpm run build
pnpm run start:prod
```

### Frontend

```bash
pnpm run build
pnpm start
```

## Environment Variables

## Architecture Notes

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design, decision explanations, and trade-offs.

## Common Issues

**MongoDB connection failed:**

- Ensure MongoDB is running
- Check MONGODB_URI in .env is correct
- Default: `mongodb://localhost:27017/taskmanager`

**API calls returning 401:**

- Token has expired (7d default)
- User is not authenticated
- Clear localStorage and login again

**CORS errors:**

- Frontend must be on configured origin (default: http://localhost:3000)
- Check CORS settings in main.ts

## Development

### Adding a New Endpoint

1. Create a new controller method in the appropriate module
2. Add necessary guards (JwtAuthGuard, RolesGuard)
3. Use @Roles() decorator to specify required roles
4. Add DTOs for validation
5. Add corresponding API client method in `lib/api.ts`

### Debugging

Enable debug logs in NestJS:

```bash
DEBUG=* pnpm run start:dev
```

## License

MIT
