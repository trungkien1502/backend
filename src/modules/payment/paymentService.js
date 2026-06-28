const axios = require("axios");
const crypto = require("crypto");
const prisma = require("../../config/prisma");

const MOMO_CREATE_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";
const VNPAY_PAYMENT_ENDPOINT = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const PAYMENT_HOLD_MINUTES = Number(process.env.PAYMENT_HOLD_MINUTES || 5);

const normalizeNumberArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map(Number).filter(Number.isInteger);
};

const signRaw = (raw, secretKey) => {
    return crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
};

const isHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
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

    if (!isHttpUrl(config.redirectUrl)) {
        throw new Error(
            "MOMO_REDIRECT_URL must be a backend http(s) URL, for example https://your-domain.com/api/payments/momo/return. Use APP_PAYMENT_RETURN_URL for the app deeplink."
        );
    }

    if (!isHttpUrl(config.ipnUrl)) {
        throw new Error(
            "MOMO_IPN_URL must be a public backend http(s) URL, for example https://your-domain.com/api/payments/momo/ipn."
        );
    }

    if (process.env.APP_PAYMENT_RETURN_URL && process.env.APP_PAYMENT_RETURN_URL === config.redirectUrl) {
        throw new Error("APP_PAYMENT_RETURN_URL must be different from MOMO_REDIRECT_URL.");
    }

    return config;
};

const getVnpayConfig = () => {
    const config = {
        paymentUrl: process.env.VNPAY_PAYMENT_URL || VNPAY_PAYMENT_ENDPOINT,
        tmnCode: process.env.VNPAY_TMN_CODE,
        hashSecret: process.env.VNPAY_HASH_SECRET,
        returnUrl: process.env.VNPAY_RETURN_URL
    };

    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length) {
        throw new Error(`Missing VNPay config: ${missing.join(", ")}`);
    }

    if (!isHttpUrl(config.returnUrl)) {
        throw new Error("VNPAY_RETURN_URL must be a backend http(s) URL.");
    }

    return config;
};

const formatVnpayDate = (date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).formatToParts(date).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
};

const encodeVnpayValue = (value) => {
    return encodeURIComponent(String(value)).replace(/%20/g, "+");
};

const buildVnpaySignedQuery = (params) => {
    return Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
        .sort()
        .map((key) => `${encodeVnpayValue(key)}=${encodeVnpayValue(params[key])}`)
        .join("&");
};

const signVnpayParams = (params, hashSecret) => {
    const signedQuery = buildVnpaySignedQuery(params);
    return crypto.createHmac("sha512", hashSecret).update(signedQuery, "utf8").digest("hex");
};

const verifyVnpaySignature = (params, hashSecret) => {
    const receivedHash = params.vnp_SecureHash;
    if (!receivedHash) return false;

    const signedParams = { ...params };
    delete signedParams.vnp_SecureHash;
    delete signedParams.vnp_SecureHashType;

    const expectedHash = signVnpayParams(signedParams, hashSecret);
    return expectedHash.toLowerCase() === String(receivedHash).toLowerCase();
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
        console.log("MoMo create payload:", {
            orderId: payload.orderId,
            requestId: payload.requestId,
            amount: payload.amount,
            redirectUrl: payload.redirectUrl,
            ipnUrl: payload.ipnUrl,
            requestType: payload.requestType
        });

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

exports.createVnpayPayment = async ({ userId, showtimeId, seatIds, ipAddr }) => {
    const config = getVnpayConfig();
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

        const orderId = `VNPAY_${booking.id}_${Date.now()}`;
        const requestId = `${orderId}_${Math.floor(Math.random() * 1000000)}`;

        const payment = await tx.payment.create({
            data: {
                bookingId: booking.id,
                provider: "VNPAY",
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

    const createDate = new Date();
    const expireDate = new Date(createDate.getTime() + PAYMENT_HOLD_MINUTES * 60 * 1000);
    const params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: config.tmnCode,
        vnp_Amount: Math.round(paymentContext.amount * 100),
        vnp_CurrCode: "VND",
        vnp_TxnRef: paymentContext.orderId,
        vnp_OrderInfo: `Thanh toan ve xem phim #${paymentContext.bookingId}`,
        vnp_OrderType: "billpayment",
        vnp_Locale: "vn",
        vnp_ReturnUrl: config.returnUrl,
        vnp_IpAddr: ipAddr || "127.0.0.1",
        vnp_CreateDate: formatVnpayDate(createDate),
        vnp_ExpireDate: formatVnpayDate(expireDate)
    };

    const secureHash = signVnpayParams(params, config.hashSecret);
    const paymentUrl = `${config.paymentUrl}?${buildVnpaySignedQuery({ ...params, vnp_SecureHash: secureHash })}`;

    await prisma.payment.update({
        where: { id: paymentContext.paymentId },
        data: {
            payUrl: paymentUrl,
            qrCodeUrl: paymentUrl,
            rawResponse: {
                provider: "VNPAY",
                createParams: {
                    ...params,
                    vnp_SecureHash: secureHash
                }
            }
        }
    });

    return {
        bookingId: paymentContext.bookingId,
        paymentId: paymentContext.paymentId,
        amount: paymentContext.amount,
        orderId: paymentContext.orderId,
        requestId: paymentContext.requestId,
        payUrl: paymentUrl,
        qrCodeUrl: paymentUrl,
        deeplink: null
    };
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
                OR: [
                    {
                        status: "HOLD",
                        heldBy: payment.booking.userId
                    },
                    {
                        status: "AVAILABLE"
                    }
                ]
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

exports.handleVnpayReturn = async (query) => {
    const config = getVnpayConfig();

    if (!verifyVnpaySignature(query, config.hashSecret)) {
        throw new Error("Invalid VNPay signature");
    }

    const payment = await prisma.payment.findUnique({
        where: { orderId: query.vnp_TxnRef },
        include: {
            booking: {
                include: { bookingSeats: true }
            }
        }
    });

    if (!payment) throw new Error("Payment not found");

    const expectedAmount = Math.round(Number(payment.amount) * 100);
    if (Number(query.vnp_Amount) !== expectedAmount) {
        throw new Error("Invalid VNPay amount");
    }

    if (payment.status === "PAID") {
        return { alreadyPaid: true, bookingId: payment.bookingId };
    }

    const paid = query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00";
    const showtimeSeatIds = payment.booking.bookingSeats.map((bookingSeat) => bookingSeat.showtimeSeatId);

    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: paid ? "PAID" : "FAILED",
                transId: query.vnp_TransactionNo ? String(query.vnp_TransactionNo) : payment.transId,
                rawResponse: query
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
                OR: [
                    {
                        status: "HOLD",
                        heldBy: payment.booking.userId
                    },
                    {
                        status: "AVAILABLE"
                    }
                ]
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
        paymentId: payment.id,
        responseCode: query.vnp_ResponseCode,
        transactionStatus: query.vnp_TransactionStatus
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
