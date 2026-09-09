const express = require("express");

const router = express.Router();

const {
  accessTrial,
} = require("../controllers/trialController");


// =====================================================
// PASSWORDLESS TRIAL ACCESS
// POST /api/trial/access
// PUBLIC
// =====================================================

router.post(
  "/access",
  accessTrial
);


module.exports = router;