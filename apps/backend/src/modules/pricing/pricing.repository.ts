import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';

// Allow prisma client to be injected for testing
let prisma: PrismaClient = defaultPrisma;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// PRICE QUERIES
// ============================================================

const priceInclude = {
    route: true,
    fromStop: true,
    toStop: true
};

export async function findPrices(where: Prisma.PriceWhereInput, skip: number, take: number) {
    return prisma.price.findMany({
        where,
        include: priceInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take
    });
}

export async function countPrices(where: Prisma.PriceWhereInput) {
    return prisma.price.count({ where });
}

export async function findPriceById(id: string) {
    return prisma.price.findFirst({
        where: { id, deletedAt: null },
        include: priceInclude
    });
}

export async function findActivePrice(
    routeId: string,
    fromStopId: string,
    toStopId: string,
    now: Date
) {
    return prisma.price.findFirst({
        where: {
            routeId,
            fromStopId,
            toStopId,
            deletedAt: null,
            effectiveFrom: { lte: now },
            OR: [
                { effectiveUntil: null },
                { effectiveUntil: { gte: now } }
            ]
        },
        include: priceInclude
    });
}

export async function findPricesByRoute(routeId: string) {
    return prisma.price.findMany({
        where: { routeId, deletedAt: null },
        include: priceInclude,
        orderBy: { effectiveFrom: 'asc' }
    });
}

export async function findExistingPrice(
    routeId: string,
    fromStopId: string,
    toStopId: string
) {
    return prisma.price.findFirst({
        where: {
            routeId,
            fromStopId,
            toStopId,
            deletedAt: null
        }
    });
}

export async function countActivePrices(now: Date) {
    return prisma.price.count({
        where: {
            deletedAt: null,
            effectiveFrom: { lte: now },
            OR: [
                { effectiveUntil: null },
                { effectiveUntil: { gte: now } }
            ]
        }
    });
}

export async function createPrice(data: Prisma.PriceCreateInput) {
    return prisma.price.create({
        data,
        include: priceInclude
    });
}

export async function updatePrice(id: string, data: Prisma.PriceUpdateInput) {
    return prisma.price.update({
        where: { id },
        data,
        include: priceInclude
    });
}

export async function softDeletePrice(id: string) {
    return prisma.price.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: priceInclude
    });
}
