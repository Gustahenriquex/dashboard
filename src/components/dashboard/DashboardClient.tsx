"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileWarning,
  PackageCheck,
  PackageSearch,
  PackageX,
  Truck,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/useOrders";
import { formatDateTime, getHoursSince } from "@/lib/order-utils";

export function DashboardClient() {
  const ordersQuery = useOrders({ pageSize: 100 });
  const metrics = ordersQuery.data?.metrics;
  const alertOrders = (ordersQuery.data?.orders ?? [])
    .filter((order) => order.has48hInvoiceAlert)
    .sort((a, b) => getHoursSince(b.createdAt) - getHoursSince(a.createdAt))
    .slice(0, 5);

  if (ordersQuery.isError) {
    return (
      <ErrorState
        title="Dashboard indisponivel"
        message={ordersQuery.error.message}
        onRetry={() => void ordersQuery.refetch()}
      />
    );
  }

  if (ordersQuery.isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total monitorado"
          value={metrics.totalOrders}
          icon={PackageSearch}
          tone="info"
        />
        <MetricCard
          title="Aguardando faturamento"
          value={metrics.waitingInvoice}
          icon={Clock3}
          tone="warning"
        />
        <MetricCard
          title="Pagamento pendente"
          value={metrics.pendingPayment}
          icon={CreditCard}
          tone="warning"
        />
        <MetricCard title="Faturados" value={metrics.invoiced} icon={PackageCheck} tone="success" />
        <MetricCard title="Cancelados" value={metrics.canceled} icon={Ban} />
        <MetricCard
          title="Erro de integracao"
          value={metrics.integrationErrors}
          icon={FileWarning}
          tone="destructive"
        />
        <MetricCard
          title="+48h sem faturamento"
          value={metrics.over48hWithoutInvoice}
          icon={AlertTriangle}
          tone="destructive"
        />
        <MetricCard title="Com rastreio" value={metrics.withTracking} icon={Truck} tone="success" />
        <MetricCard
          title="Sem codigo de rastreio"
          value={metrics.withoutTracking}
          icon={PackageX}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Dashboard SAC</h1>
            <p className="text-sm text-muted-foreground">
              Pedidos VTEX, pagamentos Pagar.me e alertas operacionais.
            </p>
          </div>
          <OrdersTable compact initialFilters={{ pageSize: 8 }} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Alertas SAC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertOrders.length ? (
              alertOrders.map((order) => (
                <div key={order.orderId} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{order.orderId}</p>
                      <p className="text-sm text-muted-foreground">{order.clientName}</p>
                    </div>
                    <StatusBadge status={order.vtexStatus} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>{getHoursSince(order.createdAt)}h em aberto</span>
                    <span className="text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border text-sm text-muted-foreground">
                <CheckCircle2 className="mr-2 size-4 text-emerald-600" />
                Sem alertas ativos
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
