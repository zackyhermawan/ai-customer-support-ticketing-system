-- CreateTable
CREATE TABLE "TicketMessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketMessageRead_userId_readAt_idx" ON "TicketMessageRead"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketMessageRead_messageId_userId_key" ON "TicketMessageRead"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "TicketMessageRead" ADD CONSTRAINT "TicketMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessageRead" ADD CONSTRAINT "TicketMessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
