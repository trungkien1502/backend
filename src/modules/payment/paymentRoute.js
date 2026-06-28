const express = require("express");
const router = express.Router();
const controller = require("./paymentController");

router.post("/momo/create", controller.createMomoPayment);
router.post("/momo/ipn", controller.handleMomoIpn);
router.get("/momo/return", controller.handleMomoReturn);
router.post("/vnpay/create", controller.createVnpayPayment);
router.get("/vnpay/return", controller.handleVnpayReturn);
router.get("/vnpay/ipn", controller.handleVnpayIpn);
router.get("/order/:orderId", controller.getPaymentByOrderId);

module.exports = router;
