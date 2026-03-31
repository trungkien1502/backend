const cron = require("node-cron");
const prisma = require("../src/config/prisma");

//  mỗi 1 phút
cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();

        const result = await prisma.showtimeSeat.updateMany({
            where: {
                status: "HOLD",
                holdUntil: {
                    lt: now
                }
            },
            data: {
                status: "AVAILABLE",
                holdUntil: null,
                heldBy: null
            }
        });

        if (result.count > 0) {
            console.log(`Cleared ${result.count} expired seats`);
        }

    } catch (error) {
        console.error(" Cron error:", error.message);
    }
});