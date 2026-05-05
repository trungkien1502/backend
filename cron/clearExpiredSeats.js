const cron = require("node-cron");
const prisma = require("../src/config/prisma");

//  mỗi 1 phút
cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();

        const expiredSeats = await prisma.showtimeSeat.findMany({
            where: {
                status: "HOLD",
                holdUntil: {
                    lt: now
                }
            },
            select: {
                id: true,
                bookingSeats: {
                    where: {
                        booking: {
                            status: "PENDING"
                        }
                    },
                    select: {
                        bookingId: true
                    }
                }
            }
        });

        if (!expiredSeats.length) return;

        const expiredSeatIds = expiredSeats.map((seat) => seat.id);
        const pendingBookingIds = [
            ...new Set(expiredSeats.flatMap((seat) => seat.bookingSeats.map((bookingSeat) => bookingSeat.bookingId)))
        ];

        await prisma.$transaction(async (tx) => {
            if (pendingBookingIds.length) {
                await tx.payment.updateMany({
                    where: {
                        bookingId: { in: pendingBookingIds },
                        status: "PENDING"
                    },
                    data: {
                        status: "CANCELLED"
                    }
                });

                await tx.booking.updateMany({
                    where: {
                        id: { in: pendingBookingIds },
                        status: "PENDING"
                    },
                    data: {
                        status: "CANCELLED"
                    }
                });
            }

            await tx.showtimeSeat.updateMany({
                where: {
                    id: { in: expiredSeatIds },
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
        });

        if (expiredSeatIds.length > 0) {
            console.log(`Cleared ${expiredSeatIds.length} expired seats and cancelled ${pendingBookingIds.length} pending bookings`);
        }

    } catch (error) {
        console.error(" Cron error:", error.message);
    }
});
