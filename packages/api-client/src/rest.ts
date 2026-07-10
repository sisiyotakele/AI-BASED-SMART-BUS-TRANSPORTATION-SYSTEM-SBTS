export type ApiClientOptions = {
  baseUrl: string;
};

export function createRestClient(options: ApiClientOptions) {
  return {
    baseUrl: options.baseUrl,
    get(path: string) {
      return fetch(new URL(path, options.baseUrl).toString());
    },
  };
}