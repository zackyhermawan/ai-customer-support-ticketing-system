import { prisma } from "../../lib/prisma.js";
import type { UserRole } from "../../generated/prisma/client.js";

export const authRepository = {
    findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email }
        });
    },

    findById(id: string) {
        return prisma.user.findUnique({
            where: { id }
        });
    },

    create(data: {
        name: string;
        email: string;
        passwordHash: string;
        role: UserRole;
        isActive: boolean
    }) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });
    }
};
