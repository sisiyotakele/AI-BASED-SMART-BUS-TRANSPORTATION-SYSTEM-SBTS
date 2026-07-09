import { createSocketClient } from '@sbts/api-client';

export const staffSocket = createSocketClient({
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000',
});