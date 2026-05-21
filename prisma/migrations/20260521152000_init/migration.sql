CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "vtexStatus" TEXT NOT NULL,
    "pagarmeStatus" TEXT,
    "invoiceNumber" TEXT,
    "invoiceKey" TEXT,
    "invoicedAt" TIMESTAMP(3),
    "carrierName" TEXT,
    "trackingCode" TEXT,
    "trackingUrl" TEXT,
    "totalValue" DECIMAL(12,2),
    "has48hInvoiceAlert" BOOLEAN NOT NULL DEFAULT false,
    "items" JSONB,
    "timeline" JSONB,
    "rawVtexJson" JSONB,
    "rawPagarmeJson" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentStatus" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'pagarme',
    "status" TEXT NOT NULL,
    "chargeId" TEXT,
    "transactionId" TEXT,
    "refusalReason" TEXT,
    "amount" DECIMAL(12,2),
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentStatus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrackingInfo" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carrierName" TEXT,
    "trackingCode" TEXT,
    "trackingUrl" TEXT,
    "lastStatus" TEXT,
    "lastUpdatedAt" TIMESTAMP(3),
    "history" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingInfo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderAlert" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "probableReason" TEXT,
    "recommendedAction" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "requestId" TEXT,
    "errorCode" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_vtexStatus_idx" ON "Order"("vtexStatus");
CREATE INDEX "Order_pagarmeStatus_idx" ON "Order"("pagarmeStatus");
CREATE INDEX "Order_has48hInvoiceAlert_idx" ON "Order"("has48hInvoiceAlert");
CREATE INDEX "PaymentStatus_status_idx" ON "PaymentStatus"("status");
CREATE INDEX "OrderAlert_type_idx" ON "OrderAlert"("type");
CREATE INDEX "OrderAlert_severity_idx" ON "OrderAlert"("severity");
CREATE INDEX "OrderAlert_resolvedAt_idx" ON "OrderAlert"("resolvedAt");
CREATE INDEX "IntegrationLog_provider_idx" ON "IntegrationLog"("provider");
CREATE INDEX "IntegrationLog_status_idx" ON "IntegrationLog"("status");
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

ALTER TABLE "PaymentStatus" ADD CONSTRAINT "PaymentStatus_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrackingInfo" ADD CONSTRAINT "TrackingInfo_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderAlert" ADD CONSTRAINT "OrderAlert_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
