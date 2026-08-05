import { prisma } from "./prisma.js";
async function main() {
    console.log("Connecting to Render PostgreSQL database...");
    try {
        const usersCount = await prisma.user.count();
        console.log(`Connection successful! Users count in DB: ${usersCount}`);
        // Create a dummy user to verify writes
        const testEmail = `test-${Date.now()}@example.com`;
        const tempUser = await prisma.user.create({
            data: {
                name: "Test Connection User",
                email: testEmail,
                password: "password123",
                role: "USER",
            },
        });
        console.log("Write check passed! Created temporary user:", tempUser);
        // Delete the dummy user
        await prisma.user.delete({ where: { id: tempUser.id } });
        console.log("Clean-up check passed! Temporary user removed.");
    }
    catch (error) {
        console.error("Database connection/write failed:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-db.js.map