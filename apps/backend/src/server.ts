import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const server = http.createServer(app);

server.listen(env.backendPort, () => {
  console.log(`backend listening on ${env.backendPort}`);
});

export { server };