import { auditLogRepository } from "./audit-log.repository.js";
import type { AuditLogQuery } from "./audit-log.validation.js";

export const auditLogService = {
    async findAll(query: AuditLogQuery) {
        const [items, total] = await auditLogRepository.findAll(query);

        return {
            items,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    },
};
