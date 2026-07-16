# SBTS Backend

AI-Based Smart Bus Transportation System — Backend Service

## Tech Stack

- **Runtime**: Node.js 20+ (LTS)
- **Language**: TypeScript 5.5
- **Framework**: Express 4
- **ORM**: Prisma 5 + PostgreSQL 15+
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit, bcryptjs, jsonwebtoken
- **Logging**: Winston

## Project Structure

```
src/
├── common/               # Shared utilities
│   ├── asyncHandler.ts   # Wrap async route handlers
│   ├── errors.ts         # Custom error classes (AppError hierarchy)
│   ├── logger.ts         # Winston logger configuration
│   ├── response.ts       # Standardized API response format
│   ├── testAuth.ts       # ⚠️ Dev-only auth stub (removed after Auth module)
│   ├── types.ts          # Shared TypeScript types
│   └── validate.ts       # Zod validation middleware
├── config/
│   └── index.ts          # Environment configuration with strict validation
├── modules/              # Domain modules (one folder per module)
│   └── rbac/             # Module 2 — RBAC (built first, gates everything)
│       ├── rbac.controller.ts
│       ├── rbac.middleware.ts
│       ├── rbac.routes.ts
│       ├── rbac.service.ts
│       ├── rbac.types.ts
│       └── rbac.validation.ts
├── prisma/
│   ├── client.ts         # Singleton PrismaClient with graceful shutdown
│   ├── schema.prisma     # Complete 27-table schema (locked upfront)
│   ├── seed.ts           # Seed roles, permissions, mappings
│   └── migrations/       # Raw SQL additions for partial indexes
├── app.ts                # Express app configuration + global error handler
└── server.ts             # Bootstrap + DB connection verification
```

## Quick Start

### 1. Install dependencies

```bash
cd apps/backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Database setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Apply raw SQL additions (partial indexes)
psql $DATABASE_URL -f src/prisma/migrations/000000000000_init/migration.sql

# Seed roles & permissions
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Server starts on `http://localhost:4000`.

## Module 2 — RBAC (Complete)

### Tables Owned
- `permissions`
- `roles`
- `role_permissions`
- `user_roles`

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|---------------------|-------------|
| POST | `/api/v1/rbac/roles` | `manage_roles` | Create a new role |
| GET | `/api/v1/rbac/roles` | `view_roles` | List all roles (opt-in permissions) |
| GET | `/api/v1/rbac/roles/:id` | `view_roles` | Get role by ID |
| PATCH | `/api/v1/rbac/roles/:id` | `manage_roles` | Update role |
| DELETE | `/api/v1/rbac/roles/:id` | `manage_roles` | Soft-delete role (blocked if assigned) |
| GET | `/api/v1/rbac/permissions` | `view_roles` | List permissions (filterable) |
| POST | `/api/v1/rbac/roles/:id/permissions` | `manage_roles` | Attach permission to role |
| DELETE | `/api/v1/rbac/roles/:id/permissions/:permissionId` | `manage_roles` | Detach permission |
| POST | `/api/v1/rbac/users/:id/roles` | `assign_roles` | Assign role to user |
| DELETE | `/api/v1/rbac/users/:id/roles/:roleId` | `assign_roles` | Remove role from user |
| GET | `/api/v1/rbac/users/:id/roles` | `view_roles` | List user's roles |

### Middleware

```typescript
import { requirePermission } from '@/modules/rbac';

// Single permission
router.post('/buses', requirePermission('manage_fleet'), createBus);

// Any of multiple
router.post('/reports', requireAnyPermission('generate_report', 'view_reports'), ...);

// All of multiple
router.delete('/trips', requireAllPermissions('cancel_trip', 'manage_schedules'), ...);
```

### Conflict Prevention

- **Role name uniqueness**: Caught at service layer, returns `409 ROLE_NAME_EXISTS` with field-level detail.
- **Duplicate permission assignment**: Catches `P2002` unique violation on `(role_id, permission_id)`, returns `409 PERMISSION_ALREADY_ASSIGNED`.
- **Duplicate role assignment**: Catches `P2002` unique violation on `(user_id, role_id)`, returns `409 ROLE_ALREADY_ASSIGNED`.
- **Delete protection**: Cannot soft-delete a role that still has `user_roles` entries.

### Seed Data

Running `npm run db:seed` creates:

| Role | Permissions |
|------|-------------|
| `admin` | All 30+ permissions |
| `driver` | `view_*`, `start_trip`, `end_trip`, `report_incident` |
| `passenger` | `view_routes`, `view_terminals`, `view_schedules`, `view_pricing`, `view_predictions` |

### Dev Auth Stub

Since **Module 1 (Auth & Session)** is not yet built, a `devAuth` middleware is active in development mode only. It auto-populates `req.user` as an admin so RBAC endpoints can be tested immediately. This stub is **removed** once Auth is implemented.

## Error Handling

All errors follow the standardized response format:

```json
{
  "success": false,
  "message": "Role \"admin\" already exists",
  "error": {
    "code": "ROLE_NAME_EXISTS",
    "details": {
      "field": "roleName",
      "value": "admin"
    }
  }
}
```

Prisma errors are intercepted by the global error handler:
- `P2002` → `409 CONFLICT`
- `P2003` → `409 CONFLICT` (FK violation)
- `P2025` → `404 NOT_FOUND`
- Other `P*` → `500 DATABASE_ERROR`

## Next Module

**Module 1 — Auth & Session** (depends on RBAC roles existing)
- `POST /auth/register` (passenger self-registration)
- `POST /auth/login` (JWT issuance with role/permission cache)
- `POST /auth/logout` (login_history write)
- `POST /auth/refresh`
- `GET /auth/me`

**Ready to proceed?** Confirm and I'll build Auth & Session next.
