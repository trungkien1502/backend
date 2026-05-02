const paymentService = require("./paymentService");

exports.createMomoPayment = async (req, res) => {
    try {
        const { userId, showtimeId, seatIds } = req.body;

        const data = await paymentService.createMomoPayment({
            userId: req.userId || userId,
            showtimeId,
            seatIds
        });

        res.json({
            message: "MoMo payment created",
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.handleMomoIpn = async (req, res) => {
    try {
        await paymentService.handleMomoIpn(req.body);

        res.status(204).send();
    } catch (error) {
        console.error("MoMo IPN error:", error.message);
        res.status(400).json({ message: error.message });
    }
};

exports.handleMomoReturn = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentByOrderId(req.query.orderId);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.json({
            message: "MoMo return received",
            data: {
                orderId: payment.orderId,
                paymentStatus: payment.status,
                booking: payment.booking,
                resultCode: req.query.resultCode,
                message: req.query.message
            }
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
