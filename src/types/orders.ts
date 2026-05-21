export type VtexStatus =
  | "payment-pending"
  | "ready-for-handling"
  | "handling"
  | "invoice"
  | "invoiced"
  | "shipped"
  | "delivered"
  | "canceled"
  | "awaiting-seller-change"
  | "integration-error"
  | string;

export type PagarmeStatus =
  | "approved"
  | "pending"
  | "refused"
  | "canceled"
  | "refunded"
  | "processing"
  | "not-found"
  | "error"
  | string;

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type IntegrationProvider = "vtex" | "pagarme" | "tracking" | "database" | "sync";

export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string | null;
}

export interface TrackingEvent {
  status: string;
  description?: string | null;
  location?: string | null;
  happenedAt: string;
}

export interface TrackingInfo {
  carrierName?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  lastStatus?: string | null;
  lastUpdatedAt?: string | null;
  history?: TrackingEvent[];
  iframeAllowed?: boolean;
}

export interface PaymentStatusInfo {
  provider: "pagarme";
  status: PagarmeStatus;
  chargeId?: string | null;
  transactionId?: string | null;
  refusalReason?: string | null;
  amount?: number | null;
  rawJson?: unknown;
}

export interface OrderAlert {
  id?: string;
  type: "over-48h-without-invoice" | "payment-risk" | "integration-error" | string;
  severity: AlertSeverity;
  message: string;
  probableReason?: string | null;
  recommendedAction?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface OrderTimelineEvent {
  status: string;
  title: string;
  description?: string | null;
  happenedAt: string;
}

export interface MonitoredOrder {
  id: string;
  orderId: string;
  clientName: string;
  clientEmail?: string | null;
  clientDocument?: string | null;
  createdAt: string;
  vtexStatus: VtexStatus;
  pagarmeStatus?: PagarmeStatus | null;
  invoiceNumber?: string | null;
  invoiceKey?: string | null;
  invoicedAt?: string | null;
  carrierName?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  totalValue?: number | null;
  has48hInvoiceAlert: boolean;
  lastSyncedAt: string;
  updatedAt?: string | null;
  items?: OrderItem[];
  payment?: PaymentStatusInfo | null;
  tracking?: TrackingInfo | null;
  alerts?: OrderAlert[];
  timeline?: OrderTimelineEvent[];
  rawVtexJson?: unknown;
  rawPagarmeJson?: unknown;
}

export interface DashboardMetrics {
  totalOrders: number;
  waitingInvoice: number;
  pendingPayment: number;
  invoiced: number;
  canceled: number;
  integrationErrors: number;
  over48hWithoutInvoice: number;
  withTracking: number;
  withoutTracking: number;
}

export interface OrderFilters {
  query?: string;
  vtexStatus?: string;
  pagarmeStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  over48h?: boolean;
  withoutTracking?: boolean;
  withError?: boolean;
  page?: number;
  pageSize?: number;
}

export interface OrdersApiResponse {
  orders: MonitoredOrder[];
  metrics: DashboardMetrics;
  total: number;
  page: number;
  pageSize: number;
}

export interface SyncOrdersInput {
  dateFrom?: string;
  dateTo?: string;
  orderId?: string;
}

export interface IntegrationLogEntry {
  id: string;
  provider: IntegrationProvider;
  action: string;
  status: "success" | "warning" | "error";
  message: string;
  orderId?: string | null;
  requestId?: string | null;
  errorCode?: string | null;
  durationMs?: number | null;
  metadata?: unknown;
  createdAt: string;
}
