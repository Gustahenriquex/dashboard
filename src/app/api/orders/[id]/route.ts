import { env } from "@/config/env";
import { IntegrationError, apiErrorResponse } from "@/lib/errors";
import { getMockOrderById } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function findOrder(id: string) {
  if (env.USE_MOCK_DATA) {
    return getMockOrderById(id);
  }

  const { getOrderById } = await import("@/server/repositories/orderRepository");
  return getOrderById(id);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await findOrder(decodeURIComponent(id));

    if (!order) {
      throw new IntegrationError({
        provider: "database",
        code: "ORDER_NOT_FOUND",
        status: 404,
        message: `Pedido ${id} nao encontrado.`,
      });
    }

    return Response.json({ order });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
