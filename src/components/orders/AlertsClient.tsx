"use client";

import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";

import { StatusBadge } from "@/components/orders/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlerts, useResyncOrder } from "@/hooks/useOrders";
import { formatDateTime, getHoursSince } from "@/lib/order-utils";

export function AlertsClient() {
  const alertsQuery = useAlerts();
  const resyncMutation = useResyncOrder();
  const alerts = alertsQuery.data?.alerts ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Alertas SAC</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos com risco operacional e faturamento atrasado.
          </p>
        </div>
        <Badge variant="destructive">{alerts.length} alertas ativos</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {alertsQuery.isError ? (
            <div className="p-4">
              <ErrorState
                title="Alertas indisponiveis"
                message={alertsQuery.error.message}
                onRetry={() => void alertsQuery.refetch()}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Criacao</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Status VTEX</TableHead>
                  <TableHead>Status Pagar.me</TableHead>
                  <TableHead>Motivo provavel</TableHead>
                  <TableHead>Acao recomendada</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertsQuery.isLoading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={9}>
                          <Skeleton className="h-9 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}

                {!alertsQuery.isLoading && alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Nenhum alerta ativo.
                    </TableCell>
                  </TableRow>
                ) : null}

                {!alertsQuery.isLoading
                  ? alerts.map((alert) => (
                      <TableRow key={`${alert.order.orderId}-${alert.type}`}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/orders/${encodeURIComponent(alert.order.orderId)}`}
                            className="hover:text-primary"
                          >
                            {alert.order.orderId}
                          </Link>
                        </TableCell>
                        <TableCell>{alert.order.clientName}</TableCell>
                        <TableCell>{formatDateTime(alert.order.createdAt)}</TableCell>
                        <TableCell>{getHoursSince(alert.order.createdAt)}h</TableCell>
                        <TableCell>
                          <StatusBadge status={alert.order.vtexStatus} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={alert.order.pagarmeStatus} />
                        </TableCell>
                        <TableCell className="max-w-72">{alert.probableReason ?? "-"}</TableCell>
                        <TableCell className="max-w-72">{alert.recommendedAction ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => resyncMutation.mutate(alert.order.orderId)}
                              disabled={resyncMutation.isPending}
                              title="Ressincronizar"
                            >
                              <RefreshCcw
                                className={resyncMutation.isPending ? "animate-spin" : ""}
                              />
                            </Button>
                            <Button asChild variant="ghost" size="icon" title="Ver pedido">
                              <Link href={`/orders/${encodeURIComponent(alert.order.orderId)}`}>
                                <ArrowRight />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
