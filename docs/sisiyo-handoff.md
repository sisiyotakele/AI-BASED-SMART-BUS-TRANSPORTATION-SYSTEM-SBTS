# SBTS Handoff for Sisiyo

## Project Overview
SBTS is a smart bus transportation system monorepo built with TypeScript, Prisma, React, and Python services. The project is organized into three main app areas:
- Passenger app
- Staff app
- Backend API
- AI service

## Your Role as the Next Developer
Your task is to help move the project from scaffold/stub state into a working, testable first version.

## Current State Summary
The repository already includes:
- A monorepo structure in the root
- Backend modules under [apps/backend/src/modules](../apps/backend/src/modules)
- Prisma schema in [prisma/schema.prisma](../prisma/schema.prisma)
- Frontend apps in [apps/passenger-app/src](../apps/passenger-app/src) and [apps/staff-app/src](../apps/staff-app/src)
- An AI service in [apps/ai-service/app](../apps/ai-service/app)

However, several core parts are still incomplete or placeholder-based, especially in the backend.

## What Is Already Present
### Backend
- Module folders for auth, users, trips, tracking, notifications, incidents, and more
- Prisma models for users, routes, trips, buses, drivers, incidents, tracking events, and predictions
- JWT support in the auth service

### Frontend
- Passenger app scaffold
- Staff app scaffold
- Basic Vite-based app setup

### AI Service
- Python service structure with prediction-related modules

## What Needs Immediate Attention
The most important work areas for the next phase are:
1. Finish authentication flow
2. Connect the backend to real Prisma data
3. Implement at least one end-to-end user flow
4. Add request validation and error handling
5. Make the backend and apps runnable with clear setup instructions

## Suggested First Milestone
A good first milestone is:
- User can sign in
- Backend returns a valid response
- One route or trip can be retrieved
- The frontend can display the result

## Recommended Starting Tasks
### Priority 1: Backend foundation
- Implement the auth login flow with real validation
- Connect auth service to Prisma
- Add proper error responses
- Ensure the server can start successfully

### Priority 1.1: Database integration
- Set `DATABASE_URL` for a local/Postgres database
- Run Prisma generation and migrations from `apps/backend`
- Seed the database with an initial admin user
- Verify `/api/auth/login` and `/api/auth/register` against Postgres
- Remove or reduce in-memory demo fallback once DB auth works

### Priority 2: Core module implementation
- Implement one module fully, such as auth or trips
- Keep controllers thin and move logic into services
- Add validation for incoming requests

### Priority 3: Frontend integration
- Hook the frontend to the backend API
- Display a simple route or trip response
- Handle loading and error states

### Priority 4: Testing and quality
- Add basic tests for critical logic
- Keep code readable and consistent
- Follow the project standards discussed earlier

## Suggested Folder Focus
- Backend entry points: [apps/backend/src/app.ts](../apps/backend/src/app.ts) and [apps/backend/src/server.ts](../apps/backend/src/server.ts)
- Auth implementation: [apps/backend/src/modules/auth](../apps/backend/src/modules/auth)
- Prisma schema: [prisma/schema.prisma](../prisma/schema.prisma)
- Passenger app: [apps/passenger-app/src](../apps/passenger-app/src)
- Staff app: [apps/staff-app/src](../apps/staff-app/src)

## Setup Notes
### Install dependencies
Run the project install from the root.

### Backend
Use the backend package scripts from [apps/backend/package.json](../apps/backend/package.json).

### Frontend apps
Use the app-level scripts from:
- [apps/passenger-app/package.json](../apps/passenger-app/package.json)
- [apps/staff-app/package.json](../apps/staff-app/package.json)

### AI service
Use the Python service entry configured in [apps/ai-service/package.json](../apps/ai-service/package.json).

## Working Guidelines
Please follow these principles while working:
- Keep controllers thin
- Move business logic into services
- Use validation for all incoming requests
- Use meaningful names for files and functions
- Keep code readable and maintainable
- Avoid large, overly complex files

## Suggested Definition of Done for the First Sprint
A task is considered done when:
- The feature works locally
- The code is understandable and organized
- The relevant route or module is functional
- Errors are handled properly
- The work is documented clearly enough for the next person


## Best First Task
Start with the authentication flow and make sure it works end to end.
