import { env } from "@/config/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    mode: env.USE_MOCK_DATA ? "mock" : "live",
    timestamp: new Date().toISOString(),
  });
}
