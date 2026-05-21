"use client";

import { StatusBadge } from "@/components/orders/StatusBadge";
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
import { useLogs } from "@/hooks/useOrders";
import { formatDateTime } from "@/lib/order-utils";

export function LogsClient() {
  const logsQuery = useLogs();
  const logs = logsQuery.data?.logs ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Eventos recentes de sincronizacao e integracoes.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logsQuery.isError ? (
            <div className="p-4">
              <ErrorState
                title="Logs indisponiveis"
                message={logsQuery.error.message}
                onRetry={() => void logsQuery.refetch()}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Acao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsQuery.isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={8}>
                          <Skeleton className="h-9 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
                {!logsQuery.isLoading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Nenhum log encontrado.
                    </TableCell>
                  </TableRow>
                ) : null}
                {!logsQuery.isLoading
                  ? logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell>{log.provider}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={log.status === "success" ? "approved" : log.status}
                          />
                        </TableCell>
                        <TableCell>{log.orderId ?? "-"}</TableCell>
                        <TableCell className="max-w-xl">{log.message}</TableCell>
                        <TableCell>{log.durationMs ? `${log.durationMs}ms` : "-"}</TableCell>
                        <TableCell>{log.errorCode ?? "-"}</TableCell>
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
