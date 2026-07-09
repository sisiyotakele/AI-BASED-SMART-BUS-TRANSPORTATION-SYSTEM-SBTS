import { createRestClient } from '@sbts/api-client';

export const staffApi = createRestClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
});