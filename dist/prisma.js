import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}
const adapter = new PrismaPg({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false, // Render DB uses SSL, accept self-signed certificates if needed
    },
});
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
//# sourceMappingURL=prisma.js.map