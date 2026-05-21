"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, toSearchParams } from "@/lib/api-client";
import type {
  IntegrationLogEntry,
  MonitoredOrder,
  OrderFilters,
  OrdersApiResponse,
} from "@/types/orders";

interface AlertsResponse {
  alerts: Array<{
    order: MonitoredOrder;
    type: string;
    severity: string;
    message: string;
    probableReason?: string | null;
    recommendedAction?: string | null;
    createdAt: string;
  }>;
  total: number;
}

interface TrackingResponse {
  tracking: NonNullable<MonitoredOrder["tracking"]>;
}

interface LogsResponse {
  logs: IntegrationLogEntry[];
}

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => {
      const search = toSearchParams(filters);
      return apiFetch<OrdersApiResponse>(`/api/orders${search ? `?${search}` : ""}`);
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () =>
      apiFetch<{ order: MonitoredOrder }>(`/api/orders/${encodeURIComponent(orderId)}`),
    enabled: Boolean(orderId),
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiFetch<AlertsResponse>("/api/alerts"),
  });
}

export function useTracking(orderId?: string | null) {
  return useQuery({
    queryKey: ["tracking", orderId],
    queryFn: () => apiFetch<TrackingResponse>(`/api/tracking/${encodeURIComponent(orderId ?? "")}`),
    enabled: Boolean(orderId),
  });
}

export function useLogs() {
  return useQuery({
    queryKey: ["logs"],
    queryFn: () => apiFetch<LogsResponse>("/api/logs"),
  });
}

export function useResyncOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch<{ status: string; order: MonitoredOrder }>(
        `/api/orders/${encodeURIComponent(orderId)}/resync`,
        {
          method: "POST",
        },
      ),
    onSuccess: async (_data, orderId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["logs"] }),
      ]);
    },
  });
}

export function useSyncOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body?: { dateFrom?: string; dateTo?: string }) =>
      apiFetch<{ status: string; synced: number; failed: number }>("/api/sync/orders", {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["logs"] }),
      ]);
    },
  });
}
