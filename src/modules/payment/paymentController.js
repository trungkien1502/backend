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

const pickMomoLogFields = (payload) => ({
    orderId: payload.orderId,
    requestId: payload.requestId,
    resultCode: payload.resultCode,
    amount: payload.amount,
    message: payload.message,
    payType: payload.payType,
    transId: payload.transId,
    responseTime: payload.responseTime
});

exports.createMomoPayment = async (req, res) => {
    try {
        const { userId, showtimeId, seatIds } = req.body;

        const data = await paymentService.createMomoPayment({
            userId: req.userId || userId,
            showtimeId,
            seatIds
        });
        console.log("MoMo create response:", data);

        res.json({
            message: "MoMo payment created",
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.handleMomoIpn = async (req, res) => {
    console.log("MoMo full IPN body:", JSON.stringify(req.body, null, 2));

    try {
        console.log("MoMo IPN received:", pickMomoLogFields(req.body));

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
                console.log("MoMo return received:", pickMomoLogFields(req.query));

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

exports.queryMomoPayment = async (req, res) => {
    try {
        const result = await paymentService.queryMomoPayment(req.params.orderId);
        res.json({
            message: "MoMo payment status queried",
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.forceConfirmPayment = async (req, res) => {
    if (process.env.ENABLE_PAYMENT_DEMO_TOOLS !== "true") {
        return res.status(404).json({ message: "Route not found" });
    }

    try {
        const payment = await paymentService.forceConfirmPayment(req.params.orderId);
        res.json({
            message: "Payment force-confirmed for demo",
            data: payment
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
