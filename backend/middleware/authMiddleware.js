const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const Gym = require("../models/Gym");


// =====================================================
// PROTECT NORMAL ADMIN + TRIAL SESSION
// =====================================================

const protect = async (req, res, next) => {
  try {

    // =====================================================
    // AUTHORIZATION HEADER
    // =====================================================

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }


    // =====================================================
    // TOKEN
    // =====================================================

    const token =
      authHeader.split(" ")[1];


    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message:
          "JWT secret is not configured",
      });
    }


    // =====================================================
    // VERIFY JWT
    // =====================================================

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    // =====================================================
    // PASSWORDLESS TRIAL SESSION
    // =====================================================

    if (
      decoded.trial === true &&
      decoded.type === "gym-trial"
    ) {

      if (!decoded.gymId) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid trial session",
        });
      }


      // =========================================
      // FIND GYM
      // =========================================

      const gym =
        await Gym.findById(
          decoded.gymId
        );


      if (!gym) {
        return res.status(403).json({
          success: false,
          message:
            "Gym account not found",
        });
      }


      // =========================================
      // DISABLED
      // =========================================

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


      // =========================================
      // TRIAL EXPIRY
      // =========================================

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


      // =========================================
      // STATUS
      // =========================================

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


      // =========================================
      // ATTACH TRIAL USER DATA
      // Controllers ko gymId yahin se milega
      // =========================================

      req.admin = {
        id: null,

        gymId:
          gym._id.toString(),

        trial: true,
      };


      req.gym =
        gym;


      return next();
    }


    // =====================================================
    // NORMAL GYM ADMIN SESSION
    // =====================================================

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }


    const admin =
      await Admin.findById(
        decoded.id
      ).select(
        "_id gymId"
      );


    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Admin account not found",
      });
    }


    // =====================================================
    // GYM LINK
    // =====================================================

    if (!admin.gymId) {
      return res.status(403).json({
        success: false,
        message:
          "Gym account is not configured",
      });
    }


    // =====================================================
    // FIND GYM
    // =====================================================

    const gym =
      await Gym.findById(
        admin.gymId
      );


    if (!gym) {
      return res.status(403).json({
        success: false,
        message:
          "Gym account not found",
      });
    }


    // =====================================================
    // DISABLED CHECK
    // =====================================================

    if (
      gym.status ===
      "disabled"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Gym access has been disabled",
      });
    }


    // =====================================================
    // TRIAL EXPIRY CHECK
    // =====================================================

    if (
      gym.status === "trial" &&
      gym.trialEnd &&
      new Date() >
        new Date(
          gym.trialEnd
        )
    ) {

      gym.status =
        "expired";

      await gym.save();


      return res.status(403).json({
        success: false,

        trialExpired: true,

        message:
          "Your trial has expired. Please contact Flyit Systems to continue.",
      });
    }


    // =====================================================
    // ATTACH NORMAL ADMIN DATA
    // =====================================================

    req.admin = {
      id:
        admin._id.toString(),

      gymId:
        admin.gymId.toString(),

      trial: false,
    };


    req.gym =
      gym;


    next();

  } catch (error) {

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please access the system again.",
      });
    }


    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
};


module.exports = {
  protect,
};