const express = require("express");
const router = express.Router();
import paymentController from "../Controllers/PaymentController";

// Route tạo URL thanh toán
router.post("/create_payment_url", paymentController.createPaymentVnpayUrl);

// Route xử lý kết quả trả về
router.get("/vnpay_return", paymentController.vnpayReturn);

router.get("/ipn", paymentController.vnpayIpn);

module.exports = router;
