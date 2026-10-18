import type { ApiResponse } from "@/types/type";
import { api } from "../../lib/api";
import type { AuthPayload, AuthUser, LoginCredentials, RegisterCredentials } from "./type";

export const authService = {
    async login(credentials: LoginCredentials) {
        const response = await api.post<ApiResponse<AuthPayload>>("/auth/login", credentials);

        return response.data.data;
    },

    async register(credentials: RegisterCredentials) {
        const response = await api.post<ApiResponse<AuthPayload>>("/auth/register", credentials);

        return response.data.data;
    },

    async getProfile() {
        const response = await api.get<ApiResponse<AuthUser>>("/auth/me");

        return response.data.data;
    },
};