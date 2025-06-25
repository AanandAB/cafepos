import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// This helper function updates all related data to keep the UI in sync
export const invalidateAllQueries = () => {
  // Invalidate all relevant queries to ensure full app synchronization
  queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
  queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
  queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
  queryClient.invalidateQueries({ queryKey: ['/api/orders/active'] });
  queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
  queryClient.invalidateQueries({ queryKey: ['/api/reports/sales'] });
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Changed from Infinity to 30 seconds to ensure data stays fresh
      staleTime: 30000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
