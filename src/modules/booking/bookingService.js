const prisma = require("../../config/prisma");

exports.createBooking = async ({ userId, showtimeId, seatIds }) => {
    return await prisma.$transaction(async (tx) => {

        if (!userId || !showtimeId || !seatIds?.length) {
            throw new Error("Invalid input");
        }

        const now = new Date();

        // 1. lấy ghế hợp lệ (lọc luôn)
        const seats = await tx.showtimeSeat.findMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds },
                status: "HOLD",
                heldBy: userId,
                holdUntil: { gt: now }
            }
        });

        // ❗ nếu thiếu ghế → fail luôn
        if (seats.length !== seatIds.length) {
            throw new Error("Some seats are invalid or expired");
        }

        // 2. lấy giá
        const showtime = await tx.showtime.findUnique({
            where: { id: Number(showtimeId) },
            select: { price: true }
        });

        if (!showtime) throw new Error("Showtime not found");

        const totalPrice = Number(showtime.price) * seats.length;

        // 3. tạo booking
        const booking = await tx.booking.create({
            data: {
                userId: Number(userId),
                showtimeId: Number(showtimeId),
                totalPrice,
                status: "CONFIRMED"
            }
        });

        // 4. tạo bookingSeat
        await tx.bookingSeat.createMany({
            data: seats.map(seat => ({
                bookingId: booking.id,
                showtimeSeatId: seat.id
            }))
        });

        // 5. update ghế → BOOKED (atomic)
        const result = await tx.showtimeSeat.updateMany({
            where: {
                id: { in: seats.map(s => s.id) },
                status: "HOLD",
                heldBy: userId
            },
            data: {
                status: "BOOKED",
                holdUntil: null,
                heldBy: null
            }
        });

        if (result.count !== seats.length) {
            throw new Error("Race condition: seats changed");
        }

        return booking;
    });
};
exports.getBookingById = async (id) => {
    const booking = await prisma.booking.findUnique({
        where: { id: Number(id) },
        include: {
            showtime: true,
            bookingSeats: {
                include: {
                    showtimeSeat: {
                        include: {
                            seat: true
                        }
                    }
                }
            }
        }
    });

    if (!booking) throw new Error("Not found");

    return booking;
};
exports.cancelBooking = async (id) => {
    return await prisma.$transaction(async (tx) => {

        const booking = await tx.booking.findUnique({
            where: { id: Number(id) },
            include: { bookingSeats: true }
        });

        if (!booking) throw new Error("Booking not found");

        if (booking.status === "CANCELLED") {
            throw new Error("Booking already cancelled");
        }

        // 1. update booking
        await tx.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED" }
        });

        // 2. release ghế
        const seatIds = booking.bookingSeats.map(b => b.showtimeSeatId);

        await tx.showtimeSeat.updateMany({
            where: {
                id: { in: seatIds },
                status: "BOOKED" // 🔥 chỉ trả ghế đã book
            },
            data: {
                status: "AVAILABLE",
                holdUntil: null,
                heldBy: null
            }
        });

        return true;
    });
};
exports.getBoookingsByUser = async (userId) => {
    const bookings = await prisma.booking.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            showtime: {
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    price: true,
                    movie: {
                        select: {
                            title: true,
                            poster: true
                        }
                    }
                }
            },
            bookingSeats: {
                select: {
                    showtimeSeat: {
                        select: {
                            seat: {
                                select: {
                                    seatNumber: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    return bookings.map(b => ({
        ...b,
        seats: b.bookingSeats.map(bs => bs.showtimeSeat.seat.seatNumber)
    }));
};