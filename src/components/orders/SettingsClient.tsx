import { CheckCircle2, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const requiredEnv = [
  "DATABASE_URL",
  "USE_MOCK_DATA",
  "VTEX_ACCOUNT",
  "VTEX_ENVIRONMENT",
  "VTEX_APP_KEY",
  "VTEX_APP_TOKEN",
  "PAGARME_API_KEY",
];

export function SettingsClient() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Configuracoes</h1>
        <p className="text-sm text-muted-foreground">
          Variaveis esperadas e cuidados de seguranca.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ambiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredEnv.map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-mono text-sm">{item}</span>
                <Badge
                  variant={item.includes("TOKEN") || item.includes("KEY") ? "warning" : "secondary"}
                >
                  {item.includes("TOKEN") || item.includes("KEY") ? "segredo" : "config"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguranca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3 rounded-lg border p-3">
              <ShieldAlert className="mt-0.5 size-4 text-amber-700" />
              <div>
                <p className="font-medium">Tokens ficam fora do Git</p>
                <p className="text-muted-foreground">
                  Use `.env.local` para credenciais reais e mantenha `.env.example` sem segredos.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border p-3">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-700" />
              <div>
                <p className="font-medium">Mock mode habilitado por variavel</p>
                <p className="text-muted-foreground">
                  `USE_MOCK_DATA=true` carrega pedidos ficticios sem tocar nas APIs externas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
