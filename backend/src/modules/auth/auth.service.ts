import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository.js";
import { AppError } from "../../lib/app-error.js";
import { env } from "../../config/env.js";
import type {LoginInput, RegisterInput} from "./auth.validation.js";

function createAccessToken(user: {
  id: string;
  role: "CUSTOMER" | "ADMIN";
}) {
    return jwt.sign(
        { role: user.role },
        env.JWT_SECRET,
        {
            subject: user.id,
            expiresIn: "7d",
            issuer: "ai-customer-support"
        }
    );
}

export const authService = {
    async register(input: RegisterInput) {
        const email = input.email.toLowerCase();

        const existingUser = await authRepository.findByEmail(email);

        if (existingUser) {
            throw new AppError(409, "Email sudah dipakai");
        }

        const passwordHash = await bcrypt.hash(input.password, 12);

        const user = await authRepository.create({
            name: input.name,
            email,
            passwordHash,
            role: "CUSTOMER",
            isActive: true
        });

        return {
            user,
            accessToken: createAccessToken(user)
        };
    },

    async login(input: LoginInput) {
        const email = input.email.toLowerCase();
        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new AppError(404, "Pengguna tidak ditemukan");
        }

        if (!user.isActive) {
            throw new AppError(403, "Akun tidak aktif");
        }

        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash)

        if (!isPasswordValid) {
            throw new AppError(400, "Kata sandi salah")
        }

        const { passwordHash: _, ...safeUser } = user;

        return {
            user: safeUser,
            accessToken: createAccessToken(user)
        };
    },

    async getProfile(userId: string) {
        const user = await authRepository.findById(userId);

        if (!user || !user.isActive) {
        throw new AppError(401, "User not found or inactive");
        }

        const { passwordHash: _, ...safeUser } = user;

        return safeUser;
    }
};
