const prisma = require("../../config/prisma");

const bookingSelect = {
    id: true,
    totalPrice: true,
    status: true,
    createdAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true
        }
    },
    showtime: {
        select: {
            startTime: true,
            endTime: true,
            movie: {
                select: {
                    id: true,
                    title: true,
                    poster: true
                }
            },
            room: {
                select: {
                    id: true,
                    name: true,
                    cinema: {
                        select: {
                            id: true,
                            name: true,
                            location: true
                        }
                    }
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
    },
    payment: {
        select: {
            id: true,
            provider: true,
            amount: true,
            currency: true,
            status: true,
            orderId: true,
            transId: true,
            createdAt: true,
            updatedAt: true
        }
    }
};

const mapBooking = (booking) => ({
    id: booking.id,
    totalPrice: Number(booking.totalPrice),
    status: booking.status,
    createdAt: booking.createdAt,
    user: booking.user || null,
    movie: booking.showtime.movie,
    cinema: booking.showtime.room.cinema,
    room: {
        id: booking.showtime.room.id,
        name: booking.showtime.room.name
    },
    showtime: {
        startTime: booking.showtime.startTime,
        endTime: booking.showtime.endTime
    },
    seats: booking.bookingSeats.map((bookingSeat) => bookingSeat.showtimeSeat.seat.seatNumber),
    payment: booking.payment
        ? {
            ...booking.payment,
            amount: Number(booking.payment.amount)
        }
        : null
});

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
                heldBy: Number(userId),
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

exports.getAllBookings = async ({ status, search } = {}) => {
    const bookings = await prisma.booking.findMany({
        where: {
            ...(status && {
                status
            }),
            ...(search && {
                OR: [
                    {
                        user: {
                            name: {
                                contains: search
                            }
                        }
                    },
                    {
                        user: {
                            email: {
                                contains: search
                            }
                        }
                    },
                    {
                        showtime: {
                            movie: {
                                title: {
                                    contains: search
                                }
                            }
                        }
                    }
                ]
            })
        },
        orderBy: { createdAt: "desc" },
        select: bookingSelect
    });

    return bookings.map(mapBooking);
};

exports.getBookingById = async (id) => {
    const bookings = await prisma.booking.findMany({
        where: { id: Number(id) },
        orderBy: { createdAt: "desc" },
        select: bookingSelect
    });


    return bookings.map(mapBooking);
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

        await tx.payment.updateMany({
            where: {
                bookingId: booking.id,
                status: "PENDING"
            },
            data: { status: "CANCELLED" }
        });

        // 2. release ghế
        const seatIds = booking.bookingSeats.map(b => b.showtimeSeatId);

        await tx.showtimeSeat.updateMany({
            where: {
                id: { in: seatIds },
                OR: [
                    { status: "BOOKED" },
                    {
                        status: "HOLD",
                        heldBy: booking.userId
                    }
                ]
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
exports.getBookingsByUser = async (userId) => {
    const bookings = await prisma.booking.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" },
        select: bookingSelect
    });


    return bookings.map(mapBooking);
};
