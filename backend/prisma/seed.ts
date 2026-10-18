import { PrismaClient } from "../src/generated/prisma/client.js"; 
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL
});

export const prisma = new PrismaClient({
  adapter
});

async function main() {
    const email = "admin@gmail.com";
    const plainPassword = "admin123456"; 

    const existingAdmin = await prisma.user.findUnique({
        where: { email },
    });

    if (existingAdmin) {
        console.log("Akun Admin sudah ada di database, proses seed dilewati.");
        return;
    }

    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const admin = await prisma.user.create({
        data: {
            name: "Super Admin",
            email: email,
            passwordHash: passwordHash,
            role: "ADMIN",
            isActive: true,
        },
    });
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });