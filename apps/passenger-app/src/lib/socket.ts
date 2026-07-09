import { createSocketClient } from '@sbts/api-client';

export const passengerSocket = createSocketClient({
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000',
});