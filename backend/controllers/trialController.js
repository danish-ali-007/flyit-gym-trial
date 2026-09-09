const jwt = require("jsonwebtoken");
const Gym = require("../models/Gym");


// =====================================================
// GENERATE TRIAL SESSION TOKEN
// =====================================================

const generateTrialSessionToken = (
  gymId
) => {
  return jwt.sign(
    {
      gymId,
      trial: true,
      type: "gym-trial",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "3d",
    }
  );
};


// =====================================================
// PASSWORDLESS TRIAL ACCESS
// POST /api/trial/access
// PUBLIC
// =====================================================

exports.accessTrial = async (req, res) => {
  try {

    const {
      trialToken,
    } = req.body;


    // =================================================
    // TOKEN REQUIRED
    // =================================================

    if (
      !trialToken ||
      !String(trialToken).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Trial token is required",
      });
    }


    // =================================================
    // FIND GYM FROM TRIAL TOKEN
    // =================================================

    const gym =
      await Gym.findOne({
        trialToken:
          String(trialToken).trim(),
      });


    if (!gym) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid trial link",
      });
    }


    // =================================================
    // DISABLED CHECK
    // =================================================

    if (
      gym.status ===
      "disabled"
    ) {
      return res.status(403).json({
        success: false,

        trialDisabled: true,

        message:
          "This trial has been disabled. Please contact Flyit Systems.",
      });
    }


    // =================================================
    // EXPIRY CHECK
    // =================================================

    const now =
      new Date();


    if (
      !gym.trialEnd ||
      now >
        new Date(
          gym.trialEnd
        )
    ) {

      if (
        gym.status !==
        "expired"
      ) {
        gym.status =
          "expired";

        await gym.save();
      }


      return res.status(403).json({
        success: false,

        trialExpired: true,

        message:
          "Your trial has expired. Please contact Flyit Systems to continue.",
      });
    }


    // =================================================
    // STATUS CHECK
    // =================================================

    if (
      gym.status !==
      "trial"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Trial access is not available",
      });
    }


    // =================================================
    // CREATE TEMPORARY SESSION JWT
    // =================================================

    const token =
      generateTrialSessionToken(
        gym._id.toString()
      );


    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "Trial access granted",

      data: {
        token,

        gym: {
          _id:
            gym._id,

          gymName:
            gym.gymName,

          ownerName:
            gym.ownerName,

          trialStart:
            gym.trialStart,

          trialEnd:
            gym.trialEnd,

          status:
            gym.status,
        },
      },
    });

  } catch (error) {

    console.error(
      "Trial Access Error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};