import { defineStore } from "pinia";
import { authService } from "./auth.service";
import type { AuthUser, LoginCredentials } from "./type";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: null as AuthUser | null,
        isLoading: false,
        isInitialized: false,
    }),

    getters: {
        isAuthenticated: (state) => Boolean(state.user),
        isAdmin: (state) => state.user?.role === "ADMIN",
    },

    actions: {
        async login(credentials: LoginCredentials) {
            this.isLoading = true;

            try {
                const result = await authService.login(credentials);

                localStorage.setItem("accessToken", result.accessToken);
                localStorage.setItem("authUser", JSON.stringify(result.user));

                this.user = result.user;
                this.isInitialized = true;

                return result.user;
            } finally {
                this.isLoading = false;
            }
        },

        async initialize() {
            if (this.isInitialized) return;

            const token = localStorage.getItem("accessToken");

            if (!token) {
                this.user = null;
                this.isInitialized = true;
                return;
            }

            try {
                this.user = await authService.getProfile();
                localStorage.setItem("authUser", JSON.stringify(this.user));
            } catch {
                this.clearAuth();
            } finally {
                this.isInitialized = true;
            }
        },

        clearAuth() {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("authUser");

            this.user = null;
            this.isInitialized = true;
        },

        logout() {
            this.clearAuth();
        },
    },
});