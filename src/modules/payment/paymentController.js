const paymentService = require("./paymentService");

const FINAL_PAYMENT_STATUSES = new Set(["PAID", "FAILED", "CANCELLED"]);
const RETURN_WAIT_ATTEMPTS = Number(process.env.MOMO_RETURN_WAIT_ATTEMPTS || 6);
const RETURN_WAIT_DELAY_MS = Number(process.env.MOMO_RETURN_WAIT_DELAY_MS || 500);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getPaymentAfterReturn = async (orderId) => {
    let payment = null;

    for (let attempt = 0; attempt < RETURN_WAIT_ATTEMPTS; attempt += 1) {
        payment = await paymentService.getPaymentByOrderId(orderId);

        if (!payment || FINAL_PAYMENT_STATUSES.has(payment.status)) {
            return payment;
        }

        await delay(RETURN_WAIT_DELAY_MS);
    }

    return payment;
};

const buildAppPaymentReturnUrl = ({ payment, resultCode, message }) => {
    const appReturnUrl = process.env.APP_PAYMENT_RETURN_URL;
    if (!appReturnUrl) return null;

    try {
        const url = new URL(appReturnUrl);
        url.searchParams.set("orderId", payment.orderId);
        url.searchParams.set("paymentStatus", payment.status);

        if (payment.booking?.id) {
            url.searchParams.set("bookingId", String(payment.booking.id));
        }

        if (payment.booking?.status) {
            url.searchParams.set("bookingStatus", payment.booking.status);
        }

        if (resultCode !== undefined) {
            url.searchParams.set("resultCode", String(resultCode));
        }

        if (message) {
            url.searchParams.set("message", String(message));
        }

        return url.toString();
    } catch (error) {
        console.error("Invalid APP_PAYMENT_RETURN_URL:", error.message);
        return null;
    }
};

exports.createMomoPayment = async (req, res) => {

    try {
        const { userId, showtimeId, seatIds } = req.body;


        const data = await paymentService.createMomoPayment({
            userId: req.userId || userId,
            showtimeId,
            seatIds
        });
        console.log("🔥 MOMO CREATE RESPONSE:", data);

        res.json({
            message: "MoMo payment created",
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.createVnpayPayment = async (req, res) => {
    try {
        const { userId, showtimeId, seatIds } = req.body;
        const ipAddr = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
            || req.ip
            || req.connection?.remoteAddress;

        const data = await paymentService.createVnpayPayment({
            userId: req.userId || userId,
            showtimeId,
            seatIds,
            ipAddr
        });

        console.log("VNPay create response:", data);

        res.json({
            message: "VNPay payment created",
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.handleMomoIpn = async (req, res) => {
    console.log("🔥 FULL IPN BODY:", JSON.stringify(req.body, null, 2));

    try {
        console.log("MoMo IPN received:", {
            orderId: req.body.orderId,
            requestId: req.body.requestId,
            resultCode: req.body.resultCode,
            amount: req.body.amount
        });

        const result = await paymentService.handleMomoIpn(req.body);

        console.log("MoMo IPN processed:", result);

        res.status(204).send();
    } catch (error) {
        console.error("MoMo IPN error:", error.message);
        res.status(400).json({ message: error.message });
    }
};

exports.handleMomoReturn = async (req, res) => {
    try {
        if (req.query.orderId && req.query.signature) {
            try {
                console.log("MoMo return received:", {
                    orderId: req.query.orderId,
                    requestId: req.query.requestId,
                    resultCode: req.query.resultCode,
                    amount: req.query.amount
                });

                const result = await paymentService.handleMomoIpn(req.query);

                console.log("MoMo return processed:", result);
            } catch (error) {
                console.error("MoMo return processing error:", error.message);
            }
        }

        const payment = await getPaymentAfterReturn(req.query.orderId);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        const responseData = {
            orderId: payment.orderId,
            paymentStatus: payment.status,
            booking: payment.booking,
            resultCode: req.query.resultCode,
            message: req.query.message
        };

        const appRedirectUrl = buildAppPaymentReturnUrl({
            payment,
            resultCode: req.query.resultCode,
            message: req.query.message
        });

        if (appRedirectUrl && req.query.format !== "json") {
            return res.redirect(302, appRedirectUrl);
        }

        res.json({
            message: "MoMo return received",
            data: responseData
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.handleVnpayReturn = async (req, res) => {
    try {
        console.log("VNPay return received:", {
            orderId: req.query.vnp_TxnRef,
            responseCode: req.query.vnp_ResponseCode,
            transactionStatus: req.query.vnp_TransactionStatus,
            amount: req.query.vnp_Amount
        });

        const result = await paymentService.handleVnpayReturn(req.query);
        const payment = await getPaymentAfterReturn(req.query.vnp_TxnRef);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        const responseData = {
            orderId: payment.orderId,
            paymentStatus: payment.status,
            booking: payment.booking,
            responseCode: req.query.vnp_ResponseCode,
            transactionStatus: req.query.vnp_TransactionStatus,
            result
        };

        const appRedirectUrl = buildAppPaymentReturnUrl({
            payment,
            resultCode: req.query.vnp_ResponseCode,
            message: req.query.vnp_TransactionStatus
        });

        if (appRedirectUrl && req.query.format !== "json") {
            return res.redirect(302, appRedirectUrl);
        }

        res.json({
            message: "VNPay return received",
            data: responseData
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.handleVnpayIpn = async (req, res) => {
    try {
        console.log("VNPay IPN received:", {
            orderId: req.query.vnp_TxnRef,
            responseCode: req.query.vnp_ResponseCode,
            transactionStatus: req.query.vnp_TransactionStatus,
            amount: req.query.vnp_Amount
        });

        await paymentService.handleVnpayReturn(req.query);

        res.json({
            RspCode: "00",
            Message: "Confirm Success"
        });
    } catch (error) {
        console.error("VNPay IPN error:", error.message);

        const message = error.message || "Unknown error";
        let code = "99";

        if (message.includes("Invalid VNPay signature")) code = "97";
        if (message.includes("Payment not found")) code = "01";
        if (message.includes("Invalid VNPay amount")) code = "04";

        res.json({
            RspCode: code,
            Message: message
        });
    }
};

exports.getPaymentByOrderId = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentByOrderId(req.params.orderId);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.json({ data: payment });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
