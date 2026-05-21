import { apiErrorResponse } from "@/lib/errors";
import { syncOrderById } from "@/services/syncService";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await syncOrderById(decodeURIComponent(id));

    return Response.json({
      status: "success",
      order,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
