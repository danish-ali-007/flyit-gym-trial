const express = require("express");

const router = express.Router();

const {
  recordPayment,
  getMemberPaymentHistory,
  renewMembership,
  getUpcomingRenewal,
} = require("../controllers/paymentController");

const {
  protect,
} = require("../middleware/authMiddleware");


// =====================================================
// RECORD PAYMENT
// POST /api/payments
// =====================================================

router.post(
  "/",
  protect,
  recordPayment
);


// =====================================================
// GET MEMBER PAYMENT HISTORY
// GET /api/payments/member/GYM001
// =====================================================

router.get(
  "/member/:memberId",
  protect,
  getMemberPaymentHistory
);


// =====================================================
// GET UPCOMING / ADVANCE RENEWAL
// GET /api/payments/renewal/GYM001
// =====================================================

router.get(
  "/renewal/:memberId",
  protect,
  getUpcomingRenewal
);


// =====================================================
// RENEW MEMBERSHIP
// PUT /api/payments/renew/GYM001
// =====================================================

router.put(
  "/renew/:memberId",
  protect,
  renewMembership
);


module.exports = router;