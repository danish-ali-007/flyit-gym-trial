const jwt = require("jsonwebtoken");

const FlyitAdmin = require("../models/FlyitAdmin");


// =====================================================
// PROTECT FLYIT ADMIN ROUTES
// =====================================================

const protectFlyitAdmin = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Flyit Admin authentication required",
      });
    }


    const token =
      authHeader.split(" ")[1];


    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message:
          "JWT secret is not configured",
      });
    }


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    // Only Flyit admin token
    if (
      decoded.type !==
        "flyit-admin" ||
      decoded.role !==
        "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Flyit Admin access only",
      });
    }


    const admin =
      await FlyitAdmin.findById(
        decoded.id
      ).select(
        "_id name email role"
      );


    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Flyit Admin account not found",
      });
    }


    req.flyitAdmin = {
      id:
        admin._id.toString(),

      name:
        admin.name,

      email:
        admin.email,

      role:
        admin.role,
    };


    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired Flyit Admin token",
    });
  }
};


module.exports = {
  protectFlyitAdmin,
};