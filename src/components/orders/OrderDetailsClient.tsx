"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, RefreshCcw, Truck } from "lucide-react";

import { StatusBadge } from "@/components/orders/StatusBadge";
import { TrackingModal } from "@/components/tracking/TrackingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrder, useResyncOrder } from "@/hooks/useOrders";
import { formatCurrency, formatDateTime, getHoursSince, getInvoiceStatus } from "@/lib/order-utils";

export function OrderDetailsClient({ orderId }: { orderId: string }) {
  const orderQuery = useOrder(orderId);
  const resyncMutation = useResyncOrder();
  const order = orderQuery.data?.order;

  if (orderQuery.isLoading || !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="link" className="mb-2">
            <Link href="/orders">
              <ArrowLeft />
              Pedidos
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-normal">{order.orderId}</h1>
          <p className="text-sm text-muted-foreground">
            {order.clientName} · criado em {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => resyncMutation.mutate(order.orderId)}
            disabled={resyncMutation.isPending}
          >
            <RefreshCcw className={resyncMutation.isPending ? "animate-spin" : ""} />
            Ressincronizar
          </Button>
          <TrackingModal order={order}>
            <Button type="button" variant="outline">
              <Truck />
              Rastreio
            </Button>
          </TrackingModal>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Status VTEX</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={order.vtexStatus} />
            <p className="mt-3 text-sm text-muted-foreground">
              {getHoursSince(order.createdAt)}h desde a criacao
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={order.pagarmeStatus} />
            <p className="mt-3 text-sm text-muted-foreground">{formatCurrency(order.totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={getInvoiceStatus(order)} />
            <p className="mt-3 text-sm text-muted-foreground">
              {order.invoiceNumber ?? "Sem nota fiscal"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            {order.has48hInvoiceAlert ? (
              <Badge variant="destructive">+48h sem faturamento</Badge>
            ) : (
              <Badge variant="success">Sem alerta 48h</Badge>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              Sync: {formatDateTime(order.lastSyncedAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{order.clientName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="break-words font-medium">{order.clientEmail ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Documento</p>
              <p className="font-medium">{order.clientDocument ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Transportadora</p>
              <p className="font-medium">{order.carrierName ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Codigo</p>
              <p className="break-words font-medium">{order.trackingCode ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">URL</p>
              <p className="break-words font-medium">{order.trackingUrl ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento Pagar.me</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              <StatusBadge status={order.payment?.status ?? order.pagarmeStatus} />
            </div>
            <div>
              <p className="text-muted-foreground">Charge</p>
              <p className="font-medium">{order.payment?.chargeId ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Motivo de recusa</p>
              <p className="font-medium">{order.payment?.refusalReason ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens comprados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>Preco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.length ? (
                order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Itens indisponiveis.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.timeline?.length ? (
                order.timeline.map((event, index) => (
                  <div
                    key={`${event.happenedAt}-${index}`}
                    className="border-l-2 border-primary pl-4"
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(event.happenedAt)}
                    </p>
                    {event.description ? <p className="mt-1 text-sm">{event.description}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Timeline indisponivel.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas encontrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.alerts?.length ? (
              order.alerts.map((alert) => (
                <div key={`${alert.type}-${alert.createdAt}`} className="rounded-lg border p-3">
                  <Badge variant={alert.severity === "critical" ? "destructive" : "warning"}>
                    {alert.message}
                  </Badge>
                  <p className="mt-3 text-sm">{alert.probableReason ?? "-"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.recommendedAction ?? "-"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem alertas ativos.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug tecnico</CardTitle>
        </CardHeader>
        <CardContent>
          <details className="rounded-lg border bg-zinc-950 p-4 text-zinc-50">
            <summary className="cursor-pointer text-sm font-medium">JSON bruto</summary>
            <pre className="mt-4 max-h-96 overflow-auto text-xs">
              {JSON.stringify({ vtex: order.rawVtexJson, pagarme: order.rawPagarmeJson }, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
