import { env } from "@/config/env";
import { apiErrorResponse } from "@/lib/errors";
import { getMockOrders } from "@/lib/mock-data";
import type { MonitoredOrder } from "@/types/orders";

export const dynamic = "force-dynamic";

async function getAlertOrders(): Promise<MonitoredOrder[]> {
  if (env.USE_MOCK_DATA) {
    return getMockOrders().filter((order) => order.has48hInvoiceAlert || order.alerts?.length);
  }

  const { listAlerts } = await import("@/server/repositories/orderRepository");
  return listAlerts();
}

export async function GET() {
  try {
    const orders = await getAlertOrders();
    const alerts = orders.flatMap((order) =>
      (order.alerts ?? []).map((alert) => ({
        ...alert,
        order,
      })),
    );

    return Response.json({
      alerts,
      total: alerts.length,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
