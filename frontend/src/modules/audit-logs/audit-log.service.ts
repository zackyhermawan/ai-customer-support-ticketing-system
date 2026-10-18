import { api } from "@/lib/api";
import type { AuditLogFilters, AuditLogResponse } from "./type";

export const auditLogService = {
    async getLogs(filters: AuditLogFilters = {}) {
        const response = await api.get<AuditLogResponse>("/audit-logs", {params: filters});

        return response.data.data;
    },
};