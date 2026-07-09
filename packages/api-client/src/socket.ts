export type SocketClientOptions = {
  socketUrl: string;
};

export function createSocketClient(options: SocketClientOptions) {
  return {
    socketUrl: options.socketUrl,
  };
}