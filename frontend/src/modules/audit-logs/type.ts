export interface AuditLogActor {
    id: string;
    name: string;
    email?: string;
    role?: string;
}

export interface AuditLogTicket {
    id: string;
    ticketNumber: string;
    subject: string;
}

export interface AuditLog {
    id: string;
    actorId: string;
    ticketId: string | null;
    action: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    actor: AuditLogActor | null;
    ticket: AuditLogTicket | null;
}

export interface AuditLogFilters {
    action?: string;
    ticketId?: string;
    actorId?: string;
    page?: number;
    limit?: number;
}

export interface AuditLogPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface AuditLogResponse {
    success: boolean;
    message: string;
    data: {
        items: AuditLog[];
        pagination: AuditLogPagination;
    };
}