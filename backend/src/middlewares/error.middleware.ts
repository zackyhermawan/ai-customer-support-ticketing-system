import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../lib/app-error.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validasi gagal",
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message
        });
        return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        res.status(409).json({
            success: false,
            message: "Email sudah terdaftar"
        });
        return;
    }

    console.error(error);

    res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server"
    });
};
