const express = require("express");

const router = express.Router();

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  setupSecurityPin,
  verifySecurityPin,
  verifyRecoveryCode,
  resetForgottenPassword,
} = require("../controllers/adminController");


// =====================================================
// PUBLIC ROUTES
// =====================================================

// Admin login
router.post(
  "/login",
  loginAdmin
);


// Forgot password - verify Security PIN
router.post(
  "/security/verify-pin",
  verifySecurityPin
);


// Forgot password - verify Recovery Code
router.post(
  "/security/verify-recovery",
  verifyRecoveryCode
);


// Reset password after successful verification
router.post(
  "/reset-password",
  resetForgottenPassword
);


// =====================================================
// PROTECTED ROUTES
// =====================================================

// Get owner profile
router.get(
  "/profile",
  protect,
  getAdminProfile
);


// Update owner name / phone
router.put(
  "/profile",
  protect,
  updateAdminProfile
);


// Change password while logged in
router.put(
  "/change-password",
  protect,
  changePassword
);


// Set / change Security PIN
router.post(
  "/security/setup",
  protect,
  setupSecurityPin
);


module.exports = router;