-- AlterTable
ALTER TABLE "TicketMessage" ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_readAt_isInternal_idx" ON "TicketMessage"("ticketId", "readAt", "isInternal");
