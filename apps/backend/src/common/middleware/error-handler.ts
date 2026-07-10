export function errorHandler(error: unknown) {
  return {
    ok: false,
    error,
  };
}