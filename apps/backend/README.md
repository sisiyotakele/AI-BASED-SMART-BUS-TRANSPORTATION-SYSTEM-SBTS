# Backend - SBTS

This document explains how to run the backend locally (development and quick demo).

## Prerequisites
- Node.js LTS (>=18)
- npm

## Setup
From repository root:

```bash
npm install
```

## Environment
Create a `.env` in the root or set env vars. Minimal values for demo:

```
PORT=3000
JWT_SECRET=your-secret
# DATABASE_URL not required for demo login
```

## Build
Compile TypeScript into `apps/backend/dist`:

```bash
npm --workspace apps/backend run build
```

## Run (production-like)
Start the compiled server:

```bash
node apps/backend/dist/server.js
```

## Run (development)
Use the dev script (nodemon):

```bash
npm --workspace apps/backend run dev
```

## Demo login
Use one of the demo users to get a JWT token:

- `admin@example.com` / `admin123`
- `driver@example.com` / `driver123`
- `passenger@example.com` / `passenger123`

Example (PowerShell):

```powershell
$body = '{"email":"admin@example.com","password":"admin123"}'
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
```

Example (curl):

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Run tests

The repo uses Node's built-in test runner. From the `apps/backend` folder run:

```bash
npm --workspace apps/backend run build
node --test test/auth.service.test.js
```

The tests exercise `loginUser` against the compiled `dist` output.

## Database-backed auth

To enable the real database path, set `DATABASE_URL` and run Prisma commands from `apps/backend`:

```bash
npm --workspace apps/backend run prisma:generate
npm --workspace apps/backend run prisma:migrate
npm --workspace apps/backend run seed
```

If you want to use Prisma without migrations first, use:

```bash
npm --workspace apps/backend run prisma:dbpush
npm --workspace apps/backend run seed
```

Then build and start:

```bash
npm --workspace apps/backend run build
node apps/backend/dist/server.js
```

## Notes
- This demo login uses in-memory demo users when `DATABASE_URL` is not set.
- When the database is configured, auth will use Prisma and hashed passwords.
