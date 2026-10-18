export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketCategory = "SHIPPING" | "PAYMENT" | "ACCOUNT" | "TECHNICAL" | "PRODUCT" | "OTHER";

export interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: TicketCategory;
    customerId: string;
    assignedToId: string | null;
    resolvedAt: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    customer: { id: string; name: string; email: string };
    assignedTo: { id: string; name: string; email: string } | null;
    unreadCount: number;
}

export interface TicketFilters {
    page: number;
    limit: number;
    search?: string;
    status?: TicketStatus | "";
    priority?: TicketPriority | "";
    category?: TicketCategory | "";
}

export interface TicketMessage {
  id: string;
  ticketId: string
  body: string;
  isInternal: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: "CUSTOMER" | "ADMIN" };
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
  newMessagesStartId?: string | null;
}

export interface TicketAnalysis {
    id: string;
    tickerNumber: string;
    subject: string;
}

export interface TicketAIAnalysis {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  sentiment: string | null;
  suggestedPriority: TicketPriority | null;
  suggestedCategory: TicketCategory | null;
  summary: string | null;
  reason: string | null;
  confidence: number | null;
  provider: string | null;
  model: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AIReplyDraft {
  id: string;
  content: string;
  status: "DRAFT" | "SENT" | "DISCARDED";
  provider: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  generatedBy: { id: string; name: string } | null;
}


export interface CustomerTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerId: string;
  assignedToId: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

export interface CustomerTicketFilters {
  page: number;
  limit: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface CreateCustomerTicketPayload {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority
}
