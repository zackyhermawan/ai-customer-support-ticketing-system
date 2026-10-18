import type { RequestHandler } from "express";
import { authService } from "./auth.service.js";
import {loginSchema, registerSchema} from "./auth.validation.js";
import { success } from "../../utils/response.js";

export const register: RequestHandler = async (req, res, next) => {
    try {
        const input = registerSchema.parse(req.body);
        const result = await authService.register(input);

        return success(res, result, "Registrasi berhasil", 201)
    } catch (error) {
        next(error);
    }
};

export const login: RequestHandler = async (req, res, next) => {
    try {
        const input = loginSchema.parse(req.body);
        const result = await authService.login(input);

        return success(res, result, "Login berhasil", 200)
    } catch (error) {
        next(error);
    }
};

export const me: RequestHandler = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user!.id);

        return success(res, user, "Berhasil mengambil data", 201)
    } catch (error) {
        next(error);
    }
};
