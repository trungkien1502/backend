const express = require("express");
const router = express.Router();
const controller = require("./paymentController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");

router.post("/momo/create", controller.createMomoPayment);
router.post("/momo/ipn", controller.handleMomoIpn);
router.get("/momo/return", controller.handleMomoReturn);
router.get("/order/:orderId", controller.getPaymentByOrderId);
router.post("/momo/query/:orderId", authMiddleware, requireAdmin, controller.queryMomoPayment);
router.post("/momo/demo-confirm/:orderId", authMiddleware, requireAdmin, controller.forceConfirmPayment);

module.exports = router;
