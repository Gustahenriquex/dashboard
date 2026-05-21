import { env } from "@/config/env";
import { IntegrationError, normalizeIntegrationError } from "@/lib/errors";
import { getMockOrders } from "@/lib/mock-data";
import { logger } from "@/lib/logger";
import { normalizeOrderAlerts } from "@/lib/order-utils";
import { findPaymentByOrderId } from "@/services/pagarmeService";
import { fetchOrderById, listOrdersByPeriod } from "@/services/vtexService";
import type { MonitoredOrder, SyncOrdersInput } from "@/types/orders";

function getDefaultDateRange() {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateTo.getDate() - env.SYNC_DEFAULT_DAYS);

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  };
}

async function saveOrder(order: MonitoredOrder) {
  if (env.USE_MOCK_DATA) {
    return order;
  }

  const { upsertOrder } = await import("@/server/repositories/orderRepository");
  return upsertOrder(order);
}

async function saveLog(params: {
  provider: "vtex" | "pagarme" | "sync";
  action: string;
  status: "success" | "warning" | "error";
  message: string;
  orderId?: string;
  errorCode?: string;
  durationMs?: number;
  metadata?: unknown;
}) {
  logger[params.status === "error" ? "error" : params.status === "warning" ? "warn" : "info"]({
    provider: params.provider,
    action: params.action,
    orderId: params.orderId,
    message: params.message,
    durationMs: params.durationMs,
    metadata: params.metadata,
  });

  if (env.USE_MOCK_DATA) {
    return;
  }

  const { createIntegrationLog } = await import("@/server/repositories/orderRepository");
  await createIntegrationLog(params);
}

export async function enrichOrderWithPayment(order: MonitoredOrder) {
  try {
    const payment = await findPaymentByOrderId(order.orderId);

    return normalizeOrderAlerts({
      ...order,
      pagarmeStatus: payment.status,
      payment,
      rawPagarmeJson: payment.rawJson,
    });
  } catch (error) {
    const normalized = normalizeIntegrationError("pagarme", error);

    await saveLog({
      provider: "pagarme",
      action: "fetch-payment",
      status: normalized.code === "ORDER_NOT_FOUND" ? "warning" : "error",
      message: normalized.message,
      orderId: order.orderId,
      errorCode: normalized.code,
    });

    return normalizeOrderAlerts({
      ...order,
      pagarmeStatus: normalized.code === "ORDER_NOT_FOUND" ? "not-found" : "error",
      alerts: [
        ...(order.alerts ?? []),
        {
          type: "integration-error",
          severity: "high",
          message: "Falha ao consultar Pagar.me",
          probableReason: normalized.message,
          recommendedAction:
            "Ressincronizar pedido e validar token da Pagar.me se o erro persistir.",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
}

export async function syncOrderById(orderId: string) {
  const startedAt = performance.now();

  try {
    const vtexOrder = await fetchOrderById(orderId);
    const enriched = await enrichOrderWithPayment(vtexOrder);
    const saved = await saveOrder(enriched);

    await saveLog({
      provider: "sync",
      action: "resync-order",
      status: "success",
      message: "Pedido sincronizado com sucesso.",
      orderId: enriched.orderId,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return saved ?? enriched;
  } catch (error) {
    const normalized = normalizeIntegrationError("sync", error);

    await saveLog({
      provider: "sync",
      action: "resync-order",
      status: "error",
      message: normalized.message,
      orderId,
      errorCode: normalized.code,
      durationMs: Math.round(performance.now() - startedAt),
    });

    throw normalized;
  }
}

export async function syncOrders(input: SyncOrdersInput = {}) {
  const startedAt = performance.now();

  if (input.orderId) {
    const order = await syncOrderById(input.orderId);
    return {
      mode: env.USE_MOCK_DATA ? "mock" : "live",
      synced: 1,
      failed: 0,
      orders: [order],
    };
  }

  if (env.USE_MOCK_DATA) {
    const orders = getMockOrders();

    await saveLog({
      provider: "sync",
      action: "sync-orders",
      status: "success",
      message: "Sincronizacao mock concluida.",
      durationMs: Math.round(performance.now() - startedAt),
      metadata: { count: orders.length },
    });

    return {
      mode: "mock",
      synced: orders.length,
      failed: 0,
      orders,
    };
  }

  const fallbackRange = getDefaultDateRange();
  const dateFrom = input.dateFrom ?? fallbackRange.dateFrom;
  const dateTo = input.dateTo ?? fallbackRange.dateTo;
  const vtexOrders = await listOrdersByPeriod(dateFrom, dateTo);
  const synced: MonitoredOrder[] = [];
  const failures: Array<{ orderId: string; message: string }> = [];

  for (const order of vtexOrders) {
    try {
      const enriched = await enrichOrderWithPayment(order);
      const saved = await saveOrder(enriched);

      if (saved) {
        synced.push(saved);
      }
    } catch (error) {
      const normalized =
        error instanceof IntegrationError ? error : normalizeIntegrationError("sync", error);
      failures.push({ orderId: order.orderId, message: normalized.message });
    }
  }

  await saveLog({
    provider: "sync",
    action: "sync-orders",
    status: failures.length ? "warning" : "success",
    message: failures.length
      ? "Sincronizacao finalizada com falhas parciais."
      : "Sincronizacao finalizada com sucesso.",
    durationMs: Math.round(performance.now() - startedAt),
    metadata: { synced: synced.length, failed: failures.length, failures },
  });

  return {
    mode: "live",
    synced: synced.length,
    failed: failures.length,
    orders: synced,
    failures,
  };
}
