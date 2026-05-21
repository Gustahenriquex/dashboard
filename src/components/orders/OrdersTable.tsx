"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, ExternalLink, Eye, FilterX, RefreshCcw, Search } from "lucide-react";

import { StatusBadge } from "@/components/orders/StatusBadge";
import { TrackingModal } from "@/components/tracking/TrackingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders, useResyncOrder } from "@/hooks/useOrders";
import { formatCurrency, formatDateTime, getHoursSince, getInvoiceStatus } from "@/lib/order-utils";
import type { MonitoredOrder, OrderFilters } from "@/types/orders";

const vtexStatuses = [
  "payment-pending",
  "ready-for-handling",
  "handling",
  "invoice",
  "awaiting-seller-change",
  "invoiced",
  "shipped",
  "delivered",
  "canceled",
  "integration-error",
];

const pagarmeStatuses = [
  "approved",
  "pending",
  "processing",
  "refused",
  "canceled",
  "refunded",
  "error",
];

interface OrdersTableProps {
  initialFilters?: OrderFilters;
  compact?: boolean;
}

function BooleanFilter({
  checked,
  onChange,
  label,
}: {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-input"
      />
      {label}
    </label>
  );
}

function EmptyRows() {
  return (
    <TableRow>
      <TableCell colSpan={14} className="h-32 text-center text-muted-foreground">
        Nenhum pedido encontrado.
      </TableCell>
    </TableRow>
  );
}

function LoadingRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell colSpan={14}>
        <Skeleton className="h-8 w-full" />
      </TableCell>
    </TableRow>
  ));
}

function TrackingCell({ order }: { order: MonitoredOrder }) {
  if (!order.trackingCode && !order.trackingUrl) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <TrackingModal order={order}>
      <Button type="button" variant="link" size="sm" className="h-auto justify-start p-0">
        {order.trackingCode ?? "Abrir rastreio"}
      </Button>
    </TrackingModal>
  );
}

export function OrdersTable({ initialFilters, compact = false }: OrdersTableProps) {
  const [filters, setFilters] = React.useState<OrderFilters>({
    page: 1,
    pageSize: compact ? 8 : 10,
    ...initialFilters,
  });
  const ordersQuery = useOrders(filters);
  const resyncMutation = useResyncOrder();

  const orders = ordersQuery.data?.orders ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const page = ordersQuery.data?.page ?? filters.page ?? 1;
  const pageSize = ordersQuery.data?.pageSize ?? filters.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateFilters(next: Partial<OrderFilters>) {
    setFilters((current) => ({
      ...current,
      ...next,
      page: next.page ?? 1,
    }));
  }

  function clearFilters() {
    setFilters({ page: 1, pageSize: compact ? 8 : 10 });
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="grid gap-3 rounded-lg border bg-white p-4 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={filters.query ?? ""}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Pedido, CPF, e-mail ou cliente"
              className="pl-9"
            />
          </div>

          <Select
            value={filters.vtexStatus ?? ""}
            onChange={(event) => updateFilters({ vtexStatus: event.target.value })}
          >
            <option value="">Status VTEX</option>
            {vtexStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Select
            value={filters.pagarmeStatus ?? ""}
            onChange={(event) => updateFilters({ pagarmeStatus: event.target.value })}
          >
            <option value="">Status Pagar.me</option>
            {pagarmeStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) => updateFilters({ dateFrom: event.target.value })}
          />
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) => updateFilters({ dateTo: event.target.value })}
          />

          <div className="flex flex-wrap gap-2 lg:col-span-5">
            <BooleanFilter
              checked={filters.over48h}
              onChange={(checked) => updateFilters({ over48h: checked })}
              label="+48h sem faturamento"
            />
            <BooleanFilter
              checked={filters.withoutTracking}
              onChange={(checked) => updateFilters({ withoutTracking: checked })}
              label="Sem rastreio"
            />
            <BooleanFilter
              checked={filters.withError}
              onChange={(checked) => updateFilters({ withError: checked })}
              label="Com erro"
            />
            <Button type="button" variant="outline" onClick={clearFilters}>
              <FilterX />
              Limpar
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border bg-white">
        {ordersQuery.isError ? (
          <div className="p-4">
            <ErrorState
              title="Pedidos indisponiveis"
              message={ordersQuery.error.message}
              onRetry={() => void ordersQuery.refetch()}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                {!compact ? <TableHead>CPF/e-mail</TableHead> : null}
                <TableHead>Criacao</TableHead>
                <TableHead>Status VTEX</TableHead>
                <TableHead>Status Pagar.me</TableHead>
                <TableHead>Faturamento</TableHead>
                {!compact ? <TableHead>NF</TableHead> : null}
                {!compact ? <TableHead>Transportadora</TableHead> : null}
                <TableHead>Rastreio</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Alerta</TableHead>
                {!compact ? <TableHead>Atualizacao</TableHead> : null}
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersQuery.isLoading ? <LoadingRows /> : null}
              {!ordersQuery.isLoading && orders.length === 0 ? <EmptyRows /> : null}
              {!ordersQuery.isLoading
                ? orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/orders/${encodeURIComponent(order.orderId)}`}
                          className="hover:text-primary"
                        >
                          {order.orderId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-44 truncate font-medium">{order.clientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(order.totalValue)}
                        </div>
                      </TableCell>
                      {!compact ? (
                        <TableCell>
                          <div className="max-w-48 truncate">{order.clientEmail ?? "-"}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.clientDocument ?? "-"}
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.vtexStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.pagarmeStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getInvoiceStatus(order)} />
                      </TableCell>
                      {!compact ? <TableCell>{order.invoiceNumber ?? "-"}</TableCell> : null}
                      {!compact ? <TableCell>{order.carrierName ?? "-"}</TableCell> : null}
                      <TableCell>
                        <TrackingCell order={order} />
                      </TableCell>
                      <TableCell>{getHoursSince(order.createdAt)}h</TableCell>
                      <TableCell>
                        {order.has48hInvoiceAlert ? (
                          <Badge variant="destructive">+48h sem faturamento</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {!compact ? (
                        <TableCell>{formatDateTime(order.lastSyncedAt)}</TableCell>
                      ) : null}
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Ver detalhes">
                            <Link href={`/orders/${encodeURIComponent(order.orderId)}`}>
                              <Eye />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Consultar pagamento"
                            onClick={() => resyncMutation.mutate(order.orderId)}
                            disabled={resyncMutation.isPending}
                          >
                            {resyncMutation.isPending ? (
                              <RefreshCcw className="animate-spin" />
                            ) : (
                              <CreditCard />
                            )}
                          </Button>
                          {order.trackingUrl ? (
                            <Button asChild variant="ghost" size="icon" title="Abrir rastreio">
                              <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                                <ExternalLink />
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total} pedidos · pagina {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
            disabled={page <= 1 || ordersQuery.isFetching}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
            disabled={page >= totalPages || ordersQuery.isFetching}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}
