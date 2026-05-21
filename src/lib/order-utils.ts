import type { DashboardMetrics, MonitoredOrder, OrderAlert, OrderFilters } from "@/types/orders";

const INVOICED_STATUSES = new Set(["invoiced", "shipped", "delivered"]);
const CANCELED_STATUSES = new Set(["canceled", "cancelled"]);
const WAITING_INVOICE_STATUSES = new Set([
  "ready-for-handling",
  "handling",
  "invoice",
  "awaiting-seller-change",
]);
const PAYMENT_PENDING_STATUSES = new Set(["pending", "processing", "payment-pending"]);
const ERROR_STATUSES = new Set(["integration-error", "error", "refused"]);

export function getHoursSince(date: string | Date) {
  const createdAt = new Date(date).getTime();
  const diff = Date.now() - createdAt;
  return Math.max(0, Math.floor(diff / 36e5));
}

export function hasInvoice(
  order: Pick<MonitoredOrder, "invoiceNumber" | "invoiceKey" | "invoicedAt">,
) {
  return Boolean(order.invoiceNumber || order.invoiceKey || order.invoicedAt);
}

export function isOrderOver48hWithoutInvoice(
  order: Pick<
    MonitoredOrder,
    "createdAt" | "vtexStatus" | "invoiceNumber" | "invoiceKey" | "invoicedAt"
  >,
) {
  const status = String(order.vtexStatus).toLowerCase();

  return (
    getHoursSince(order.createdAt) > 48 &&
    !INVOICED_STATUSES.has(status) &&
    !CANCELED_STATUSES.has(status) &&
    !hasInvoice(order)
  );
}

export function getInvoiceStatus(order: MonitoredOrder) {
  if (CANCELED_STATUSES.has(order.vtexStatus.toLowerCase())) {
    return "cancelado";
  }

  if (hasInvoice(order) || INVOICED_STATUSES.has(order.vtexStatus.toLowerCase())) {
    return "faturado";
  }

  return "aguardando";
}

export function isWaitingInvoice(order: MonitoredOrder) {
  const status = order.vtexStatus.toLowerCase();
  return WAITING_INVOICE_STATUSES.has(status) && !hasInvoice(order);
}

export function isPaymentPending(order: MonitoredOrder) {
  const pagarme = order.pagarmeStatus?.toLowerCase() ?? "";
  const vtex = order.vtexStatus.toLowerCase();
  return PAYMENT_PENDING_STATUSES.has(pagarme) || PAYMENT_PENDING_STATUSES.has(vtex);
}

export function hasIntegrationError(order: MonitoredOrder) {
  return (
    ERROR_STATUSES.has(order.vtexStatus.toLowerCase()) ||
    ERROR_STATUSES.has(order.pagarmeStatus?.toLowerCase() ?? "") ||
    order.alerts?.some((alert) => alert.type === "integration-error") === true
  );
}

export function buildDashboardMetrics(orders: MonitoredOrder[]): DashboardMetrics {
  return {
    totalOrders: orders.length,
    waitingInvoice: orders.filter(isWaitingInvoice).length,
    pendingPayment: orders.filter(isPaymentPending).length,
    invoiced: orders.filter((order) => getInvoiceStatus(order) === "faturado").length,
    canceled: orders.filter((order) => CANCELED_STATUSES.has(order.vtexStatus.toLowerCase()))
      .length,
    integrationErrors: orders.filter(hasIntegrationError).length,
    over48hWithoutInvoice: orders.filter((order) => order.has48hInvoiceAlert).length,
    withTracking: orders.filter((order) => Boolean(order.trackingCode || order.trackingUrl)).length,
    withoutTracking: orders.filter((order) => !order.trackingCode).length,
  };
}

export function getProbableAlertReason(order: MonitoredOrder) {
  const status = order.vtexStatus.toLowerCase();

  if (order.pagarmeStatus === "pending") {
    return "Pagamento ainda pendente na Pagar.me.";
  }

  if (status === "ready-for-handling") {
    return "Pedido pronto para manuseio, mas sem invoice anexada.";
  }

  if (status === "handling" || status === "invoice") {
    return "Pedido em separacao/faturamento sem conclusao.";
  }

  if (status === "awaiting-seller-change") {
    return "Pedido aguardando alteracao do seller antes do faturamento.";
  }

  return "Pedido antigo sem evento de faturamento registrado.";
}

export function getRecommendedAction(order: MonitoredOrder) {
  if (order.pagarmeStatus === "pending") {
    return "Validar pagamento na Pagar.me antes de acionar operacao.";
  }

  if (order.vtexStatus === "awaiting-seller-change") {
    return "Acionar responsavel pelo seller e revisar alteracoes pendentes na VTEX.";
  }

  return "Abrir pedido na VTEX, conferir invoice e acionar operacao/logistica.";
}

export function build48hAlert(order: MonitoredOrder): OrderAlert {
  return {
    type: "over-48h-without-invoice",
    severity: "critical",
    message: "+48h sem faturamento",
    probableReason: getProbableAlertReason(order),
    recommendedAction: getRecommendedAction(order),
    createdAt: new Date().toISOString(),
  };
}

export function normalizeOrderAlerts(order: MonitoredOrder) {
  const alerts = [...(order.alerts ?? [])].filter(
    (alert) => alert.type !== "over-48h-without-invoice",
  );

  if (isOrderOver48hWithoutInvoice(order)) {
    alerts.unshift(build48hAlert(order));
  }

  return {
    ...order,
    has48hInvoiceAlert: isOrderOver48hWithoutInvoice(order),
    alerts,
  };
}

export function filterOrders(orders: MonitoredOrder[], filters: OrderFilters) {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  return orders.filter((order) => {
    if (filters.vtexStatus && order.vtexStatus !== filters.vtexStatus) {
      return false;
    }

    if (filters.pagarmeStatus && order.pagarmeStatus !== filters.pagarmeStatus) {
      return false;
    }

    if (filters.dateFrom && new Date(order.createdAt) < new Date(filters.dateFrom)) {
      return false;
    }

    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      if (new Date(order.createdAt) > endDate) {
        return false;
      }
    }

    if (filters.over48h && !order.has48hInvoiceAlert) {
      return false;
    }

    if (filters.withoutTracking && (order.trackingCode || order.trackingUrl)) {
      return false;
    }

    if (filters.withError && !hasIntegrationError(order)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      order.orderId,
      order.clientName,
      order.clientEmail ?? "",
      order.clientDocument ?? "",
      order.trackingCode ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

export function paginateOrders(orders: MonitoredOrder[], page = 1, pageSize = 20) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const start = (safePage - 1) * safePageSize;

  return {
    page: safePage,
    pageSize: safePageSize,
    total: orders.length,
    orders: orders.slice(start, start + safePageSize),
  };
}

export function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getStatusTone(status?: string | null) {
  const normalized = status?.toLowerCase() ?? "";

  if (
    ["invoiced", "shipped", "delivered", "approved", "paid", "faturado", "entregue"].includes(
      normalized,
    )
  ) {
    return "success";
  }

  if (
    [
      "payment-pending",
      "pending",
      "processing",
      "ready-for-handling",
      "handling",
      "invoice",
    ].includes(normalized)
  ) {
    return "warning";
  }

  if (["integration-error", "error", "refused", "rejected", "recusado"].includes(normalized)) {
    return "destructive";
  }

  if (["canceled", "cancelled", "refunded"].includes(normalized)) {
    return "neutral";
  }

  return "secondary";
}
