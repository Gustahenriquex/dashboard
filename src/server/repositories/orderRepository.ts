import { getPrisma } from "@/lib/prisma";
import { normalizeOrderAlerts } from "@/lib/order-utils";
import type {
  IntegrationLogEntry,
  MonitoredOrder,
  PaymentStatusInfo,
  TrackingInfo,
} from "@/types/orders";

function serializeDate(value?: Date | string | null) {
  return value ? new Date(value).toISOString() : null;
}

function mapPayment(payment?: any): PaymentStatusInfo | null {
  if (!payment) {
    return null;
  }

  return {
    provider: "pagarme",
    status: payment.status,
    chargeId: payment.chargeId,
    transactionId: payment.transactionId,
    refusalReason: payment.refusalReason,
    amount: payment.amount === null || payment.amount === undefined ? null : Number(payment.amount),
    rawJson: payment.rawJson,
  };
}

function mapTracking(tracking?: any): TrackingInfo | null {
  if (!tracking) {
    return null;
  }

  return {
    carrierName: tracking.carrierName,
    trackingCode: tracking.trackingCode,
    trackingUrl: tracking.trackingUrl,
    lastStatus: tracking.lastStatus,
    lastUpdatedAt: serializeDate(tracking.lastUpdatedAt),
    history: Array.isArray(tracking.history) ? tracking.history : [],
  };
}

function mapOrder(row: any): MonitoredOrder {
  const payment = mapPayment(row.payments?.[0]);
  const tracking = mapTracking(row.trackingInfos?.[0]);

  return normalizeOrderAlerts({
    id: row.id,
    orderId: row.orderId,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    clientDocument: row.clientDocument,
    createdAt: serializeDate(row.createdAt) ?? new Date().toISOString(),
    vtexStatus: row.vtexStatus,
    pagarmeStatus: row.pagarmeStatus,
    invoiceNumber: row.invoiceNumber,
    invoiceKey: row.invoiceKey,
    invoicedAt: serializeDate(row.invoicedAt),
    carrierName: row.carrierName,
    trackingCode: row.trackingCode,
    trackingUrl: row.trackingUrl,
    totalValue:
      row.totalValue === null || row.totalValue === undefined ? null : Number(row.totalValue),
    has48hInvoiceAlert: row.has48hInvoiceAlert,
    lastSyncedAt: serializeDate(row.lastSyncedAt) ?? new Date().toISOString(),
    updatedAt: serializeDate(row.updatedAt),
    items: Array.isArray(row.items) ? row.items : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    payment,
    tracking,
    alerts: (row.alerts ?? []).map((alert: any) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      probableReason: alert.probableReason,
      recommendedAction: alert.recommendedAction,
      createdAt: serializeDate(alert.createdAt) ?? new Date().toISOString(),
      resolvedAt: serializeDate(alert.resolvedAt),
    })),
    rawVtexJson: row.rawVtexJson,
    rawPagarmeJson: row.rawPagarmeJson,
  });
}

const orderInclude = {
  payments: {
    orderBy: { createdAt: "desc" },
    take: 1,
  },
  trackingInfos: {
    orderBy: { updatedAt: "desc" },
    take: 1,
  },
  alerts: {
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
  },
};

export async function listOrders(): Promise<MonitoredOrder[]> {
  const prisma = await getPrisma();
  const rows = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapOrder);
}

export async function getOrderById(idOrOrderId: string): Promise<MonitoredOrder | null> {
  const prisma = await getPrisma();
  const row = await prisma.order.findFirst({
    where: {
      OR: [{ id: idOrOrderId }, { orderId: idOrOrderId }],
    },
    include: orderInclude,
  });

  return row ? mapOrder(row) : null;
}

export async function upsertOrder(order: MonitoredOrder): Promise<MonitoredOrder | null> {
  const prisma = await getPrisma();
  const normalized = normalizeOrderAlerts(order);
  const saved = await prisma.order.upsert({
    where: { orderId: normalized.orderId },
    update: {
      clientName: normalized.clientName,
      clientEmail: normalized.clientEmail,
      clientDocument: normalized.clientDocument,
      createdAt: new Date(normalized.createdAt),
      vtexStatus: normalized.vtexStatus,
      pagarmeStatus: normalized.pagarmeStatus,
      invoiceNumber: normalized.invoiceNumber,
      invoiceKey: normalized.invoiceKey,
      invoicedAt: normalized.invoicedAt ? new Date(normalized.invoicedAt) : null,
      carrierName: normalized.carrierName,
      trackingCode: normalized.trackingCode,
      trackingUrl: normalized.trackingUrl,
      totalValue: normalized.totalValue,
      has48hInvoiceAlert: normalized.has48hInvoiceAlert,
      items: (normalized.items ?? []) as any,
      timeline: (normalized.timeline ?? []) as any,
      rawVtexJson: normalized.rawVtexJson as any,
      rawPagarmeJson: normalized.rawPagarmeJson as any,
      lastSyncedAt: new Date(),
    },
    create: {
      orderId: normalized.orderId,
      clientName: normalized.clientName,
      clientEmail: normalized.clientEmail,
      clientDocument: normalized.clientDocument,
      createdAt: new Date(normalized.createdAt),
      vtexStatus: normalized.vtexStatus,
      pagarmeStatus: normalized.pagarmeStatus,
      invoiceNumber: normalized.invoiceNumber,
      invoiceKey: normalized.invoiceKey,
      invoicedAt: normalized.invoicedAt ? new Date(normalized.invoicedAt) : null,
      carrierName: normalized.carrierName,
      trackingCode: normalized.trackingCode,
      trackingUrl: normalized.trackingUrl,
      totalValue: normalized.totalValue,
      has48hInvoiceAlert: normalized.has48hInvoiceAlert,
      items: (normalized.items ?? []) as any,
      timeline: (normalized.timeline ?? []) as any,
      rawVtexJson: normalized.rawVtexJson as any,
      rawPagarmeJson: normalized.rawPagarmeJson as any,
      lastSyncedAt: new Date(),
    },
  });

  if (normalized.payment) {
    await prisma.paymentStatus.create({
      data: {
        orderId: saved.id,
        provider: normalized.payment.provider,
        status: normalized.payment.status,
        chargeId: normalized.payment.chargeId,
        transactionId: normalized.payment.transactionId,
        refusalReason: normalized.payment.refusalReason,
        amount: normalized.payment.amount,
        rawJson: normalized.payment.rawJson as any,
      },
    });
  }

  if (normalized.tracking || normalized.trackingCode || normalized.trackingUrl) {
    await prisma.trackingInfo.create({
      data: {
        orderId: saved.id,
        carrierName: normalized.tracking?.carrierName ?? normalized.carrierName,
        trackingCode: normalized.tracking?.trackingCode ?? normalized.trackingCode,
        trackingUrl: normalized.tracking?.trackingUrl ?? normalized.trackingUrl,
        lastStatus: normalized.tracking?.lastStatus,
        lastUpdatedAt: normalized.tracking?.lastUpdatedAt
          ? new Date(normalized.tracking.lastUpdatedAt)
          : null,
        history: (normalized.tracking?.history ?? []) as any,
      },
    });
  }

  await prisma.orderAlert.deleteMany({
    where: {
      orderId: saved.id,
      resolvedAt: null,
    },
  });

  if (normalized.alerts?.length) {
    await prisma.orderAlert.createMany({
      data: normalized.alerts.map((alert) => ({
        orderId: saved.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        probableReason: alert.probableReason,
        recommendedAction: alert.recommendedAction,
        createdAt: new Date(alert.createdAt),
        resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : null,
      })),
    });
  }

  return getOrderById(saved.orderId);
}

export async function listAlerts(): Promise<MonitoredOrder[]> {
  const orders = await listOrders();
  return orders.filter((order) => order.alerts?.length || order.has48hInvoiceAlert);
}

export async function createIntegrationLog(
  input: Omit<IntegrationLogEntry, "id" | "createdAt"> & { createdAt?: string },
) {
  const prisma = await getPrisma();
  const order = input.orderId
    ? await prisma.order.findFirst({
        where: {
          OR: [{ id: input.orderId }, { orderId: input.orderId }],
        },
        select: { id: true },
      })
    : null;

  await prisma.integrationLog.create({
    data: {
      orderId: order?.id,
      provider: input.provider,
      action: input.action,
      status: input.status,
      message: input.message,
      requestId: input.requestId,
      errorCode: input.errorCode,
      durationMs: input.durationMs,
      metadata: input.metadata as any,
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
    },
  });
}

export async function listIntegrationLogs() {
  const prisma = await getPrisma();
  const rows = await prisma.integrationLog.findMany({
    include: {
      order: {
        select: {
          orderId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return rows.map((row: any) => ({
    id: row.id,
    provider: row.provider,
    action: row.action,
    status: row.status,
    message: row.message,
    orderId: row.order?.orderId ?? null,
    requestId: row.requestId,
    errorCode: row.errorCode,
    durationMs: row.durationMs,
    metadata: row.metadata,
    createdAt: serializeDate(row.createdAt) ?? new Date().toISOString(),
  })) satisfies IntegrationLogEntry[];
}
