import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/app-error.js";

export const authenticate: RequestHandler = (req, _res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        return next(new AppError(401, "Authentication required"));
    }

    const token = authorization.slice(7);

    try {
        const payload = jwt.verify(token, env.JWT_SECRET, {
            issuer: "ai-customer-support"
        });

        if (typeof payload === "string" || !payload.sub || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")) {
            return next(new AppError(401, "Akses token tidak valid"));
        }

        req.user = {
            id: payload.sub,
            role: payload.role
        };

        next();
    } catch {
        next(new AppError(401, "Akses token kadaluarsa atau tidak valid"));
    }
};

export function authorize(...roles: Array<"CUSTOMER" | "ADMIN">): RequestHandler {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(403, "Izin tidak mencukupi"));
        }

        next();
    };
}
