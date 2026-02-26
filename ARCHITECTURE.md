# System Architecture

## Overview

This is a full-stack task management application using a traditional three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 16)                   │
│  • React components with TypeScript                          │
│  • Client-side routing and state management                  │
│  • JWT token handling and API integration                    │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Layer    │
                    │  (HTTP REST)   │
                    └───────┬────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                           │
│  • RESTful API endpoints                                     │
│  • Business logic and validation                             │
│  • JWT authentication and RBAC                               │
│  • Database interaction via Mongoose                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                 Database (MongoDB)                           │
│  • User documents with hashed passwords                      │
│  • Task documents with references to users                   │
└─────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Module Structure

**auth.module.ts**
- Handles user registration and login
- Generates JWT tokens
- Validates credentials with bcrypt
- Provides JWT strategy for Passport

**tasks.module.ts**
- CRUD operations for tasks
- Role-based authorization
- Query filtering and sorting
- Returns properly populated references

### Authentication Flow

```
1. User submits email + password → RegisterDto/LoginDto
2. Backend validates input (class-validator)
3. Password hashed with bcrypt (register) or compared (login)
4. JWT generated with user payload (sub, email, role)
5. Token returned to frontend
6. Frontend stores token in localStorage
7. Subsequent requests include: Authorization: Bearer <token>
8. JwtStrategy decodes and validates token
9. Request.user populated with decoded payload
```

### Authorization (RBAC)

**JwtAuthGuard**
- Validates JWT token exists and is valid
- Throws 401 if missing or expired
- Applied to all protected routes

**RolesGuard**
- Checks user.role against @Roles() metadata
- Throws 403 if user lacks required role
- Used with @Roles('admin') on specific endpoints

**Permission Levels**
- Admin: Access to all resources and actions
- Member: Limited to own resources (created or assigned tasks)

### Database Schemas

**User Schema**
```typescript
{
  name: string,
  email: string (unique),
  password: string (hashed),
  role: 'admin' | 'member' (default: 'member'),
  createdAt: Date,
  updatedAt: Date
}
```

**Task Schema**
```typescript
{
  title: string,
  description: string,
  status: 'todo' | 'in-progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  dueDate: Date | null,
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId | null (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Architecture

### State Management

**AuthContext**
- Stores authenticated user and JWT token
- Methods: login, register, logout
- Persists token to localStorage
- Provides useAuth() hook for components

**Component State**
- Task list, filters managed with React useState
- API calls trigger data re-fetching

### Routing Structure

```
/
├── (auth)                    # Auth layout (centered form)
│   ├── /login
│   └── /register
├── (dashboard)               # Dashboard layout (sidebar + header)
│   └── /dashboard           # Main task management page
└── /                        # Root redirects based on auth state
```

### API Integration

**lib/api.ts**
- Base fetch wrapper with token injection
- Centralized error handling
- Typed responses
- Auth and task service methods

**Error Handling**
- 401: Redirect to login
- 403: Show permission error
- 404: Show not found error
- 500: Generic error message

### Component Hierarchy

```
RootLayout
├── AuthProvider
├── (auth)
│   └── LoginForm / RegisterForm
├── (dashboard)
│   ├── DashboardSidebar
│   ├── DashboardHeader
│   └── Dashboard Page
│       ├── TaskListComponent
│       │   └── TaskCard (repeated)
│       ├── TaskFilters
│       └── TaskDialog
└── ProtectedRoute (wrapper for protected pages)
```

## Key Architectural Decisions

### Why NestJS?
- **Structure**: Clear separation of concerns with modules, controllers, services
- **RBAC**: Built-in decorators and middleware for role-based access
- **Validation**: Class-validator for automatic DTO validation
- **Dependency Injection**: Cleaner, more testable code
- **TypeScript**: Full type safety for backend development

### Why MongoDB + Mongoose?
- **Flexibility**: Schema flexibility for rapid prototyping
- **References**: Mongoose supports references between documents
- **Simplicity**: Easy to get started, good for CRUD applications
- **Performance**: Adequate for small-to-medium workloads
- **Scalability**: Can add sharding if needed later

### Why JWT + Stateless Auth?
- **Scalability**: No server-side session storage needed
- **Microservices**: Easily works across multiple services
- **Mobile-friendly**: Works well with native apps
- **Standard**: Industry-standard approach

### Why Context API (not Redux/Zustand)?
- **Simplicity**: Small app, minimal state management needs
- **No dependencies**: Reduces bundle size
- **Learning curve**: Context API is built-in React
- **Trade-off**: Could migrate to Zustand if complexity grows

### Monolithic Architecture (not Microservices)
- **Scope**: Single application, not multiple independent services
- **Simplicity**: Easier deployment and development
- **Trade-off**: Could split into services if auth becomes bottleneck

## Data Flow

### Creating a Task

```
1. User fills form in TaskDialog
2. Form validated on client
3. POST /tasks with title, description, priority, etc.
4. Request includes Authorization header with token
5. Backend:
   - JwtAuthGuard validates token
   - Extracts userId from token
   - Sets createdBy to current userId
   - Validates DTO with class-validator
   - Saves to MongoDB
   - Populates user references
   - Returns Task document
6. Frontend receives response
7. UI refreshes with new task
```

### Fetching Tasks (with Authorization)

```
1. User navigates to dashboard
2. GET /tasks called with token
3. Backend:
   - JwtAuthGuard validates token
   - Extracts userId and role
   - If admin: return all tasks
   - If member: filter WHERE (createdBy=userId OR assignedTo=userId)
   - Apply optional status/priority filters
   - Return array of Tasks
4. Frontend displays filtered tasks in grid/list
```

### Updating a Task

```
1. User clicks edit on TaskCard
2. TaskDialog opens with existing task data
3. User modifies fields
4. PATCH /tasks/:id with updated fields
5. Backend:
   - Validates token and task ownership
   - If member: only creator can update (RolesGuard logic)
   - Admin can update any task
   - Validates DTO (partial update allowed)
   - Updates document
   - Returns updated Task
6. Frontend refreshes list
```

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Never stored or returned in plain text
- Comparison uses constant-time algorithm (bcrypt handles this)

### JWT Security
- Secret key stored in environment variable
- Token expires after 24 hours
- Payload includes role for quick authorization checks
- Tokens validated on every protected request

### Input Validation
- All DTOs validated with class-validator
- Email must be valid format
- Passwords minimum 6 characters
- Title required for tasks

### Authorization
- JwtAuthGuard ensures user is authenticated
- RolesGuard checks roles for admin endpoints
- Task access checks ensure members only see their tasks
- SQL injection not applicable (using Mongoose, not raw SQL)

## Error Handling

### HTTP Status Codes
- 200: Success (GET, PATCH)
- 201: Resource created (POST)
- 400: Bad request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found (task doesn't exist)
- 500: Server error

### Exception Filters
- BadRequestException: Input validation failures
- UnauthorizedException: Auth failures
- ForbiddenException: Permission denied
- NotFoundException: Resource not found

## Performance Considerations

### Current Optimizations
- **Indexing**: MongoDB should index email and createdBy fields
- **Population**: Only populate user references when needed
- **Filtering**: Filters applied at database level, not in memory
- **Token caching**: Frontend caches token in localStorage

### Future Optimizations
- Add Redis caching for frequently accessed tasks
- Implement pagination for large task lists
- Add request rate limiting
- Optimize MongoDB queries with explain()
- Consider GraphQL for flexible queries

## Scalability Path

### Phase 1 (Current)
- Single NestJS server
- Single MongoDB instance
- All users' tasks in single collection

### Phase 2
- Add Redis cache layer
- Implement pagination
- Add background job queue for email notifications

### Phase 3
- Horizontal scaling: Load balance multiple NestJS instances
- Database sharding by userId
- Separate read replicas for reporting

### Phase 4
- Microservices: Auth service, Task service, Notification service
- Message queue for inter-service communication
- Separate databases per service

## Testing Strategy (Future)

### Unit Tests
- Service methods with mocked dependencies
- Guard and decorator logic
- Validation edge cases

### Integration Tests
- Full request/response cycles
- Database operations
- Auth flows

### E2E Tests
- Complete user workflows
- Frontend + backend integration
- Role-based access scenarios

## Deployment

### Backend Deployment
```bash
# Build
npm run build

# Start production
npm run start:prod
```

### Frontend Deployment
```bash
# Build
npm run build

# Vercel deployment
vercel deploy
```

### Environment Setup
- Set all .env variables in production platform
- Ensure MongoDB connection string is production database
- JWT_SECRET should be strong, random 32+ character string
- FRONTEND_URL should be production frontend domain

## Monitoring & Debugging

### Logs
- All errors logged to console
- Consider Winston for file logging in production
- Debug mode: `DEBUG=* npm run start:dev`

### Metrics to Monitor
- API response times
- Task creation success rate
- Authentication failures
- Database query performance
- MongoDB connection pool status

## Trade-offs Made

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| JWT Auth | Scalable, stateless | Token size in requests |
| Monolithic | Simpler deployment | Single point of failure |
| MongoDB | Flexible schema | No ACID transactions |
| Context API | No extra deps | Limited for complex state |
| REST API | Standard, easy | Not as efficient as GraphQL |
| Class-validator | Automatic validation | Adds decorators complexity |
| RolesGuard at handler level | Flexible control | Requires explicit setup per route |

## Maintenance & Debugging

### Common Issues

**Tasks show 403 error:**
- Check user role and task ownership
- Verify token hasn't expired
- Check task createdBy vs current userId

**MongoDB connection errors:**
- Verify connection string format
- Check network connectivity
- Ensure MongoDB service is running

**Token errors:**
- Clear localStorage and re-login
- Check JWT_SECRET matches between sessions
- Verify token expiration time

