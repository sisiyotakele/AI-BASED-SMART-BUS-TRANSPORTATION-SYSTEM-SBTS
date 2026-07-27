// src/modules/pricing/pricing.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/common/logger';
import { NotFoundError, ConflictError, ValidationError } from '@/common/errors';
import * as repository from './pricing.repository';

// Allow prisma client to be injected for testing
export function setPrismaClient(client: PrismaClient) {
  repository.setPrismaClient(client);
}

// ================================================================
// TYPES
// ================================================================

type PriceWithRelations = Prisma.PriceGetPayload<{
  include: { route: true; fromStop: true; toStop: true };
}>;

// ================================================================
// DTO INTERFACES
// ================================================================

export interface CreatePriceDto {
  routeId: string;
  fromStopId: string;
  toStopId: string;
  basePrice: number;
  peakPrice?: number;
  offPeakPrice?: number;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

export interface UpdatePriceDto {
  routeId?: string;
  fromStopId?: string;
  toStopId?: string;
  basePrice?: number;
  peakPrice?: number;
  offPeakPrice?: number;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

export interface PriceFilters {
  routeId?: string;
  fromStopId?: string;
  toStopId?: string;
  isActive?: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getPaginationParams(page?: number, limit?: number) {
  const safePage = Math.max(page ?? 1, 1);
  const safeLimit = Math.min(Math.max(limit ?? 50, 1), 100);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

// ================================================================
// PRICING SERVICE (FUNCTIONAL)
// ================================================================

// ─── READ ──────────────────────────────────────────────────────

export async function getAllPrices(filters?: PriceFilters): Promise<PaginatedResult<PriceWithRelations>> {
  try {
    const { page, limit, skip } = getPaginationParams(filters?.page, filters?.limit);
    const where: Prisma.PriceWhereInput = { deletedAt: null };

    if (filters?.routeId) where.routeId = filters.routeId;
    if (filters?.fromStopId) where.fromStopId = filters.fromStopId;
    if (filters?.toStopId) where.toStopId = filters.toStopId;

    if (filters?.effectiveFrom || filters?.effectiveTo) {
      where.effectiveFrom = {};
      if (filters.effectiveFrom) where.effectiveFrom.gte = filters.effectiveFrom;
      if (filters.effectiveTo) where.effectiveFrom.lte = filters.effectiveTo;
    }

    if (filters?.isActive) {
      const now = new Date();
      where.effectiveFrom = { lte: now };
      where.OR = [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }];
    }

    const [data, total] = await Promise.all([
      repository.findPrices(where, skip, limit),
      repository.countPrices(where)
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    logger.error('Failed to fetch prices:', { error });
    throw error;
  }
}

export async function getPriceById(id: string): Promise<PriceWithRelations> {
  const price = await repository.findPriceById(id);
  if (!price) {
    throw new NotFoundError('Price not found', 'PRICE_NOT_FOUND');
  }
  return price;
}

export async function getActivePrice(
  routeId: string,
  fromStopId: string,
  toStopId: string
): Promise<PriceWithRelations | null> {
  try {
    const now = new Date();
    return await repository.findActivePrice(routeId, fromStopId, toStopId, now);
  } catch (error) {
    logger.error('Failed to fetch active price:', { error, routeId, fromStopId, toStopId });
    throw error;
  }
}

export async function calculatePrice(
  routeId: string,
  fromStopId: string,
  toStopId: string,
  isPeak: boolean = false
): Promise<{ price: number; type: string }> {
  const price = await getActivePrice(routeId, fromStopId, toStopId);
  if (!price) {
    throw new NotFoundError('No active price found for this route segment', 'ACTIVE_PRICE_NOT_FOUND');
  }

  let finalPrice = price.basePrice;
  let priceType = 'base';

  if (isPeak && price.peakPrice) {
    finalPrice = price.peakPrice;
    priceType = 'peak';
  } else if (!isPeak && price.offPeakPrice) {
    finalPrice = price.offPeakPrice;
    priceType = 'off-peak';
  }

  return { price: Number(finalPrice), type: priceType };
}

export async function getPricesByRoute(routeId: string): Promise<PriceWithRelations[]> {
  try {
    return await repository.findPricesByRoute(routeId);
  } catch (error) {
    logger.error(`Failed to fetch prices for route ${routeId}:`, { error });
    throw error;
  }
}

export async function getPriceStats() {
  try {
    const now = new Date();
    const [total, active] = await Promise.all([
      repository.countPrices({ deletedAt: null }),
      repository.countActivePrices(now)
    ]);
    return { total, active, inactive: total - active };
  } catch (error) {
    logger.error('Failed to fetch price stats:', { error });
    throw error;
  }
}

// ─── WRITE ─────────────────────────────────────────────────────

export async function createPrice(data: CreatePriceDto): Promise<PriceWithRelations> {
  // Validation
  if (!data.basePrice || data.basePrice <= 0) {
    throw new ValidationError('Base price must be greater than 0', { code: 'INVALID_BASE_PRICE' });
  }
  if (data.peakPrice !== undefined && data.peakPrice < data.basePrice) {
    throw new ValidationError('Peak price must be >= base price', { code: 'INVALID_PEAK_PRICE' });
  }
  if (data.offPeakPrice !== undefined && data.offPeakPrice > data.basePrice) {
    throw new ValidationError('Off-peak price must be <= base price', { code: 'INVALID_OFF_PEAK_PRICE' });
  }

  const effectiveFrom = data.effectiveFrom || new Date();
  const effectiveUntil = data.effectiveUntil || null;

  if (effectiveFrom && effectiveUntil && effectiveFrom > effectiveUntil) {
    throw new ValidationError('Effective from date must be before effective until date', { code: 'INVALID_DATE_RANGE' });
  }

  // Check for existing price
  const existing = await repository.findExistingPrice(data.routeId, data.fromStopId, data.toStopId);
  if (existing) {
    throw new ConflictError('A price already exists for this route segment', 'PRICE_ALREADY_EXISTS');
  }

  const price = await repository.createPrice({
    route: { connect: { id: data.routeId } },
    fromStop: { connect: { id: data.fromStopId } },
    toStop: { connect: { id: data.toStopId } },
    basePrice: data.basePrice,
    peakPrice: data.peakPrice,
    offPeakPrice: data.offPeakPrice,
    effectiveFrom,
    effectiveUntil
  });

  logger.info('Price created', { priceId: price.id });
  return price;
}

export async function updatePrice(id: string, data: UpdatePriceDto): Promise<PriceWithRelations> {
  const existing = await getPriceById(id);

  // Validation
  if (data.basePrice !== undefined && data.basePrice <= 0) {
    throw new ValidationError('Base price must be greater than 0', { code: 'INVALID_BASE_PRICE' });
  }

  const basePrice = Number(data.basePrice ?? existing.basePrice);
  if (data.peakPrice !== undefined && data.peakPrice < basePrice) {
    throw new ValidationError('Peak price must be >= base price', { code: 'INVALID_PEAK_PRICE' });
  }
  if (data.offPeakPrice !== undefined && data.offPeakPrice > basePrice) {
    throw new ValidationError('Off-peak price must be <= base price', { code: 'INVALID_OFF_PEAK_PRICE' });
  }

  const effectiveFrom = data.effectiveFrom ?? existing.effectiveFrom;
  const effectiveUntil = data.effectiveUntil ?? existing.effectiveUntil;
  if (effectiveFrom && effectiveUntil && effectiveFrom > effectiveUntil) {
    throw new ValidationError('Effective from date must be before effective until date', { code: 'INVALID_DATE_RANGE' });
  }

  const updateData: Prisma.PriceUpdateInput = {};
  if (data.routeId) updateData.route = { connect: { id: data.routeId } };
  if (data.fromStopId) updateData.fromStop = { connect: { id: data.fromStopId } };
  if (data.toStopId) updateData.toStop = { connect: { id: data.toStopId } };
  if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
  if (data.peakPrice !== undefined) updateData.peakPrice = data.peakPrice;
  if (data.offPeakPrice !== undefined) updateData.offPeakPrice = data.offPeakPrice;
  if (data.effectiveFrom !== undefined) updateData.effectiveFrom = data.effectiveFrom;
  if (data.effectiveUntil !== undefined) updateData.effectiveUntil = data.effectiveUntil;

  const price = await repository.updatePrice(id, updateData);
  logger.info('Price updated', { priceId: id });
  return price;
}

export async function deletePrice(id: string): Promise<PriceWithRelations> {
  await getPriceById(id); // Check existence
  const price = await repository.softDeletePrice(id);
  logger.info('Price soft-deleted', { priceId: id });
  return price;
}
