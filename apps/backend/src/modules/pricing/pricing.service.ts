// src/modules/pricing/pricing.service.ts

import { prisma } from '@/prisma/client';
import { Prisma } from '@prisma/client';
import { logger } from '@/common/logger';

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
// PRICING SERVICE
// ================================================================

export class PricingService {
  private getPriceInclude() {
    return { route: true, fromStop: true, toStop: true };
  }

  private getPaginationParams(page?: number, limit?: number) {
    const safePage = Math.max(page ?? 1, 1);
    const safeLimit = Math.min(Math.max(limit ?? 50, 1), 100);
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  // ─── READ ──────────────────────────────────────────────────────

  async getAllPrices(filters?: PriceFilters): Promise<PaginatedResult<PriceWithRelations>> {
    try {
      const { page, limit, skip } = this.getPaginationParams(filters?.page, filters?.limit);
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
        prisma.price.findMany({ where, include: this.getPriceInclude(), orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.price.count({ where }),
      ]);

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      logger.error('Failed to fetch prices:', { error });
      throw new Error('Could not fetch prices');
    }
  }

  async getPriceById(id: string): Promise<PriceWithRelations | null> {
    try {
      return await prisma.price.findFirst({
        where: { id, deletedAt: null },
        include: this.getPriceInclude(),
      });
    } catch (error) {
      logger.error(`Failed to fetch price ${id}:`, { error });
      throw new Error('Could not fetch price');
    }
  }

  async getActivePrice(
    routeId: string,
    fromStopId: string,
    toStopId: string
  ): Promise<PriceWithRelations | null> {
    try {
      const now = new Date();
      return await prisma.price.findFirst({
        where: {
          routeId,
          fromStopId,
          toStopId,
          deletedAt: null,
          effectiveFrom: { lte: now },
          OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
        },
        include: this.getPriceInclude(),
      });
    } catch (error) {
      logger.error('Failed to fetch active price:', { error, routeId, fromStopId, toStopId });
      throw new Error('Could not fetch active price');
    }
  }

  async calculatePrice(
    routeId: string,
    fromStopId: string,
    toStopId: string,
    isPeak: boolean = false
  ): Promise<{ price: number; type: string }> {
    try {
      const price = await this.getActivePrice(routeId, fromStopId, toStopId);
      if (!price) throw new Error('No active price found for this route segment');

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
    } catch (error) {
      if (error instanceof Error) throw error;
      logger.error('Failed to calculate price:', { error });
      throw new Error('Could not calculate price');
    }
  }

  async getPricesByRoute(routeId: string): Promise<PriceWithRelations[]> {
    try {
      return await prisma.price.findMany({
        where: { routeId, deletedAt: null },
        include: this.getPriceInclude(),
        orderBy: { effectiveFrom: 'asc' },
      });
    } catch (error) {
      logger.error(`Failed to fetch prices for route ${routeId}:`, { error });
      throw new Error('Could not fetch route prices');
    }
  }

  async getPriceStats() {
    try {
      const now = new Date();
      const [total, active] = await Promise.all([
        prisma.price.count({ where: { deletedAt: null } }),
        prisma.price.count({
          where: {
            deletedAt: null,
            effectiveFrom: { lte: now },
            OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
          },
        }),
      ]);
      return { total, active, inactive: total - active };
    } catch (error) {
      logger.error('Failed to fetch price stats:', { error });
      throw new Error('Could not fetch price statistics');
    }
  }

  // ─── WRITE ─────────────────────────────────────────────────────

  async createPrice(data: CreatePriceDto): Promise<PriceWithRelations> {
    try {
      if (!data.routeId || !data.fromStopId || !data.toStopId) {
        throw new Error('Missing required fields: routeId, fromStopId, toStopId');
      }
      if (!data.basePrice || data.basePrice <= 0) {
        throw new Error('Base price must be greater than 0');
      }
      if (data.peakPrice !== undefined && data.peakPrice < data.basePrice) {
        throw new Error('Peak price must be >= base price');
      }
      if (data.offPeakPrice !== undefined && data.offPeakPrice > data.basePrice) {
        throw new Error('Off-peak price must be <= base price');
      }

      const effectiveFrom = data.effectiveFrom || new Date();
      const effectiveUntil = data.effectiveUntil || null;

      if (effectiveFrom && effectiveUntil && effectiveFrom > effectiveUntil) {
        throw new Error('Effective from date must be before effective until date');
      }

      const existing = await prisma.price.findFirst({
        where: {
          routeId: data.routeId,
          fromStopId: data.fromStopId,
          toStopId: data.toStopId,
          deletedAt: null,
        },
      });
      if (existing) throw new Error('A price already exists for this route segment');

      return await prisma.price.create({
        data: {
          routeId: data.routeId,
          fromStopId: data.fromStopId,
          toStopId: data.toStopId,
          basePrice: data.basePrice,
          peakPrice: data.peakPrice,
          offPeakPrice: data.offPeakPrice,
          effectiveFrom,
          effectiveUntil,
        },
        include: this.getPriceInclude(),
      });
    } catch (error) {
      if (error instanceof Error) throw error;
      logger.error('Failed to create price:', { error });
      throw new Error('Could not create price');
    }
  }

  async updatePrice(id: string, data: UpdatePriceDto): Promise<PriceWithRelations> {
    try {
      const existing = await this.getPriceById(id);
      if (!existing) throw new Error('Price not found');

      if (data.basePrice !== undefined && data.basePrice <= 0) {
        throw new Error('Base price must be greater than 0');
      }

      const basePrice = Number(data.basePrice ?? existing.basePrice);
      if (data.peakPrice !== undefined && data.peakPrice < basePrice) {
        throw new Error('Peak price must be >= base price');
      }
      if (data.offPeakPrice !== undefined && data.offPeakPrice > basePrice) {
        throw new Error('Off-peak price must be <= base price');
      }

      const effectiveFrom = data.effectiveFrom ?? existing.effectiveFrom;
      const effectiveUntil = data.effectiveUntil ?? existing.effectiveUntil;
      if (effectiveFrom && effectiveUntil && effectiveFrom > effectiveUntil) {
        throw new Error('Effective from date must be before effective until date');
      }

      return await prisma.price.update({
        where: { id },
        data: {
          routeId: data.routeId,
          fromStopId: data.fromStopId,
          toStopId: data.toStopId,
          basePrice: data.basePrice,
          peakPrice: data.peakPrice,
          offPeakPrice: data.offPeakPrice,
          effectiveFrom: data.effectiveFrom,
          effectiveUntil: data.effectiveUntil ?? null,
        },
        include: this.getPriceInclude(),
      });
    } catch (error) {
      if (error instanceof Error) throw error;
      logger.error(`Failed to update price ${id}:`, { error });
      throw new Error('Could not update price');
    }
  }

  async deletePrice(id: string): Promise<PriceWithRelations> {
    try {
      const existing = await this.getPriceById(id);
      if (!existing) throw new Error('Price not found');

      return await prisma.price.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: this.getPriceInclude(),
      });
    } catch (error) {
      if (error instanceof Error) throw error;
      logger.error(`Failed to delete price ${id}:`, { error });
      throw new Error('Could not delete price');
    }
  }
}

export const pricingService = new PricingService();
export default pricingService;