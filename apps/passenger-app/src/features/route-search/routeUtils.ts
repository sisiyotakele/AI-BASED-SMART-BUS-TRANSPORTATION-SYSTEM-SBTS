import { RouteOption } from "./types";

export const isDirectRoute = (option: RouteOption) =>
  option.transfersCount === 0 && !option.isMergedRoute;

export const isTransferRoute = (option: RouteOption) => !isDirectRoute(option);

export const getVisibleRouteOptions = (options: RouteOption[]) => {
  const directRoutes = options.filter(isDirectRoute);
  const transferRoutes = options.filter(isTransferRoute);

  if (directRoutes.length > 0) {
    return {
      routes: directRoutes,
      mode: "direct" as const,
    };
  }

  return {
    routes: transferRoutes,
    mode: "transfer" as const,
  };
};
