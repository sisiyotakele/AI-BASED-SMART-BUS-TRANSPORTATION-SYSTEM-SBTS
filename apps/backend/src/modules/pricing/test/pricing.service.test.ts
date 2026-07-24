// src/modules/pricing/test/pricing.service.test.ts

import { PricingService } from '../pricing.service';
import { Price } from '@prisma/client';

// Mock Prisma client
jest.mock('@/prisma/client', () => ({
  prisma: {
    price: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { prisma } from '@/prisma/client';

// Type-safe mock helpers
const mockFindMany = prisma.price.findMany as jest.MockedFunction<typeof prisma.price.findMany>;
const mockFindFirst = prisma.price.findFirst as jest.MockedFunction<typeof prisma.price.findFirst>;
const mockFindUnique = prisma.price.findUnique as jest.MockedFunction<typeof prisma.price.findUnique>;
const mockCreate = prisma.price.create as jest.MockedFunction<typeof prisma.price.create>;
const mockUpdate = prisma.price.update as jest.MockedFunction<typeof prisma.price.update>;
const mockDelete = prisma.price.delete as jest.MockedFunction<typeof prisma.price.delete>;
const mockCount = prisma.price.count as jest.MockedFunction<typeof prisma.price.count>;
const mockGroupBy = prisma.price.groupBy as jest.MockedFunction<typeof prisma.price.groupBy>;

describe('PricingService', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
    jest.clearAllMocks();
  });

  describe('getAllPrices', () => {
    it('should return paginated prices', async () => {
      const mockData = [{ id: '1', basePrice: 100 }] as unknown as Price[];
      const totalCount = 1;

      mockFindMany.mockResolvedValue(mockData);
      mockCount.mockResolvedValue(totalCount);

      const result = await pricingService.getAllPrices({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(totalCount);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        routeId: 'route-123',
        fromStopId: 'stop-456',
        isActive: true,
      };

      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await pricingService.getAllPrices(filters);

      expect(mockFindMany).toHaveBeenCalled();
    });
  });

  describe('getPriceById', () => {
    it('should return price when found', async () => {
      const mockPrice = { id: '1', basePrice: 100 } as unknown as Price;
      mockFindFirst.mockResolvedValue(mockPrice);

      const result = await pricingService.getPriceById('1');

      expect(result).toEqual(mockPrice);
    });

    it('should return null when price not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await pricingService.getPriceById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getActivePrice', () => {
    it('should return active price when found', async () => {
      const mockPrice = { id: '1', basePrice: 100 } as unknown as Price;
      mockFindFirst.mockResolvedValue(mockPrice);

      const result = await pricingService.getActivePrice('route-1', 'stop-1', 'stop-2');

      expect(result).toEqual(mockPrice);
    });

    it('should return null when no active price found', async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await pricingService.getActivePrice('route-1', 'stop-1', 'stop-2');

      expect(result).toBeNull();
    });
  });

  describe('createPrice', () => {
    it('should create price with valid data', async () => {
      const data = {
        routeId: 'route-1',
        fromStopId: 'stop-1',
        toStopId: 'stop-2',
        basePrice: 100,
      };

      const mockPrice = { ...data, id: 'new-id' } as unknown as Price;
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockPrice);

      const result = await pricingService.createPrice(data);

      expect(result).toEqual(mockPrice);
    });

    it('should throw error when base price is 0', async () => {
      const data = {
        routeId: 'route-1',
        fromStopId: 'stop-1',
        toStopId: 'stop-2',
        basePrice: 0,
      };

      await expect(pricingService.createPrice(data)).rejects.toThrow(
        'Base price must be greater than 0'
      );
    });

    it('should throw error when peak price is less than base price', async () => {
      const data = {
        routeId: 'route-1',
        fromStopId: 'stop-1',
        toStopId: 'stop-2',
        basePrice: 100,
        peakPrice: 80,
      };

      await expect(pricingService.createPrice(data)).rejects.toThrow(
        'Peak price must be >= base price'
      );
    });

    it('should throw error when price already exists', async () => {
      const data = {
        routeId: 'route-1',
        fromStopId: 'stop-1',
        toStopId: 'stop-2',
        basePrice: 100,
      };

      mockFindFirst.mockResolvedValue({ id: 'existing' } as Price);

      await expect(pricingService.createPrice(data)).rejects.toThrow(
        'A price already exists for this route segment'
      );
    });

    it('should throw error when required fields are missing', async () => {
      const data = {
        routeId: 'route-1',
        basePrice: 100,
      } as any;

      await expect(pricingService.createPrice(data)).rejects.toThrow(
        'Missing required fields: routeId, fromStopId, toStopId'
      );
    });
  });

  describe('updatePrice', () => {
    it('should update price when found', async () => {
      const existingPrice = { id: '1', basePrice: 100, peakPrice: null, offPeakPrice: null } as unknown as Price;
      const updateData = { basePrice: 150 };
      const updatedPrice = { ...existingPrice, ...updateData } as unknown as Price;

      mockFindFirst.mockResolvedValue(existingPrice);
      mockUpdate.mockResolvedValue(updatedPrice);

      const result = await pricingService.updatePrice('1', updateData);

      expect(result).toEqual(updatedPrice);
    });

    it('should throw error when price not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(pricingService.updatePrice('non-existent', {})).rejects.toThrow(
        'Price not found'
      );
    });

    it('should throw error when base price is 0', async () => {
      const existingPrice = { id: '1', basePrice: 100, peakPrice: null, offPeakPrice: null } as unknown as Price;
      mockFindFirst.mockResolvedValue(existingPrice);

      await expect(pricingService.updatePrice('1', { basePrice: 0 })).rejects.toThrow(
        'Base price must be greater than 0'
      );
    });
  });

  describe('deletePrice', () => {
    it('should soft delete price', async () => {
      const existingPrice = { id: '1', basePrice: 100 } as unknown as Price;
      const deletedPrice = { ...existingPrice, deletedAt: new Date() } as Price;

      mockFindFirst.mockResolvedValue(existingPrice);
      mockUpdate.mockResolvedValue(deletedPrice);

      const result = await pricingService.deletePrice('1');

      expect(result.deletedAt).toBeDefined();
    });

    it('should throw error when price not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(pricingService.deletePrice('non-existent')).rejects.toThrow(
        'Price not found'
      );
    });
  });

  describe('calculatePrice', () => {
    it('should return base price when not peak', async () => {
      const price = {
          basePrice: 100,
          peakPrice: 150,
          offPeakPrice: 80,
      } as unknown as Price;

      mockFindFirst.mockResolvedValue(price);

      const result = await pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', false);

      expect(result.price).toBe(100);
      expect(result.type).toBe('base');
    });

    it('should return peak price when isPeak is true', async () => {
      const price = {
          basePrice: 100,
          peakPrice: 150,
          offPeakPrice: 80,
      } as unknown as Price;

      mockFindFirst.mockResolvedValue(price);

      const result = await pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', true);

      expect(result.price).toBe(150);
      expect(result.type).toBe('peak');
    });

    it('should return off-peak price when not peak and offPeakPrice exists', async () => {
      const price = {
          basePrice: 100,
          peakPrice: null,
          offPeakPrice: 80,
      } as unknown as Price;

      mockFindFirst.mockResolvedValue(price);

      const result = await pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', false);

      expect(result.price).toBe(80);
      expect(result.type).toBe('off-peak');
    });

    it('should throw error when no active price found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(
        pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', false)
      ).rejects.toThrow('No active price found for this route segment');
    });
  });

  describe('getPricesByRoute', () => {
    it('should return prices for a route', async () => {
      const mockPrices = [{ id: '1', basePrice: 100 }] as unknown as Price[];
      mockFindMany.mockResolvedValue(mockPrices);

      const result = await pricingService.getPricesByRoute('route-1');

      expect(result).toEqual(mockPrices);
    });
  });

  describe('getPriceStats', () => {
    it('should return statistics', async () => {
      mockCount.mockResolvedValueOnce(10); // total
      mockCount.mockResolvedValueOnce(6); // active

      const result = await pricingService.getPriceStats();

      expect(result).toEqual({
        total: 10,
        active: 6,
        inactive: 4,
      });
    });
  });
});