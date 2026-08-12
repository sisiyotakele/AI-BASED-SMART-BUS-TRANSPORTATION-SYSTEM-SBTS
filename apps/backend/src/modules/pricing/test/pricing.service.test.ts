// src/modules/pricing/test/pricing.service.test.ts

import * as pricingService from '../pricing.service';
import * as repository from '../pricing.repository';

// Mock the repository
jest.mock('../pricing.repository');

const mockRepository = repository as jest.Mocked<typeof repository>;

describe('PricingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPrices', () => {
    it('should return paginated prices', async () => {
      const mockData: any = [{ id: '1', basePrice: 100 }];
      const totalCount = 1;

      mockRepository.findPrices.mockResolvedValue(mockData);
      mockRepository.countPrices.mockResolvedValue(totalCount);

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

      mockRepository.findPrices.mockResolvedValue([]);
      mockRepository.countPrices.mockResolvedValue(0);

      await pricingService.getAllPrices(filters);

      expect(mockRepository.findPrices).toHaveBeenCalled();
    });
  });

  describe('getPriceById', () => {
    it('should return price when found', async () => {
      const mockPrice: any = { id: '1', basePrice: 100 };
      mockRepository.findPriceById.mockResolvedValue(mockPrice);

      const result = await pricingService.getPriceById('1');

      expect(result).toEqual(mockPrice);
    });

    it('should throw error when price not found', async () => {
      mockRepository.findPriceById.mockResolvedValue(null);

      await expect(pricingService.getPriceById('non-existent')).rejects.toThrow('Price not found');
    });
  });

  describe('getActivePrice', () => {
    it('should return active price when found', async () => {
      const mockPrice: any = { id: '1', basePrice: 100 };
      mockRepository.findActivePrice.mockResolvedValue(mockPrice);

      const result = await pricingService.getActivePrice('route-1', 'stop-1', 'stop-2');

      expect(result).toEqual(mockPrice);
    });

    it('should return null when no active price found', async () => {
      mockRepository.findActivePrice.mockResolvedValue(null);

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

      const mockPrice: any = { ...data, id: 'new-id' };
      mockRepository.findExistingPrice.mockResolvedValue(null);
      mockRepository.createPrice.mockResolvedValue(mockPrice);

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

      mockRepository.findExistingPrice.mockResolvedValue({ id: 'existing' } as any);

      await expect(pricingService.createPrice(data)).rejects.toThrow(
        'A price already exists for this route segment'
      );
    });
  });

  describe('updatePrice', () => {
    it('should update price when found', async () => {
      const existingPrice: any = {
        id: '1',
        basePrice: 100,
        peakPrice: null,
        offPeakPrice: null,
        effectiveFrom: new Date(),
        effectiveUntil: null
      };
      const updateData = { basePrice: 150 };
      const updatedPrice: any = { ...existingPrice, ...updateData };

      mockRepository.findPriceById.mockResolvedValue(existingPrice);
      mockRepository.updatePrice.mockResolvedValue(updatedPrice);

      const result = await pricingService.updatePrice('1', updateData);

      expect(result).toEqual(updatedPrice);
    });

    it('should throw error when price not found', async () => {
      mockRepository.findPriceById.mockResolvedValue(null);

      await expect(pricingService.updatePrice('non-existent', {})).rejects.toThrow(
        'Price not found'
      );
    });

    it('should throw error when base price is 0', async () => {
      const existingPrice: any = {
        id: '1',
        basePrice: 100,
        peakPrice: null,
        offPeakPrice: null,
        effectiveFrom: new Date(),
        effectiveUntil: null
      };
      mockRepository.findPriceById.mockResolvedValue(existingPrice);

      await expect(pricingService.updatePrice('1', { basePrice: 0 })).rejects.toThrow(
        'Base price must be greater than 0'
      );
    });
  });

  describe('deletePrice', () => {
    it('should soft delete price', async () => {
      const existingPrice: any = { id: '1', basePrice: 100 };
      const deletedPrice: any = { ...existingPrice, deletedAt: new Date() };

      mockRepository.findPriceById.mockResolvedValue(existingPrice);
      mockRepository.softDeletePrice.mockResolvedValue(deletedPrice);

      const result = await pricingService.deletePrice('1');

      expect(result.deletedAt).toBeDefined();
    });

    it('should throw error when price not found', async () => {
      mockRepository.findPriceById.mockResolvedValue(null);

      await expect(pricingService.deletePrice('non-existent')).rejects.toThrow(
        'Price not found'
      );
    });
  });

  describe('calculatePrice', () => {
    it('should return base price when not peak', async () => {
      const price: any = {
        basePrice: 100,
        peakPrice: 150,
        offPeakPrice: 80,
      };

      mockRepository.findActivePrice.mockResolvedValue(price);

      const result = await pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', false);

      expect(result.price).toBe(100);
      expect(result.type).toBe('base');
    });

    it('should return peak price when isPeak is true', async () => {
      const price: any = {
        basePrice: 100,
        peakPrice: 150,
        offPeakPrice: 80,
      };

      mockRepository.findActivePrice.mockResolvedValue(price);

      const result = await pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', true);

      expect(result.price).toBe(150);
      expect(result.type).toBe('peak');
    });

    it('should return off-peak price when not peak and offPeakPrice exists', async () => {
      const price: any = {
        basePrice: 100,
        peakPrice: null,
        offPeakPrice: 80,
      };

      mockRepository.findActivePrice.mockResolvedValue(price);

      const result = await pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', false);

      expect(result.price).toBe(80);
      expect(result.type).toBe('off-peak');
    });

    it('should throw error when no active price found', async () => {
      mockRepository.findActivePrice.mockResolvedValue(null);

      await expect(
        pricingService.calculatePrice('route-1', 'stop-1', 'stop-2', false)
      ).rejects.toThrow('No active price found for this route segment');
    });
  });

  describe('getPricesByRoute', () => {
    it('should return prices for a route', async () => {
      const mockPrices: any = [{ id: '1', basePrice: 100 }];
      mockRepository.findPricesByRoute.mockResolvedValue(mockPrices);

      const result = await pricingService.getPricesByRoute('route-1');

      expect(result).toEqual(mockPrices);
    });
  });

  describe('getPriceStats', () => {
    it('should return statistics', async () => {
      mockRepository.countPrices.mockResolvedValue(10); // total
      mockRepository.countActivePrices.mockResolvedValue(6); // active

      const result = await pricingService.getPriceStats();

      expect(result).toEqual({
        total: 10,
        active: 6,
        inactive: 4,
      });
    });
  });
});
