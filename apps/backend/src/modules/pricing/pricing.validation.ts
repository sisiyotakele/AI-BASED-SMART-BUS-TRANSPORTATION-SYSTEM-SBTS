import { z } from 'zod';

export const createPriceSchema = z.object({
    routeId: z.string().uuid(),
    fromStopId: z.string().uuid(),
    toStopId: z.string().uuid(),
    basePrice: z.coerce.number().positive(),
    peakPrice: z.coerce.number().positive().optional(),
    offPeakPrice: z.coerce.number().positive().optional(),
    effectiveFrom: z.coerce.date().optional(),
    effectiveUntil: z.coerce.date().optional()
}).refine(
    data => !data.peakPrice || data.peakPrice >= data.basePrice,
    { message: 'Peak price must be >= base price', path: ['peakPrice'] }
).refine(
    data => !data.offPeakPrice || data.offPeakPrice <= data.basePrice,
    { message: 'Off-peak price must be <= base price', path: ['offPeakPrice'] }
).refine(
    data => !data.effectiveFrom || !data.effectiveUntil || data.effectiveFrom < data.effectiveUntil,
    { message: 'Effective from date must be before effective until date', path: ['effectiveFrom'] }
);

export const updatePriceSchema = z.object({
    routeId: z.string().uuid().optional(),
    fromStopId: z.string().uuid().optional(),
    toStopId: z.string().uuid().optional(),
    basePrice: z.coerce.number().positive().optional(),
    peakPrice: z.coerce.number().positive().optional(),
    offPeakPrice: z.coerce.number().positive().optional(),
    effectiveFrom: z.coerce.date().optional(),
    effectiveUntil: z.coerce.date().optional()
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const priceIdParamSchema = z.object({
    id: z.string().uuid()
});

export const routeIdParamSchema = z.object({
    routeId: z.string().uuid()
});

export const calculatePriceQuerySchema = z.object({
    routeId: z.string().uuid(),
    fromStopId: z.string().uuid(),
    toStopId: z.string().uuid(),
    isPeak: z.enum(['true', 'false']).optional()
});

export const priceFiltersQuerySchema = z.object({
    routeId: z.string().uuid().optional(),
    fromStopId: z.string().uuid().optional(),
    toStopId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    effectiveFrom: z.coerce.date().optional(),
    effectiveTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
});
