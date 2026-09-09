const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getExpiryAlerts,
  getMonthlyRevenueReport,
  getMembershipCalendar,
} = require("../controllers/dashboardController");
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/expiry-alerts', protect, getExpiryAlerts);
router.get('/reports/monthly-revenue', protect, getMonthlyRevenueReport);
router.get(
  "/membership-calendar",
  protect,
  getMembershipCalendar
);

module.exports = router;