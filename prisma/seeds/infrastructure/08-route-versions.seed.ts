// ================================================================
// INFRASTRUCTURE SEED: Route Versions
// ================================================================
// Purpose: Create initial version for each route
// Dependency: 07-routes.seed.ts
// Tables: RouteVersion
// ================================================================

import { PrismaClient } from '@prisma/client';

export async function seedRouteVersions(prisma: PrismaClient) {
  console.log('📋 Creating Route Versions...');

  const routes = await prisma.route.findMany();

  let created = 0;
  for (const route of routes) {
    try {
      await prisma.routeVersion.create({
        data: {
          route_id: route.id,
          version_number: 1,
          version_name: `Initial Version - ${route.route_code}`,
          effective_from: new Date('2024-01-01'),
          effective_to: null,
          status: 'ACTIVE',
          description: `Initial version of route ${route.route_code}`,
        },
      });
      created++;
    } catch (error) {
      console.warn(`   ⚠️ Could not create version for ${route.route_code}: ${error}`);
    }
  }

  console.log(`✅ ${created} route versions created`);
}