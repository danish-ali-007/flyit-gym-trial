const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");


// =====================================================
// GENERATE JWT TOKEN
// =====================================================

const generateToken = (id, gymId) => {
  return jwt.sign(
    {
      id,
      gymId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};


// =====================================================
// GENERATE RECOVERY CODE
// =====================================================

const generateRecoveryCode = () => {
  const firstPart =
    crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase();

  const secondPart =
    crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase();

  const thirdPart =
    crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase();

  return `OGYM-${firstPart}-${secondPart}-${thirdPart}`;
};


// =====================================================
// LOGIN ADMIN
// POST /api/admin/login
// PUBLIC
// =====================================================

exports.loginAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;


    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }


    const admin =
      await Admin.findOne({
        email:
          email
            .toLowerCase()
            .trim(),
      });


    if (
      admin &&
      (await admin.matchPassword(
        password
      ))
    ) {
      return res.status(200).json({
        success: true,

        data: {
          _id:
            admin._id,

          name:
            admin.name,

          email:
            admin.email,

          phone:
            admin.phone || "",

          gymId:
            admin.gymId || null,

          token:
            generateToken(
              admin._id,
              admin.gymId
            ),
        },
      });
    }


    return res.status(401).json({
      success: false,
      message:
        "Invalid email or password",
    });

  } catch (error) {

    console.error(
      "Admin Login Error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};


// =====================================================
// GET ADMIN PROFILE
// GET /api/admin/profile
// PRIVATE
// =====================================================

exports.getAdminProfile =
  async (req, res) => {
    try {

      const admin =
        await Admin.findById(
          req.admin.id
        ).select(
          "-password -securityPin -recoveryCode"
        );


      if (!admin) {
        return res.status(404).json({
          success: false,
          message:
            "Admin not found",
        });
      }


      return res.status(200).json({
        success: true,

        data: {
          _id:
            admin._id,

          name:
            admin.name,

          email:
            admin.email,

          phone:
            admin.phone || "",

          gymId:
            admin.gymId || null,

          securityPinConfigured:
            Boolean(
              admin.securityPin
            ),

          recoveryCodeConfigured:
            Boolean(
              admin.recoveryCode
            ),
        },
      });

    } catch (error) {

      console.error(
        "Get Admin Profile Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// UPDATE ADMIN PROFILE
// PUT /api/admin/profile
// PRIVATE
// =====================================================

exports.updateAdminProfile =
  async (req, res) => {
    try {

      const {
        name,
        phone,
      } = req.body;


      const admin =
        await Admin.findById(
          req.admin.id
        );


      if (!admin) {
        return res.status(404).json({
          success: false,
          message:
            "Admin not found",
        });
      }


      if (
        !name ||
        !String(name).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Owner name is required",
        });
      }


      const cleanPhone =
        String(
          phone || ""
        ).replace(
          /\D/g,
          ""
        );


      if (
        cleanPhone &&
        cleanPhone.length !== 10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number must be 10 digits",
        });
      }


      admin.name =
        String(name).trim();

      admin.phone =
        cleanPhone;


      await admin.save();


      return res.status(200).json({
        success: true,

        message:
          "Profile updated successfully",

        data: {
          _id:
            admin._id,

          name:
            admin.name,

          email:
            admin.email,

          phone:
            admin.phone || "",

          gymId:
            admin.gymId || null,
        },
      });

    } catch (error) {

      console.error(
        "Update Admin Profile Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// CHANGE PASSWORD
// PUT /api/admin/change-password
// PRIVATE
// =====================================================

exports.changePassword =
  async (req, res) => {
    try {

      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;


      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All password fields are required",
        });
      }


      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password and confirm password do not match",
        });
      }


      if (
        String(newPassword).length <
        8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 8 characters",
        });
      }


      const admin =
        await Admin.findById(
          req.admin.id
        );


      if (!admin) {
        return res.status(404).json({
          success: false,
          message:
            "Admin not found",
        });
      }


      const isCurrentPasswordCorrect =
        await admin.matchPassword(
          currentPassword
        );


      if (
        !isCurrentPasswordCorrect
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Current password is incorrect",
        });
      }


      const sameAsOldPassword =
        await admin.matchPassword(
          newPassword
        );


      if (sameAsOldPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from current password",
        });
      }


      admin.password =
        newPassword;


      await admin.save();


      return res.status(200).json({
        success: true,
        message:
          "Password changed successfully. Please login again.",
      });

    } catch (error) {

      console.error(
        "Change Password Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// SET / CHANGE SECURITY PIN
// POST /api/admin/security/setup
// PRIVATE
// =====================================================

exports.setupSecurityPin =
  async (req, res) => {
    try {

      const {
        currentPassword,
        securityPin,
        confirmSecurityPin,
      } = req.body;


      if (
        !currentPassword ||
        !securityPin ||
        !confirmSecurityPin
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Current password and Security PIN are required",
        });
      }


      const pin =
        String(
          securityPin
        ).trim();


      const confirmPin =
        String(
          confirmSecurityPin
        ).trim();


      if (
        !/^\d{6}$/.test(pin)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Security PIN must be exactly 6 digits",
        });
      }


      if (
        pin !==
        confirmPin
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Security PIN and confirm PIN do not match",
        });
      }


      const admin =
        await Admin.findById(
          req.admin.id
        );


      if (!admin) {
        return res.status(404).json({
          success: false,
          message:
            "Admin not found",
        });
      }


      const passwordCorrect =
        await admin.matchPassword(
          currentPassword
        );


      if (!passwordCorrect) {
        return res.status(401).json({
          success: false,
          message:
            "Current password is incorrect",
        });
      }


      const salt =
        await bcrypt.genSalt(10);


      admin.securityPin =
        await bcrypt.hash(
          pin,
          salt
        );


      const recoveryCode =
        generateRecoveryCode();


      admin.recoveryCode =
        await bcrypt.hash(
          recoveryCode,
          salt
        );


      admin.securityPinAttempts =
        0;

      admin.securityPinLockedUntil =
        null;


      await admin.save();


      return res.status(200).json({
        success: true,

        message:
          "Security PIN configured successfully",

        data: {
          recoveryCode,
        },
      });

    } catch (error) {

      console.error(
        "Setup Security PIN Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// VERIFY SECURITY PIN
// POST /api/admin/security/verify-pin
// PUBLIC
// =====================================================

exports.verifySecurityPin =
  async (req, res) => {
    try {

      const {
        email,
        securityPin,
      } = req.body;


      if (
        !email ||
        !securityPin
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and Security PIN are required",
        });
      }


      const admin =
        await Admin.findOne({
          email:
            String(email)
              .toLowerCase()
              .trim(),
        });


      if (
        !admin ||
        !admin.securityPin
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Security PIN is not configured",
        });
      }


      const now =
        new Date();


      if (
        admin.securityPinLockedUntil &&
        admin.securityPinLockedUntil >
        now
      ) {
        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Please try again later.",
        });
      }


      const pinCorrect =
        await admin.matchSecurityPin(
          String(
            securityPin
          ).trim()
        );


      if (!pinCorrect) {

        admin.securityPinAttempts =
          Number(
            admin.securityPinAttempts ||
            0
          ) + 1;


        if (
          admin.securityPinAttempts >=
          5
        ) {
          admin.securityPinLockedUntil =
            new Date(
              Date.now() +
              15 *
                60 *
                1000
            );

          admin.securityPinAttempts =
            0;
        }


        await admin.save();


        return res.status(401).json({
          success: false,
          message:
            "Invalid Security PIN",
        });
      }


      admin.securityPinAttempts =
        0;

      admin.securityPinLockedUntil =
        null;


      await admin.save();


      const resetToken =
        jwt.sign(
          {
            id:
              admin._id,

            purpose:
              "password-reset",
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "10m",
          }
        );


      return res.status(200).json({
        success: true,

        message:
          "Security PIN verified",

        data: {
          resetToken,
        },
      });

    } catch (error) {

      console.error(
        "Verify Security PIN Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// VERIFY RECOVERY CODE
// POST /api/admin/security/verify-recovery
// PUBLIC
// =====================================================

exports.verifyRecoveryCode =
  async (req, res) => {
    try {

      const {
        email,
        recoveryCode,
      } = req.body;


      if (
        !email ||
        !recoveryCode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and recovery code are required",
        });
      }


      const admin =
        await Admin.findOne({
          email:
            String(email)
              .toLowerCase()
              .trim(),
        });


      if (
        !admin ||
        !admin.recoveryCode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recovery code is not configured",
        });
      }


      const recoveryCodeCorrect =
        await admin
          .matchRecoveryCode(
            String(
              recoveryCode
            )
              .trim()
              .toUpperCase()
          );


      if (
        !recoveryCodeCorrect
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid recovery code",
        });
      }


      const resetToken =
        jwt.sign(
          {
            id:
              admin._id,

            purpose:
              "password-reset",
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "10m",
          }
        );


      return res.status(200).json({
        success: true,

        message:
          "Recovery code verified",

        data: {
          resetToken,
        },
      });

    } catch (error) {

      console.error(
        "Verify Recovery Code Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// RESET FORGOTTEN PASSWORD
// POST /api/admin/reset-password
// PUBLIC
// =====================================================

exports.resetForgottenPassword =
  async (req, res) => {
    try {

      const {
        resetToken,
        newPassword,
        confirmPassword,
      } = req.body;


      if (
        !resetToken ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reset token and password fields are required",
        });
      }


      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password and confirm password do not match",
        });
      }


      if (
        String(newPassword).length <
        8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 8 characters",
        });
      }


      let decoded;


      try {
        decoded =
          jwt.verify(
            resetToken,
            process.env.JWT_SECRET
          );

      } catch (error) {

        return res.status(401).json({
          success: false,
          message:
            "Password reset session is invalid or expired",
        });
      }


      if (
        decoded.purpose !==
        "password-reset"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid password reset token",
        });
      }


      const admin =
        await Admin.findById(
          decoded.id
        );


      if (!admin) {
        return res.status(404).json({
          success: false,
          message:
            "Admin not found",
        });
      }


      const sameAsOldPassword =
        await admin.matchPassword(
          newPassword
        );


      if (sameAsOldPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from current password",
        });
      }


      admin.password =
        newPassword;


      await admin.save();


      return res.status(200).json({
        success: true,

        message:
          "Password reset successfully. Please login with your new password.",
      });

    } catch (error) {

      console.error(
        "Reset Password Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };