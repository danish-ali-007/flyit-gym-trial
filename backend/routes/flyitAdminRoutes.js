const express = require("express");

const router = express.Router();

const {
  loginFlyitAdmin,
  createTrialGym,
  getAllTrialGyms,
  getTrialGymById,
  extendTrial,
  disableTrial,
  enableTrial,
} = require("../controllers/flyitAdminController");

const {
  protectFlyitAdmin,
} = require("../middleware/flyitAdminAuth");


// =====================================================
// PUBLIC
// =====================================================

// Flyit Admin Login
router.post(
  "/login",
  loginFlyitAdmin
);


// =====================================================
// PRIVATE - FLYIT ADMIN ONLY
// =====================================================

// Create Trial Gym
router.post(
  "/trials",
  protectFlyitAdmin,
  createTrialGym
);


// Get All Trial Gyms
router.get(
  "/trials",
  protectFlyitAdmin,
  getAllTrialGyms
);


// Get Single Trial Gym
router.get(
  "/trials/:gymId",
  protectFlyitAdmin,
  getTrialGymById
);


// Extend Trial
router.put(
  "/trials/:gymId/extend",
  protectFlyitAdmin,
  extendTrial
);


// Disable Trial
router.put(
  "/trials/:gymId/disable",
  protectFlyitAdmin,
  disableTrial
);


// Enable Trial
router.put(
  "/trials/:gymId/enable",
  protectFlyitAdmin,
  enableTrial
);


module.exports = router;