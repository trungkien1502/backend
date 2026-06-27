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
    reviews: {
        select: {
            id: true,
            rating: true,
            content: true,
            spoiler: true,
            status: true,
            createdAt: true,
            updatedAt: true
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
        : null,
    review: booking.reviews?.[0]
        ? {
            ...booking.reviews[0]
        }
        : null,
    reviewed: Boolean(booking.reviews?.length),
    canReview:
        booking.status === "CONFIRMED"
        && new Date(booking.showtime.endTime) <= new Date()
        && !booking.reviews?.length,
    reviewAvailableAt: booking.showtime.endTime
});

const normalizeSeatIds = (seatIds) => {
    if (!Array.isArray(seatIds)) {
        return [];
    }

    return [...new Set(
        seatIds
            .map((seatId) => Number(seatId))
            .filter((seatId) => Number.isInteger(seatId) && seatId > 0)
    )].sort((a, b) => a - b);
};

const parsePositiveInt = (value, label) => {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid ${label}`);
    }

    return parsed;
};

exports.createBooking = async ({ userId, showtimeId, seatIds }) => {
    return await prisma.$transaction(async (tx) => {

        if (!userId || !showtimeId || !seatIds?.length) {
            throw new Error("Invalid input");
        }

        const now = new Date();

        // lấy ghế hợp lệ (lọc luôn)
        const seats = await tx.showtimeSeat.findMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds },
                status: "HOLD",
                heldBy: Number(userId),
                holdUntil: { gt: now }
            }
        });

        // nếu thiếu ghế , fail luôn
        if (seats.length !== seatIds.length) {
            throw new Error("Some seats are invalid or expired");
        }

        // lấy giá
        const showtime = await tx.showtime.findUnique({
            where: { id: Number(showtimeId) },
            select: { price: true }
        });

        if (!showtime) throw new Error("Showtime not found");

        const totalPrice = Number(showtime.price) * seats.length;

        // tạo booking
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

exports.createManualPaidBooking = async ({ userId, showtimeId, seatIds }) => {
    const parsedUserId = parsePositiveInt(userId, "userId");
    const parsedShowtimeId = parsePositiveInt(showtimeId, "showtimeId");
    const parsedSeatIds = normalizeSeatIds(seatIds);

    if (!parsedSeatIds.length) {
        throw new Error("seatIds are required");
    }

    const now = new Date();
    const holdUntil = new Date(now.getTime() + 5 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: parsedUserId },
            select: { id: true }
        });

        if (!user) {
            throw new Error("User not found");
        }

        const showtime = await tx.showtime.findUnique({
            where: { id: parsedShowtimeId },
            select: {
                id: true,
                price: true
            }
        });

        if (!showtime) {
            throw new Error("Showtime not found");
        }

        const showtimeSeats = await tx.showtimeSeat.findMany({
            where: {
                showtimeId: parsedShowtimeId,
                seatId: { in: parsedSeatIds }
            },
            select: {
                id: true,
                seatId: true,
                status: true,
                holdUntil: true,
                heldBy: true
            }
        });

        if (showtimeSeats.length !== parsedSeatIds.length) {
            const foundSeatIds = new Set(showtimeSeats.map((seat) => seat.seatId));
            const missingSeatIds = parsedSeatIds.filter((seatId) => !foundSeatIds.has(seatId));
            throw new Error(`Missing showtime seats: ${missingSeatIds.join(", ")}`);
        }

        const unavailableSeats = showtimeSeats.filter((seat) => seat.status === "BOOKED");
        if (unavailableSeats.length) {
            throw new Error(`Some seats are already booked: ${unavailableSeats.map((seat) => seat.seatId).join(", ")}`);
        }

        const holdResult = await tx.showtimeSeat.updateMany({
            where: {
                showtimeId: parsedShowtimeId,
                seatId: { in: parsedSeatIds },
                OR: [
                    { status: "AVAILABLE" },
                    { status: "HOLD", heldBy: parsedUserId },
                    { status: "HOLD", holdUntil: { lt: now } }
                ]
            },
            data: {
                status: "HOLD",
                holdUntil,
                heldBy: parsedUserId
            }
        });

        if (holdResult.count !== parsedSeatIds.length) {
            throw new Error("Some seats cannot be held");
        }

        const totalPrice = Number(showtime.price) * parsedSeatIds.length;

        const booking = await tx.booking.create({
            data: {
                userId: parsedUserId,
                showtimeId: parsedShowtimeId,
                totalPrice,
                status: "CONFIRMED"
            },
            select: bookingSelect
        });

        await tx.bookingSeat.createMany({
            data: showtimeSeats.map((seat) => ({
                bookingId: booking.id,
                showtimeSeatId: seat.id
            }))
        });

        const bookedResult = await tx.showtimeSeat.updateMany({
            where: {
                id: { in: showtimeSeats.map((seat) => seat.id) },
                OR: [
                    { status: "HOLD", heldBy: parsedUserId },
                    { status: "HOLD", holdUntil: { gte: now } }
                ]
            },
            data: {
                status: "BOOKED",
                holdUntil: null,
                heldBy: null
            }
        });

        if (bookedResult.count !== parsedSeatIds.length) {
            throw new Error("Failed to confirm all seats");
        }

        const orderId = `MANUAL_BOOKING_${booking.id}`;
        const requestId = `${orderId}_${Date.now()}`;

        const payment = await tx.payment.create({
            data: {
                bookingId: booking.id,
                provider: "MANUAL",
                amount: totalPrice,
                currency: "VND",
                status: "PAID",
                orderId,
                requestId,
                transId: `MANUAL_${booking.id}`,
                rawResponse: {
                    source: "manualPaidBooking",
                    createdAt: now.toISOString()
                }
            }
        });

        const fullBooking = await tx.booking.findUnique({
            where: { id: booking.id },
            select: bookingSelect
        });

        return {
            booking: mapBooking(fullBooking),
            payment: {
                id: payment.id,
                provider: payment.provider,
                status: payment.status,
                orderId: payment.orderId,
                requestId: payment.requestId,
                amount: Number(payment.amount)
            },
            holdUntil
        };
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
    const booking = await prisma.booking.findUnique({
        where: { id: Number(id) },
        select: bookingSelect
    });

    if (!booking) return null;

    return mapBooking(booking);
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
