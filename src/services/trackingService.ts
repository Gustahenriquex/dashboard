import { env } from "@/config/env";
import { IntegrationError } from "@/lib/errors";
import { getMockOrderById } from "@/lib/mock-data";
import type { MonitoredOrder, TrackingInfo } from "@/types/orders";

const CARRIER_LINK_BUILDERS: Array<{
  match: RegExp;
  build: (code: string) => string;
}> = [
  {
    match: /correios/i,
    build: () => "https://rastreamento.correios.com.br/app/index.php",
  },
  {
    match: /jadlog/i,
    build: () => "https://www.jadlog.com.br/siteInstitucional/tracking.jad",
  },
  {
    match: /total\s*express/i,
    build: (code) =>
      `https://tracking.totalexpress.com.br/poupup_track.php?reid=${encodeURIComponent(code)}`,
  },
  {
    match: /loggi/i,
    build: (code) => `https://www.loggi.com/rastreador/${encodeURIComponent(code)}`,
  },
];

function canAttemptIframe(url?: string | null) {
  if (!url) {
    return false;
  }

  return !/(correios|jadlog|totalexpress)/i.test(url);
}

export function buildFallbackTrackingUrl(
  carrierName?: string | null,
  trackingCode?: string | null,
) {
  if (!carrierName || !trackingCode) {
    return null;
  }

  const builder = CARRIER_LINK_BUILDERS.find((item) => item.match.test(carrierName));
  return builder?.build(trackingCode) ?? null;
}

export function resolveTrackingForOrder(order: MonitoredOrder): TrackingInfo {
  const trackingUrl =
    order.tracking?.trackingUrl ??
    order.trackingUrl ??
    buildFallbackTrackingUrl(order.carrierName, order.trackingCode);

  return {
    carrierName: order.tracking?.carrierName ?? order.carrierName ?? null,
    trackingCode: order.tracking?.trackingCode ?? order.trackingCode ?? null,
    trackingUrl,
    lastStatus: order.tracking?.lastStatus ?? null,
    lastUpdatedAt: order.tracking?.lastUpdatedAt ?? order.lastSyncedAt,
    history: order.tracking?.history ?? [],
    iframeAllowed: canAttemptIframe(trackingUrl),
  };
}

export async function getTrackingByOrderId(orderId: string) {
  let order: MonitoredOrder | undefined;

  if (env.USE_MOCK_DATA) {
    order = getMockOrderById(orderId);
  } else {
    const { getOrderById } = await import("@/server/repositories/orderRepository");
    order = (await getOrderById(orderId)) ?? undefined;
  }

  if (!order) {
    throw new IntegrationError({
      provider: "tracking",
      code: "ORDER_NOT_FOUND",
      status: 404,
      message: `Pedido ${orderId} nao encontrado para rastreio.`,
    });
  }

  return resolveTrackingForOrder(order);
}
