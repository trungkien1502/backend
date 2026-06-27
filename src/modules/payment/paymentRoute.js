const express = require("express");
const router = express.Router();
const controller = require("./paymentController");

router.post("/momo/create", controller.createMomoPayment);
router.post("/momo/ipn", controller.handleMomoIpn);
router.get("/momo/return", controller.handleMomoReturn);
router.get("/order/:orderId", controller.getPaymentByOrderId);

module.exports = router;
