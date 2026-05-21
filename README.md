# sac-vtex-monitor-dashboard

Dashboard web para o time de SAC acompanhar pedidos VTEX, cruzar status de pagamento da Pagar.me, visualizar rastreios e priorizar alertas operacionais de pedidos com mais de 48 horas sem faturamento.

## Stack

- Next.js com TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Prisma ORM
- PostgreSQL
- Docker Compose
- ESLint + Prettier

## Funcionalidades

- Dashboard com indicadores de pedidos, faturamento, pagamentos, cancelamentos, rastreios e erros.
- Tabela de pedidos com busca, filtros por status, periodo, alertas, rastreio ausente e erro.
- Service VTEX para OMS, status, invoice e rastreio.
- Service Pagar.me para pedido/charge, status, motivo de recusa e estados de pagamento.
- Regra `isOrderOver48hWithoutInvoice(order)` para alertas de +48h sem faturamento.
- Tela "Alertas SAC" com motivo provavel e acao recomendada.
- Modal `TrackingModal.tsx` para consultar rastreio dentro do dashboard.
- Pagina `/orders/[orderId]` com resumo, cliente, itens, pagamento, entrega, invoice, timeline, alertas e JSON tecnico recolhivel.
- APIs para sync, pedidos, detalhes, alertas, rastreio, logs e resync.
- Modo mock com `USE_MOCK_DATA=true`.

## Instalação

```bash
cd sac-vtex-monitor-dashboard
npm install
```

Configure o ambiente:

```bash
cp .env.example .env.local
```

Para rodar sem credenciais reais:

```env
USE_MOCK_DATA=true
```

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://sac_user:sac_password@localhost:5432/sac_vtex_monitor?schema=public
USE_MOCK_DATA=true
APP_BASE_URL=http://localhost:3000
API_TIMEOUT_MS=15000
SYNC_DEFAULT_DAYS=7

VTEX_ACCOUNT=
VTEX_ENVIRONMENT=vtexcommercestable
VTEX_APP_KEY=
VTEX_APP_TOKEN=

PAGARME_API_KEY=
```

Nunca commite `.env`, `.env.local`, appKey, appToken, API keys ou qualquer segredo.

## Banco local

```bash
docker compose up -d
npm run prisma:generate
npm run prisma:migrate -- --name init
```

Adminer fica disponivel em:

```text
http://localhost:8080
```

## Rodando o dashboard

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

Com `USE_MOCK_DATA=true`, o dashboard carrega pedidos ficticios com:

- 3 pedidos com alerta de +48h sem faturamento
- pagamentos pendentes
- pedido faturado
- pedido cancelado
- pedidos com e sem rastreio
- erro de integracao

## Sincronização

Sincronizar por periodo:

```bash
curl -X POST http://localhost:3000/api/sync/orders \
  -H "Content-Type: application/json" \
  -d "{\"dateFrom\":\"2026-05-01T00:00:00.000Z\",\"dateTo\":\"2026-05-21T23:59:59.999Z\"}"
```

Ressincronizar um pedido:

```bash
curl -X POST http://localhost:3000/api/orders/VTEX-1001/resync
```

Consultar APIs:

```bash
curl http://localhost:3000/api/orders
curl http://localhost:3000/api/orders/VTEX-1001
curl http://localhost:3000/api/alerts
curl http://localhost:3000/api/tracking/VTEX-1004
curl http://localhost:3000/api/logs
```

## Integrações

### VTEX

Service: `src/services/vtexService.ts`

Funções principais:

- `fetchOrderById(orderId)`
- `listOrdersByPeriod(dateFrom, dateTo)`
- `getOrderStatus(orderId)`
- `getInvoiceData(orderId)`
- `getTrackingInfo(orderId)`
- `isCriticalVtexStatus(status)`

Endpoint base:

```text
https://{account}.{environment}.com.br/api/oms/pvt/orders/{orderId}
```

### Pagar.me

Service: `src/services/pagarmeService.ts`

Funções principais:

- `findPaymentByOrderId(orderId)`
- `getPaymentStatus(orderId)`
- `getChargeData(orderId)`
- `isPaymentApproved(status)`
- `isPaymentPending(status)`
- `isPaymentRefused(status)`
- `isPaymentCanceled(status)`
- `isPaymentRefunded(status)`

## Tratamento de erros

A camada de services normaliza falhas em:

- `API_UNAVAILABLE`
- `INVALID_TOKEN`
- `TIMEOUT`
- `ORDER_NOT_FOUND`
- `CONFIGURATION_ERROR`
- `UNKNOWN_ERROR`

As rotas API retornam mensagens claras e status HTTP adequado.

## Estrutura

```text
src/
  app/
    api/
    orders/
    alerts/
    payments/
    tracking/
    logs/
    settings/
  components/
    dashboard/
    layout/
    orders/
    tracking/
    ui/
  config/
  hooks/
  lib/
  server/repositories/
  services/
  types/
prisma/
docker-compose.yml
```

## Qualidade

```bash
npm run lint
npm run format:check
npm run build
```

## Publicando no GitHub

```bash
git init
git add .
git commit -m "Initial SAC VTEX monitor dashboard"
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/sac-vtex-monitor-dashboard.git
git push -u origin main
```

Antes do push, confirme:

- `.env.local` nao aparece em `git status`
- `node_modules/` nao foi adicionado
- nenhum token VTEX/Pagar.me entrou no historico

## Deploy futuro

Para Vercel ou similar:

- Configure `DATABASE_URL` com PostgreSQL gerenciado.
- Rode `prisma migrate deploy` no pipeline.
- Cadastre `VTEX_ACCOUNT`, `VTEX_ENVIRONMENT`, `VTEX_APP_KEY`, `VTEX_APP_TOKEN` e `PAGARME_API_KEY` como secrets.
- Mantenha `USE_MOCK_DATA=false` em producao.
- Considere agendar `POST /api/sync/orders` via cron seguro.
