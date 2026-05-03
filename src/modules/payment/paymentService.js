const axios = require("axios");
const crypto = require("crypto");
const prisma = require("../../config/prisma");

const MOMO_CREATE_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";
const PAYMENT_HOLD_MINUTES = Number(process.env.PAYMENT_HOLD_MINUTES || 10);

const normalizeNumberArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map(Number).filter(Number.isInteger);
};

const signRaw = (raw, secretKey) => {
    return crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
};

const getMomoConfig = () => {
    const config = {
        endpoint: process.env.MOMO_ENDPOINT || MOMO_CREATE_ENDPOINT,
        partnerCode: process.env.MOMO_PARTNER_CODE,
        accessKey: process.env.MOMO_ACCESS_KEY,
        secretKey: process.env.MOMO_SECRET_KEY,
        redirectUrl: process.env.MOMO_REDIRECT_URL,
        ipnUrl: process.env.MOMO_IPN_URL
    };

    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length) {
        throw new Error(`Missing MoMo config: ${missing.join(", ")}`);
    }

    return config;
};

const buildCreateSignature = ({
    accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode,
    redirectUrl,
    requestId,
    requestType
}) => {
    return `accessKey=${accessKey}`
        + `&amount=${amount}`
        + `&extraData=${extraData}`
        + `&ipnUrl=${ipnUrl}`
        + `&orderId=${orderId}`
        + `&orderInfo=${orderInfo}`
        + `&partnerCode=${partnerCode}`
        + `&redirectUrl=${redirectUrl}`
        + `&requestId=${requestId}`
        + `&requestType=${requestType}`;
};

const buildNotifySignature = (params, accessKey) => {
    return `accessKey=${accessKey}`
        + `&amount=${params.amount ?? ""}`
        + `&extraData=${params.extraData ?? ""}`
        + `&message=${params.message ?? ""}`
        + `&orderId=${params.orderId ?? ""}`
        + `&orderInfo=${params.orderInfo ?? ""}`
        + `&orderType=${params.orderType ?? ""}`
        + `&partnerCode=${params.partnerCode ?? ""}`
        + `&payType=${params.payType ?? ""}`
        + `&requestId=${params.requestId ?? ""}`
        + `&responseTime=${params.responseTime ?? ""}`
        + `&resultCode=${params.resultCode ?? ""}`
        + `&transId=${params.transId ?? ""}`;
};

const verifyMomoSignature = (params) => {
    const config = getMomoConfig();
    const raw = buildNotifySignature(params, config.accessKey);
    const expected = signRaw(raw, config.secretKey);

    return expected === params.signature;
};

const cancelPendingPaymentBooking = async (bookingId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: Number(bookingId) },
        include: { bookingSeats: true, payment: true }
    });

    if (!booking || booking.status !== "PENDING") return;

    const showtimeSeatIds = booking.bookingSeats.map((bookingSeat) => bookingSeat.showtimeSeatId);

    await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
            where: { bookingId: booking.id, status: "PENDING" },
            data: { status: "CANCELLED" }
        });

        await tx.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED" }
        });

        await tx.showtimeSeat.updateMany({
            where: {
                id: { in: showtimeSeatIds },
                status: "HOLD",
                heldBy: booking.userId
            },
            data: {
                status: "AVAILABLE",
                holdUntil: null,
                heldBy: null
            }
        });
    });
};

exports.createMomoPayment = async ({ userId, showtimeId, seatIds }) => {
    const config = getMomoConfig();
    const normalizedSeatIds = normalizeNumberArray(seatIds);

    if (!userId || !showtimeId || !normalizedSeatIds.length) {
        throw new Error("Invalid input");
    }

    const paymentContext = await prisma.$transaction(async (tx) => {
        const now = new Date();
        const paymentHoldUntil = new Date(now.getTime() + PAYMENT_HOLD_MINUTES * 60 * 1000);

        const seats = await tx.showtimeSeat.findMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: normalizedSeatIds },
                status: "HOLD",
                heldBy: Number(userId),
                holdUntil: { gt: now }
            },
            select: { id: true, seatId: true }
        });

        if (seats.length !== normalizedSeatIds.length) {
            throw new Error("Some seats are invalid or expired");
        }

        const existingBookingSeat = await tx.bookingSeat.findFirst({
            where: {
                showtimeSeatId: { in: seats.map((seat) => seat.id) },
                booking: {
                    status: { in: ["PENDING", "CONFIRMED"] }
                }
            }
        });

        if (existingBookingSeat) {
            throw new Error("Some seats already have a pending or confirmed booking");
        }

        const showtime = await tx.showtime.findUnique({
            where: { id: Number(showtimeId) },
            select: { price: true }
        });

        if (!showtime) throw new Error("Showtime not found");

        const amount = Number(showtime.price) * seats.length;
        const booking = await tx.booking.create({
            data: {
                userId: Number(userId),
                showtimeId: Number(showtimeId),
                totalPrice: amount,
                status: "PENDING"
            }
        });

        await tx.bookingSeat.createMany({
            data: seats.map((seat) => ({
                bookingId: booking.id,
                showtimeSeatId: seat.id
            }))
        });

        const holdResult = await tx.showtimeSeat.updateMany({
            where: {
                id: { in: seats.map((seat) => seat.id) },
                status: "HOLD",
                heldBy: Number(userId)
            },
            data: { holdUntil: paymentHoldUntil }
        });

        if (holdResult.count !== seats.length) {
            throw new Error("Race condition: seats changed");
        }

        const orderId = `BOOKING_${booking.id}_${Date.now()}`;
        const requestId = `${orderId}_${Math.floor(Math.random() * 1000000)}`;

        const payment = await tx.payment.create({
            data: {
                bookingId: booking.id,
                provider: "MOMO",
                amount,
                currency: "VND",
                status: "PENDING",
                orderId,
                requestId
            }
        });

        return {
            amount,
            bookingId: booking.id,
            orderId,
            paymentId: payment.id,
            requestId
        };
    });

    const requestType = "captureWallet";
    const extraData = "";
    const orderInfo = `Thanh toan ve xem phim #${paymentContext.bookingId}`;
    const rawSignature = buildCreateSignature({
        accessKey: config.accessKey,
        amount: paymentContext.amount,
        extraData,
        ipnUrl: config.ipnUrl,
        orderId: paymentContext.orderId,
        orderInfo,
        partnerCode: config.partnerCode,
        redirectUrl: config.redirectUrl,
        requestId: paymentContext.requestId,
        requestType
    });
    const signature = signRaw(rawSignature, config.secretKey);

    const payload = {
        partnerCode: config.partnerCode,
        accessKey: config.accessKey,
        requestId: paymentContext.requestId,
        amount: String(paymentContext.amount),
        orderId: paymentContext.orderId,
        orderInfo,
        redirectUrl: config.redirectUrl,
        ipnUrl: config.ipnUrl,
        extraData,
        requestType,
        signature,
        lang: "vi"
    };

    try {
        const { data } = await axios.post(config.endpoint, payload, { timeout: 30000 });

        await prisma.payment.update({
            where: { id: paymentContext.paymentId },
            data: {
                transId: data.transId ? String(data.transId) : null,
                payUrl: data.payUrl || null,
                qrCodeUrl: data.qrCodeUrl || null,
                deeplink: data.deeplink || data.deeplinkWebInApp || null,
                rawResponse: data
            }
        });

        return {
            bookingId: paymentContext.bookingId,
            paymentId: paymentContext.paymentId,
            amount: paymentContext.amount,
            orderId: paymentContext.orderId,
            requestId: paymentContext.requestId,
            payUrl: data.payUrl || null,
            qrCodeUrl: data.qrCodeUrl || null,
            deeplink: data.deeplink || data.deeplinkWebInApp || null
        };
    } catch (error) {
        await cancelPendingPaymentBooking(paymentContext.bookingId);

        if (error.response) {
            const message = error.response.data?.message
                || error.response.data?.localMessage
                || JSON.stringify(error.response.data);
            throw new Error(`MoMo ${error.response.status}: ${message}`);
        }

        throw error;
    }
};

exports.handleMomoIpn = async (body) => {
    const config = getMomoConfig();

    if (!verifyMomoSignature(body)) {
        throw new Error("Invalid MoMo signature");
    }

    if (body.partnerCode !== config.partnerCode) {
        throw new Error("Invalid MoMo partnerCode");
    }

    const payment = await prisma.payment.findUnique({
        where: { orderId: body.orderId },
        include: {
            booking: {
                include: { bookingSeats: true }
            }
        }
    });

    if (!payment) throw new Error("Payment not found");

    if (payment.requestId !== body.requestId) {
        throw new Error("Invalid MoMo requestId");
    }

    if (Number(payment.amount) !== Number(body.amount)) {
        throw new Error("Invalid MoMo amount");
    }

    if (payment.status === "PAID") {
        return { alreadyPaid: true, bookingId: payment.bookingId };
    }

    const paid = Number(body.resultCode) === 0;
    const showtimeSeatIds = payment.booking.bookingSeats.map((bookingSeat) => bookingSeat.showtimeSeatId);

    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: paid ? "PAID" : "FAILED",
                transId: body.transId ? String(body.transId) : payment.transId,
                rawResponse: body
            }
        });

        if (!paid) {
            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: "CANCELLED" }
            });

            await tx.showtimeSeat.updateMany({
                where: {
                    id: { in: showtimeSeatIds },
                    status: "HOLD",
                    heldBy: payment.booking.userId
                },
                data: {
                    status: "AVAILABLE",
                    holdUntil: null,
                    heldBy: null
                }
            });

            return;
        }

        const seatResult = await tx.showtimeSeat.updateMany({
            where: {
                id: { in: showtimeSeatIds },
                status: "HOLD",
                heldBy: payment.booking.userId
            },
            data: {
                status: "BOOKED",
                holdUntil: null,
                heldBy: null
            }
        });

        if (seatResult.count !== showtimeSeatIds.length) {
            throw new Error("Cannot confirm booking because seats are no longer held");
        }

        await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CONFIRMED" }
        });
    });

    return {
        paid,
        bookingId: payment.bookingId,
        paymentId: payment.id
    };
};

exports.getPaymentByOrderId = async (orderId) => {
    if (!orderId) throw new Error("orderId is required");

    return prisma.payment.findUnique({
        where: { orderId },
        include: {
            booking: {
                select: {
                    id: true,
                    status: true,
                    totalPrice: true
                }
            }
        }
    });
};
