const express =
  require("express");

const router =
  express.Router();


const {
  loginFlyitAdmin,

  createTrialGym,

  getAllTrialGyms,

  getTrialGymById,

  extendTrial,

  disableTrial,

  enableTrial,

  deleteTrialGym,
} =
  require(
    "../controllers/flyitAdminController"
  );


const {
  protectFlyitAdmin,
} =
  require(
    "../middleware/flyitAdminAuth"
  );


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


// =====================================================
// CREATE TRIAL GYM
// POST /api/flyit-admin/trials
// =====================================================

router.post(
  "/trials",
  protectFlyitAdmin,
  createTrialGym
);


// =====================================================
// GET ALL TRIAL GYMS
// GET /api/flyit-admin/trials
// =====================================================

router.get(
  "/trials",
  protectFlyitAdmin,
  getAllTrialGyms
);


// =====================================================
// GET SINGLE TRIAL
// GET /api/flyit-admin/trials/:gymId
// =====================================================

router.get(
  "/trials/:gymId",
  protectFlyitAdmin,
  getTrialGymById
);


// =====================================================
// EXTEND TRIAL
// PUT /api/flyit-admin/trials/:gymId/extend
// =====================================================

router.put(
  "/trials/:gymId/extend",
  protectFlyitAdmin,
  extendTrial
);


// =====================================================
// DISABLE TRIAL
// PUT /api/flyit-admin/trials/:gymId/disable
// =====================================================

router.put(
  "/trials/:gymId/disable",
  protectFlyitAdmin,
  disableTrial
);


// =====================================================
// ENABLE TRIAL
// PUT /api/flyit-admin/trials/:gymId/enable
// =====================================================

router.put(
  "/trials/:gymId/enable",
  protectFlyitAdmin,
  enableTrial
);


// =====================================================
// DELETE TRIAL
// DELETE /api/flyit-admin/trials/:gymId
// =====================================================

router.delete(
  "/trials/:gymId",
  protectFlyitAdmin,
  deleteTrialGym
);


module.exports =
  router;