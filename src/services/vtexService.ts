import { env, assertVtexConfig } from "@/config/env";
import { IntegrationError } from "@/lib/errors";
import { getMockOrderById, getMockOrders } from "@/lib/mock-data";
import { normalizeOrderAlerts } from "@/lib/order-utils";
import { fetchJson } from "@/services/http";
import type { MonitoredOrder, TrackingInfo } from "@/types/orders";

const CRITICAL_VTEX_STATUSES = new Set([
  "payment-pending",
  "ready-for-handling",
  "handling",
  "invoice",
  "canceled",
  "awaiting-seller-change",
  "invoiced",
  "shipped",
  "delivered",
]);

interface VtexListResponse {
  list?: Array<{
    orderId: string;
    creationDate?: string;
    status?: string;
    clientName?: string;
    totalValue?: number;
  }>;
  paging?: {
    total?: number;
    pages?: number;
    currentPage?: number;
  };
}

function getBaseUrl() {
  assertVtexConfig();
  return `https://${env.VTEX_ACCOUNT}.${env.VTEX_ENVIRONMENT}.com.br`;
}

function getHeaders() {
  assertVtexConfig();

  return {
    "X-VTEX-API-AppKey": env.VTEX_APP_KEY!,
    "X-VTEX-API-AppToken": env.VTEX_APP_TOKEN!,
  };
}

function firstPackage(rawOrder: any) {
  return rawOrder?.packageAttachment?.packages?.[0] ?? rawOrder?.packages?.[0] ?? null;
}

function mapVtexOrder(rawOrder: any): MonitoredOrder {
  const client = rawOrder?.clientProfileData ?? {};
  const shipping = rawOrder?.shippingData ?? {};
  const logisticsInfo = shipping?.logisticsInfo?.[0] ?? {};
  const selectedSla = logisticsInfo?.selectedSla ?? logisticsInfo?.deliveryCompany;
  const invoicePackage = firstPackage(rawOrder);
  const createdAt = rawOrder?.creationDate ?? rawOrder?.createdAt ?? new Date().toISOString();
  const orderId = rawOrder?.orderId ?? rawOrder?.id;
  const invoiceNumber = invoicePackage?.invoiceNumber ?? rawOrder?.invoiceNumber ?? null;
  const invoiceKey = invoicePackage?.invoiceKey ?? rawOrder?.invoiceKey ?? null;
  const trackingCode =
    invoicePackage?.trackingNumber ??
    invoicePackage?.trackingCode ??
    logisticsInfo?.trackingNumber ??
    rawOrder?.trackingCode ??
    null;
  const trackingUrl =
    invoicePackage?.trackingUrl ?? logisticsInfo?.trackingUrl ?? rawOrder?.trackingUrl ?? null;
  const carrierName =
    invoicePackage?.courier ??
    invoicePackage?.carrier ??
    logisticsInfo?.deliveryCompany ??
    selectedSla ??
    null;

  const order: MonitoredOrder = {
    id: String(orderId),
    orderId: String(orderId),
    clientName:
      [client.firstName, client.lastName].filter(Boolean).join(" ") ||
      client.name ||
      rawOrder?.clientName ||
      "Cliente sem nome",
    clientEmail: client.email ?? rawOrder?.clientEmail ?? null,
    clientDocument: client.document ?? rawOrder?.clientDocument ?? null,
    createdAt,
    vtexStatus: rawOrder?.status ?? "integration-error",
    pagarmeStatus: null,
    invoiceNumber,
    invoiceKey,
    invoicedAt: invoicePackage?.issuanceDate ?? rawOrder?.invoicedAt ?? null,
    carrierName,
    trackingCode,
    trackingUrl,
    totalValue:
      typeof rawOrder?.value === "number" ? rawOrder.value / 100 : (rawOrder?.totalValue ?? null),
    has48hInvoiceAlert: false,
    lastSyncedAt: new Date().toISOString(),
    items: (rawOrder?.items ?? []).map((item: any) => ({
      id: String(item.id ?? item.uniqueId ?? item.skuName),
      sku: String(item.refId ?? item.id ?? item.productId ?? "-"),
      name: String(item.name ?? item.skuName ?? "Item"),
      quantity: Number(item.quantity ?? 1),
      price:
        typeof item.sellingPrice === "number" ? item.sellingPrice / 100 : Number(item.price ?? 0),
      imageUrl: item.imageUrl ?? null,
    })),
    tracking:
      trackingCode || trackingUrl
        ? {
            carrierName,
            trackingCode,
            trackingUrl,
            lastUpdatedAt: invoicePackage?.issuanceDate ?? new Date().toISOString(),
          }
        : null,
    timeline: rawOrder?.statusDescription
      ? [
          {
            status: rawOrder.status,
            title: rawOrder.statusDescription,
            happenedAt: rawOrder?.lastChange ?? createdAt,
          },
        ]
      : [],
    rawVtexJson: rawOrder,
  };

  return normalizeOrderAlerts(order);
}

export function isCriticalVtexStatus(status: string) {
  return CRITICAL_VTEX_STATUSES.has(status);
}

export async function fetchOrderById(orderId: string) {
  if (env.USE_MOCK_DATA) {
    const order = getMockOrderById(orderId);

    if (!order) {
      throw new IntegrationError({
        provider: "vtex",
        code: "ORDER_NOT_FOUND",
        status: 404,
        message: `Pedido ${orderId} nao encontrado no mock VTEX.`,
      });
    }

    return order;
  }

  const rawOrder = await fetchJson<any>(`${getBaseUrl()}/api/oms/pvt/orders/${orderId}`, {
    provider: "vtex",
    headers: getHeaders(),
  });

  return mapVtexOrder(rawOrder);
}

export async function listOrdersByPeriod(dateFrom: string, dateTo: string) {
  if (env.USE_MOCK_DATA) {
    return getMockOrders().filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= new Date(dateFrom) && createdAt <= new Date(dateTo);
    });
  }

  const params = new URLSearchParams({
    f_creationDate: `creationDate:[${dateFrom} TO ${dateTo}]`,
    per_page: "50",
    page: "1",
    orderBy: "creationDate,desc",
  });

  const response = await fetchJson<VtexListResponse>(
    `${getBaseUrl()}/api/oms/pvt/orders?${params}`,
    {
      provider: "vtex",
      headers: getHeaders(),
    },
  );

  const list = response.list ?? [];
  const details = await Promise.allSettled(list.map((order) => fetchOrderById(order.orderId)));

  return details
    .filter(
      (result): result is PromiseFulfilledResult<MonitoredOrder> => result.status === "fulfilled",
    )
    .map((result) => result.value);
}

export async function getOrderStatus(orderId: string) {
  const order = await fetchOrderById(orderId);
  return order.vtexStatus;
}

export async function getInvoiceData(orderId: string) {
  const order = await fetchOrderById(orderId);

  return {
    invoiceNumber: order.invoiceNumber,
    invoiceKey: order.invoiceKey,
    invoicedAt: order.invoicedAt,
    status: order.invoiceNumber || order.invoiceKey ? "invoiced" : "pending",
  };
}

export async function getTrackingInfo(orderId: string): Promise<TrackingInfo | null> {
  const order = await fetchOrderById(orderId);

  if (!order.trackingCode && !order.trackingUrl) {
    return null;
  }

  return {
    carrierName: order.carrierName,
    trackingCode: order.trackingCode,
    trackingUrl: order.trackingUrl,
    lastUpdatedAt: order.lastSyncedAt,
  };
}
