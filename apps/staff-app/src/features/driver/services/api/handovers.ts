// apps/staff-app/src/features/driver/services/api/handovers.ts
import { apiClient } from './client';
import { authStorage } from '@/lib/auth-storage';

// ─── Types ───────────────────────────────────────────────────
export interface KeyHandover {
  id: string;
  busId: string;
  terminalId: string;
  fromShiftId: string | null;
  toShiftId: string | null;
  handoverTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmedByFrom: boolean;
  confirmedByTo: boolean;
  notes: string | null;
  bus?: { id: string; plateNumber: string };
  terminal?: { id: string; terminalName: string };
  fromShift?: { id: string; driver: { id: string; fullName: string } };
  toShift?: { id: string; driver: { id: string; fullName: string } };
}

export interface NextDriver {
  shiftId: string;
  driverId: string;
  driverName: string;
  driverEmail: string;
  shiftDate: string;
  bus: { id: string; plateNumber: string };
}

function getDriverId(): string | null {
  return authStorage.getCurrentUserId('driver');
}

export const handoversApi = {
  /**
   * Get pending handovers addressed TO this driver (incoming — needs acceptance)
   */
  getPendingForMe: async (): Promise<KeyHandover[]> => {
    const driverId = getDriverId();
    if (!driverId) return [];
    const response = await apiClient.get('/key-handovers', {
      params: { driverId, status: 'pending' },
    });
    const all: KeyHandover[] = response.data?.data || response.data || [];
    // Filter to only those where THIS driver is the incoming (toShift) party
    return all.filter(h => h.toShift?.driver?.id === driverId);
  },

  /**
   * Get all my handovers (both given and received)
   */
  getMyHandovers: async (): Promise<KeyHandover[]> => {
    const driverId = getDriverId();
    if (!driverId) return [];
    const response = await apiClient.get('/key-handovers', { params: { driverId } });
    return response.data?.data || response.data || [];
  },

  /**
   * Look up the next scheduled driver for a given bus
   * Driver A calls this to auto-fill the recipient in the handover form
   */
  getNextDriver: async (busId: string, currentShiftId?: string): Promise<NextDriver | null> => {
    const params: any = {};
    if (currentShiftId) params.currentShiftId = currentShiftId;
    try {
      const response = await apiClient.get(`/key-handovers/next-driver/${busId}`, { params });
      return response.data?.data || null;
    } catch { return null; }
  },

  /**
   * Driver A initiates a handover — creates a pending record
   */
  create: async (data: {
    busId: string;
    terminalId?: string;
    fromShiftId?: string;
    toShiftId?: string;
    handoverTime?: string;
    notes?: string;
  }): Promise<KeyHandover> => {
    const response = await apiClient.post('/key-handovers', data);
    return response.data.data;
  },

  /**
   * Driver B accepts the key (confirms receipt)
   */
  accept: async (id: string): Promise<KeyHandover> => {
    const response = await apiClient.patch(`/key-handovers/${id}/confirm-to`);
    return response.data.data;
  },

  /**
   * Driver B rejects the handover
   */
  reject: async (id: string): Promise<KeyHandover> => {
    const response = await apiClient.patch(`/key-handovers/${id}/reject`);
    return response.data.data;
  },

  /**
   * Driver A explicitly confirms from their side (if not auto-confirmed)
   */
  confirmFrom: async (id: string): Promise<KeyHandover> => {
    const response = await apiClient.patch(`/key-handovers/${id}/confirm-from`);
    return response.data.data;
  },
};