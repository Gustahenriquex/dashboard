import { Badge, type BadgeProps } from "@/components/ui/badge";
import { getStatusTone } from "@/lib/order-utils";

const labels: Record<string, string> = {
  "payment-pending": "Pagamento pendente",
  "ready-for-handling": "Pronto p/ manuseio",
  handling: "Em manuseio",
  invoice: "Em faturamento",
  invoiced: "Faturado",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  "awaiting-seller-change": "Aguardando seller",
  "integration-error": "Erro integracao",
  approved: "Pago",
  pending: "Pendente",
  refused: "Recusado",
  refunded: "Estornado",
  processing: "Processando",
  "not-found": "Nao encontrado",
  error: "Erro",
  faturado: "Faturado",
  aguardando: "Aguardando",
  cancelado: "Cancelado",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const variant = getStatusTone(status) as BadgeProps["variant"];
  const normalized = status?.toLowerCase() ?? "sem-status";

  return <Badge variant={variant}>{labels[normalized] ?? status ?? "Sem status"}</Badge>;
}
