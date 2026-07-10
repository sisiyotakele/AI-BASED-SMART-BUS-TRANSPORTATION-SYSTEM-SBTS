import { createRestClient } from '@sbts/api-client';

export const passengerApi = createRestClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
});