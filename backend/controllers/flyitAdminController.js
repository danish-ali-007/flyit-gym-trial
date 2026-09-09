const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const FlyitAdmin =
  require("../models/FlyitAdmin");

const Gym =
  require("../models/Gym");

const Member =
  require("../models/Member");

const Payment =
  require("../models/Payment");

const MembershipRenewal =
  require("../models/MembershipRenewal");

const Admin =
  require("../models/Admin");

const seedTrialDemoData =
  require("../utils/seedTrialDemoData");


// =====================================================
// GENERATE FLYIT ADMIN JWT
// =====================================================

const generateFlyitAdminToken =
  (id) => {

    return jwt.sign(
      {
        id,

        role:
          "superadmin",

        type:
          "flyit-admin",
      },

      process.env.JWT_SECRET,

      {
        expiresIn:
          "7d",
      }
    );
  };


// =====================================================
// GENERATE SECURE TRIAL TOKEN
// =====================================================

const generateTrialToken =
  () => {

    return crypto
      .randomBytes(24)
      .toString("hex");
  };


// =====================================================
// FLYIT ADMIN LOGIN
// POST /api/flyit-admin/login
// PUBLIC
// =====================================================

exports.loginFlyitAdmin =
  async (req, res) => {

    try {

      const {
        email,
        password,
      } =
        req.body;


      if (
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Email and password are required",
          });
      }


      const admin =
        await FlyitAdmin.findOne({
          email:
            String(email)
              .toLowerCase()
              .trim(),
        });


      if (
        !admin ||
        !(
          await admin.matchPassword(
            password
          )
        )
      ) {

        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Invalid email or password",
          });
      }


      const token =
        generateFlyitAdminToken(
          admin._id
        );


      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Flyit Admin login successful",

          data: {
            _id:
              admin._id,

            name:
              admin.name,

            email:
              admin.email,

            role:
              admin.role,

            token,
          },
        });

    } catch (error) {

      console.error(
        "Flyit Admin Login Error:",
        error
      );


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// CREATE TRIAL GYM
// POST /api/flyit-admin/trials
// PRIVATE - FLYIT ADMIN
// =====================================================

exports.createTrialGym =
  async (req, res) => {

    let createdGym =
      null;


    try {

      const {
        gymName,
        ownerName,
        phone,
        trialDays = 3,
      } =
        req.body;


      if (
        !gymName ||
        !ownerName ||
        !phone
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Gym name, owner name and phone are required",
          });
      }


      const days =
        Number(
          trialDays
        );


      if (
        Number.isNaN(
          days
        ) ||
        days < 1 ||
        days > 30
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Trial days must be between 1 and 30",
          });
      }


      const trialStart =
        new Date();


      const trialEnd =
        new Date(
          trialStart
        );


      trialEnd.setDate(
        trialEnd.getDate() +
          days
      );


      // ==========================================
      // UNIQUE TRIAL TOKEN
      // ==========================================

      let trialToken;

      let tokenExists =
        true;


      while (
        tokenExists
      ) {

        trialToken =
          generateTrialToken();


        tokenExists =
          await Gym.exists({
            trialToken,
          });
      }


      // ==========================================
      // CREATE GYM
      // ==========================================

      const gym =
        await Gym.create({
          gymName:
            String(
              gymName
            ).trim(),

          ownerName:
            String(
              ownerName
            ).trim(),

          phone:
            String(
              phone
            ).trim(),

          trialToken,

          trialStart,

          trialEnd,

          status:
            "trial",
        });


      createdGym =
        gym;


      // ==========================================
      // AUTO SEED DEMO DATA
      // ==========================================

      const demoSeed =
        await seedTrialDemoData(
          gym._id
        );


      // ==========================================
      // RESPONSE
      // ==========================================

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            "Trial gym created successfully",

          data: {
            _id:
              gym._id,

            gymName:
              gym.gymName,

            ownerName:
              gym.ownerName,

            phone:
              gym.phone,

            status:
              gym.status,

            trialStart:
              gym.trialStart,

            trialEnd:
              gym.trialEnd,

            trialToken:
              gym.trialToken,

            demoData: {
              membersCreated:
                demoSeed.membersCreated,

              paymentsCreated:
                demoSeed.paymentsCreated,
            },
          },
        });

    } catch (error) {

      console.error(
        "Create Trial Gym Error:",
        error
      );


      // ==========================================
      // CLEANUP INCOMPLETE GYM
      // ==========================================

      if (
        createdGym?._id
      ) {

        try {

          await Gym.findByIdAndDelete(
            createdGym._id
          );

        } catch (
          cleanupError
        ) {

          console.error(
            "Trial Gym Cleanup Error:",
            cleanupError
          );
        }
      }


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// GET ALL TRIAL GYMS
// GET /api/flyit-admin/trials
// PRIVATE - FLYIT ADMIN
// =====================================================

exports.getAllTrialGyms =
  async (req, res) => {

    try {

      const now =
        new Date();


      // ==========================================
      // AUTO MARK EXPIRED TRIALS
      // ==========================================

      await Gym.updateMany(
        {
          status:
            "trial",

          trialEnd: {
            $lt:
              now,
          },
        },

        {
          $set: {
            status:
              "expired",
          },
        }
      );


      const gyms =
        await Gym.find({})
          .sort({
            createdAt:
              -1,
          });


      const totalTrials =
        gyms.length;


      const activeTrials =
        gyms.filter(
          (gym) =>
            gym.status ===
            "trial"
        ).length;


      const expiredTrials =
        gyms.filter(
          (gym) =>
            gym.status ===
            "expired"
        ).length;


      const disabledTrials =
        gyms.filter(
          (gym) =>
            gym.status ===
            "disabled"
        ).length;


      return res
        .status(200)
        .json({
          success:
            true,

          summary: {
            totalTrials,

            activeTrials,

            expiredTrials,

            disabledTrials,
          },

          data:
            gyms,
        });

    } catch (error) {

      console.error(
        "Get Trial Gyms Error:",
        error
      );


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// GET SINGLE TRIAL GYM
// GET /api/flyit-admin/trials/:gymId
// PRIVATE
// =====================================================

exports.getTrialGymById =
  async (req, res) => {

    try {

      const gym =
        await Gym.findById(
          req.params.gymId
        );


      if (!gym) {

        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Gym not found",
          });
      }


      return res
        .status(200)
        .json({
          success:
            true,

          data:
            gym,
        });

    } catch (error) {

      console.error(
        "Get Trial Gym Error:",
        error
      );


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// EXTEND TRIAL
// PUT /api/flyit-admin/trials/:gymId/extend
// PRIVATE
// =====================================================

exports.extendTrial =
  async (req, res) => {

    try {

      const {
        days = 3,
      } =
        req.body;


      const extendDays =
        Number(
          days
        );


      if (
        Number.isNaN(
          extendDays
        ) ||
        extendDays < 1 ||
        extendDays > 30
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Extension days must be between 1 and 30",
          });
      }


      const gym =
        await Gym.findById(
          req.params.gymId
        );


      if (!gym) {

        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Gym not found",
          });
      }


      const now =
        new Date();


      let baseDate;


      if (
        gym.trialEnd &&
        gym.trialEnd > now
      ) {

        baseDate =
          new Date(
            gym.trialEnd
          );

      } else {

        baseDate =
          new Date();
      }


      baseDate.setDate(
        baseDate.getDate() +
          extendDays
      );


      gym.trialEnd =
        baseDate;


      gym.status =
        "trial";


      await gym.save();


      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Trial extended successfully",

          data:
            gym,
        });

    } catch (error) {

      console.error(
        "Extend Trial Error:",
        error
      );


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// DISABLE TRIAL
// PUT /api/flyit-admin/trials/:gymId/disable
// PRIVATE
// =====================================================

exports.disableTrial =
  async (req, res) => {

    try {

      const gym =
        await Gym.findById(
          req.params.gymId
        );


      if (!gym) {

        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Gym not found",
          });
      }


      gym.status =
        "disabled";


      await gym.save();


      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Trial disabled successfully",

          data:
            gym,
        });

    } catch (error) {

      console.error(
        "Disable Trial Error:",
        error
      );


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// ENABLE TRIAL
// PUT /api/flyit-admin/trials/:gymId/enable
// PRIVATE
// =====================================================

exports.enableTrial =
  async (req, res) => {

    try {

      const gym =
        await Gym.findById(
          req.params.gymId
        );


      if (!gym) {

        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Gym not found",
          });
      }


      const now =
        new Date();


      if (
        !gym.trialEnd ||
        gym.trialEnd <= now
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Trial is already expired. Extend the trial first.",
          });
      }


      gym.status =
        "trial";


      await gym.save();


      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Trial enabled successfully",

          data:
            gym,
        });

    } catch (error) {

      console.error(
        "Enable Trial Error:",
        error
      );


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// DELETE TRIAL GYM
// DELETE /api/flyit-admin/trials/:gymId
// PRIVATE - FLYIT ADMIN
//
// IMPORTANT:
// Gym ke saath uska complete tenant data delete hoga.
// =====================================================

exports.deleteTrialGym =
  async (req, res) => {

    try {

      const gymId =
        req.params.gymId;


      // ==========================================
      // FIND GYM FIRST
      // ==========================================

      const gym =
        await Gym.findById(
          gymId
        );


      if (!gym) {

        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Gym not found",
          });
      }


      // ==========================================
      // DELETE ALL GYM RELATED DATA
      // ==========================================

      const [
        memberResult,
        paymentResult,
        renewalResult,
        adminResult,
      ] =
        await Promise.all([
          Member.deleteMany({
            gymId,
          }),

          Payment.deleteMany({
            gymId,
          }),

          MembershipRenewal.deleteMany({
            gymId,
          }),

          Admin.deleteMany({
            gymId,
          }),
        ]);


      // ==========================================
      // DELETE GYM LAST
      // ==========================================

      await Gym.findByIdAndDelete(
        gymId
      );


      console.log(
        `Trial gym deleted: ${gym.gymName}`
      );


      console.log(
        `Members deleted: ${memberResult.deletedCount}`
      );


      console.log(
        `Payments deleted: ${paymentResult.deletedCount}`
      );


      console.log(
        `Renewals deleted: ${renewalResult.deletedCount}`
      );


      console.log(
        `Admins deleted: ${adminResult.deletedCount}`
      );


      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Trial gym deleted successfully",

          data: {
            gymId:
              gym._id,

            gymName:
              gym.gymName,

            deleted: {
              members:
                memberResult.deletedCount,

              payments:
                paymentResult.deletedCount,

              renewals:
                renewalResult.deletedCount,

              admins:
                adminResult.deletedCount,
            },
          },
        });

    } catch (error) {

      console.error(
        "Delete Trial Gym Error:",
        error
      );


      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Unable to delete trial gym",
        });
    }
  };