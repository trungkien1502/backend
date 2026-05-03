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
