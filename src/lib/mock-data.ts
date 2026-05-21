import type { IntegrationLogEntry, MonitoredOrder } from "@/types/orders";
import { normalizeOrderAlerts } from "@/lib/order-utils";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const baseOrders: MonitoredOrder[] = [
  {
    id: "mock-order-1001",
    orderId: "VTEX-1001",
    clientName: "Marina Albuquerque",
    clientEmail: "marina.albuquerque@example.com",
    clientDocument: "123.456.789-10",
    createdAt: hoursAgo(74),
    vtexStatus: "ready-for-handling",
    pagarmeStatus: "approved",
    totalValue: 489.9,
    has48hInvoiceAlert: true,
    lastSyncedAt: hoursAgo(1),
    items: [{ id: "item-1", sku: "SKU-CAF-001", name: "Cafeteira Pro", quantity: 1, price: 489.9 }],
    payment: {
      provider: "pagarme",
      status: "approved",
      chargeId: "ch_mock_1001",
      transactionId: "tr_mock_1001",
      amount: 489.9,
    },
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(74) },
      { status: "approved", title: "Pagamento aprovado", happenedAt: hoursAgo(73) },
      { status: "ready-for-handling", title: "Pronto para manuseio", happenedAt: hoursAgo(72) },
    ],
  },
  {
    id: "mock-order-1002",
    orderId: "VTEX-1002",
    clientName: "Rafael Pires",
    clientEmail: "rafael.pires@example.com",
    clientDocument: "987.654.321-00",
    createdAt: hoursAgo(92),
    vtexStatus: "handling",
    pagarmeStatus: "pending",
    totalValue: 219.5,
    has48hInvoiceAlert: true,
    lastSyncedAt: hoursAgo(2),
    items: [
      { id: "item-2", sku: "SKU-KIT-234", name: "Kit Organizacao", quantity: 2, price: 109.75 },
    ],
    payment: {
      provider: "pagarme",
      status: "pending",
      chargeId: "ch_mock_1002",
      transactionId: "tr_mock_1002",
      amount: 219.5,
    },
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(92) },
      { status: "handling", title: "Pedido em manuseio", happenedAt: hoursAgo(89) },
    ],
  },
  {
    id: "mock-order-1003",
    orderId: "VTEX-1003",
    clientName: "Beatriz Costa",
    clientEmail: "beatriz.costa@example.com",
    clientDocument: "456.789.123-45",
    createdAt: hoursAgo(67),
    vtexStatus: "awaiting-seller-change",
    pagarmeStatus: "approved",
    totalValue: 1299,
    has48hInvoiceAlert: true,
    lastSyncedAt: hoursAgo(3),
    items: [
      { id: "item-3", sku: "SKU-MOB-782", name: "Mesa Office Compacta", quantity: 1, price: 1299 },
    ],
    payment: {
      provider: "pagarme",
      status: "approved",
      chargeId: "ch_mock_1003",
      transactionId: "tr_mock_1003",
      amount: 1299,
    },
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(67) },
      { status: "awaiting-seller-change", title: "Aguardando seller", happenedAt: hoursAgo(65) },
    ],
  },
  {
    id: "mock-order-1004",
    orderId: "VTEX-1004",
    clientName: "Gabriel Mendes",
    clientEmail: "gabriel.mendes@example.com",
    clientDocument: "321.654.987-12",
    createdAt: hoursAgo(18),
    vtexStatus: "invoiced",
    pagarmeStatus: "approved",
    invoiceNumber: "NF-88901",
    invoiceKey: "35260500000000000000550010000088901123456789",
    invoicedAt: hoursAgo(6),
    carrierName: "Correios",
    trackingCode: "BR123456789BR",
    trackingUrl: "https://rastreamento.correios.com.br/app/index.php",
    totalValue: 349.9,
    has48hInvoiceAlert: false,
    lastSyncedAt: hoursAgo(1),
    items: [
      { id: "item-4", sku: "SKU-FON-991", name: "Fone Bluetooth", quantity: 1, price: 349.9 },
    ],
    payment: {
      provider: "pagarme",
      status: "approved",
      chargeId: "ch_mock_1004",
      transactionId: "tr_mock_1004",
      amount: 349.9,
    },
    tracking: {
      carrierName: "Correios",
      trackingCode: "BR123456789BR",
      trackingUrl: "https://rastreamento.correios.com.br/app/index.php",
      lastStatus: "Objeto postado",
      lastUpdatedAt: hoursAgo(4),
      history: [
        {
          status: "posted",
          description: "Objeto postado",
          location: "Sao Paulo/SP",
          happenedAt: hoursAgo(4),
        },
      ],
    },
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(18) },
      { status: "invoiced", title: "Nota fiscal emitida", happenedAt: hoursAgo(6) },
      { status: "tracking", title: "Rastreio recebido", happenedAt: hoursAgo(4) },
    ],
  },
  {
    id: "mock-order-1005",
    orderId: "VTEX-1005",
    clientName: "Luana Ferreira",
    clientEmail: "luana.ferreira@example.com",
    clientDocument: "654.987.123-77",
    createdAt: hoursAgo(26),
    vtexStatus: "canceled",
    pagarmeStatus: "canceled",
    totalValue: 189.9,
    has48hInvoiceAlert: false,
    lastSyncedAt: hoursAgo(1),
    items: [
      { id: "item-5", sku: "SKU-COS-011", name: "Necessaire Premium", quantity: 1, price: 189.9 },
    ],
    payment: {
      provider: "pagarme",
      status: "canceled",
      chargeId: "ch_mock_1005",
      transactionId: "tr_mock_1005",
      amount: 189.9,
    },
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(26) },
      { status: "canceled", title: "Pedido cancelado", happenedAt: hoursAgo(20) },
    ],
  },
  {
    id: "mock-order-1006",
    orderId: "VTEX-1006",
    clientName: "Thiago Lima",
    clientEmail: "thiago.lima@example.com",
    clientDocument: "741.852.963-55",
    createdAt: hoursAgo(54),
    vtexStatus: "delivered",
    pagarmeStatus: "approved",
    invoiceNumber: "NF-88902",
    invoiceKey: "35260500000000000000550010000088902123456789",
    invoicedAt: hoursAgo(45),
    carrierName: "Jadlog",
    trackingCode: "JAD123456",
    trackingUrl: "https://www.jadlog.com.br/siteInstitucional/tracking.jad",
    totalValue: 759,
    has48hInvoiceAlert: false,
    lastSyncedAt: hoursAgo(1),
    items: [
      { id: "item-6", sku: "SKU-BAG-345", name: "Mochila Executiva", quantity: 1, price: 759 },
    ],
    payment: {
      provider: "pagarme",
      status: "approved",
      chargeId: "ch_mock_1006",
      transactionId: "tr_mock_1006",
      amount: 759,
    },
    tracking: {
      carrierName: "Jadlog",
      trackingCode: "JAD123456",
      trackingUrl: "https://www.jadlog.com.br/siteInstitucional/tracking.jad",
      lastStatus: "Entregue ao destinatario",
      lastUpdatedAt: hoursAgo(8),
      history: [
        {
          status: "delivered",
          description: "Entregue ao destinatario",
          location: "Campinas/SP",
          happenedAt: hoursAgo(8),
        },
        {
          status: "out-for-delivery",
          description: "Saiu para entrega",
          location: "Campinas/SP",
          happenedAt: hoursAgo(16),
        },
      ],
    },
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(54) },
      { status: "invoiced", title: "Nota fiscal emitida", happenedAt: hoursAgo(45) },
      { status: "delivered", title: "Pedido entregue", happenedAt: hoursAgo(8) },
    ],
  },
  {
    id: "mock-order-1007",
    orderId: "VTEX-1007",
    clientName: "Patricia Rocha",
    clientEmail: "patricia.rocha@example.com",
    clientDocument: "159.753.486-20",
    createdAt: hoursAgo(8),
    vtexStatus: "payment-pending",
    pagarmeStatus: "pending",
    totalValue: 99.9,
    has48hInvoiceAlert: false,
    lastSyncedAt: hoursAgo(1),
    items: [{ id: "item-7", sku: "SKU-USB-020", name: "Hub USB-C", quantity: 1, price: 99.9 }],
    payment: {
      provider: "pagarme",
      status: "pending",
      chargeId: "ch_mock_1007",
      transactionId: "tr_mock_1007",
      amount: 99.9,
    },
    timeline: [{ status: "created", title: "Pedido criado", happenedAt: hoursAgo(8) }],
  },
  {
    id: "mock-order-1008",
    orderId: "VTEX-1008",
    clientName: "Henrique Souza",
    clientEmail: "henrique.souza@example.com",
    clientDocument: "852.147.963-66",
    createdAt: hoursAgo(15),
    vtexStatus: "integration-error",
    pagarmeStatus: "error",
    totalValue: 629.9,
    has48hInvoiceAlert: false,
    lastSyncedAt: hoursAgo(5),
    items: [{ id: "item-8", sku: "SKU-CAM-500", name: "Camera Wi-Fi", quantity: 1, price: 629.9 }],
    payment: {
      provider: "pagarme",
      status: "error",
      chargeId: "ch_mock_1008",
      transactionId: "tr_mock_1008",
      refusalReason: "Timeout ao consultar charge",
      amount: 629.9,
    },
    alerts: [
      {
        type: "integration-error",
        severity: "high",
        message: "Falha ao consultar Pagar.me",
        probableReason: "API indisponivel ou timeout na ultima sincronizacao.",
        recommendedAction: "Tentar ressincronizar e validar credenciais caso o erro persista.",
        createdAt: hoursAgo(5),
      },
    ],
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(15) },
      { status: "integration-error", title: "Erro de integracao", happenedAt: hoursAgo(5) },
    ],
  },
  {
    id: "mock-order-1009",
    orderId: "VTEX-1009",
    clientName: "Camila Nogueira",
    clientEmail: "camila.nogueira@example.com",
    clientDocument: "963.852.741-33",
    createdAt: hoursAgo(36),
    vtexStatus: "shipped",
    pagarmeStatus: "approved",
    invoiceNumber: "NF-88903",
    invoiceKey: "35260500000000000000550010000088903123456789",
    invoicedAt: hoursAgo(30),
    carrierName: "Total Express",
    totalValue: 159.9,
    has48hInvoiceAlert: false,
    lastSyncedAt: hoursAgo(2),
    items: [
      { id: "item-9", sku: "SKU-BEA-808", name: "Secador Travel", quantity: 1, price: 159.9 },
    ],
    payment: {
      provider: "pagarme",
      status: "approved",
      chargeId: "ch_mock_1009",
      transactionId: "tr_mock_1009",
      amount: 159.9,
    },
    timeline: [
      { status: "created", title: "Pedido criado", happenedAt: hoursAgo(36) },
      { status: "invoiced", title: "Nota fiscal emitida", happenedAt: hoursAgo(30) },
      { status: "shipped", title: "Pedido enviado", happenedAt: hoursAgo(18) },
    ],
  },
];

export function getMockOrders() {
  return baseOrders.map((order) =>
    normalizeOrderAlerts({
      ...order,
      tracking:
        order.tracking ??
        (order.trackingCode || order.trackingUrl
          ? {
              carrierName: order.carrierName,
              trackingCode: order.trackingCode,
              trackingUrl: order.trackingUrl,
              lastUpdatedAt: order.lastSyncedAt,
            }
          : null),
    }),
  );
}

export function getMockOrderById(orderId: string) {
  const normalized = orderId.toLowerCase();
  return getMockOrders().find(
    (order) => order.id.toLowerCase() === normalized || order.orderId.toLowerCase() === normalized,
  );
}

export function getMockLogs(): IntegrationLogEntry[] {
  return [
    {
      id: "mock-log-1",
      provider: "sync",
      action: "sync-orders",
      status: "success",
      message: "Sincronizacao mock concluida",
      durationMs: 312,
      createdAt: hoursAgo(1),
    },
    {
      id: "mock-log-2",
      provider: "pagarme",
      action: "fetch-payment",
      status: "warning",
      message: "Pagamento pendente retornado pela Pagar.me",
      orderId: "VTEX-1002",
      durationMs: 184,
      createdAt: hoursAgo(2),
    },
    {
      id: "mock-log-3",
      provider: "pagarme",
      action: "fetch-payment",
      status: "error",
      message: "Timeout ao consultar charge",
      orderId: "VTEX-1008",
      errorCode: "TIMEOUT",
      durationMs: 15000,
      createdAt: hoursAgo(5),
    },
    {
      id: "mock-log-4",
      provider: "vtex",
      action: "fetch-order",
      status: "success",
      message: "Pedido encontrado no OMS",
      orderId: "VTEX-1004",
      durationMs: 221,
      createdAt: hoursAgo(1),
    },
  ];
}
