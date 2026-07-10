# SBTS

SBTS (Smart Bus Transportation System) monorepo scaffold.

## Workspace layout

- `apps/backend` for Express + Socket.IO APIs.
- `apps/ai-service` for Python ML endpoints.
- `apps/passenger-app` for the public passenger experience.
- `apps/staff-app` for the combined driver and admin portal.
- `packages/shared-types`, `packages/api-client`, and `packages/ui-kit` for shared code.

## Team ownership notes

- Sonte: backend auth, users/RBAC, trips, assignments, audit, DevOps.
- Sisiyo: backend tracking, predictions proxy, AI service, API client.
- Abissinya: passenger app and QA.
- Bitanya: staff app and docs.
- Biruk: routes/stops, pricing, schedules, fleet, notifications/incidents, Prisma schema.

## Status

This repository is scaffolded with stub modules and placeholder exports so each team can implement its slice incrementally.
