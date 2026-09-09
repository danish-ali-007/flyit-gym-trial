const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // Example: GYM001
    },

    // =====================================================
    // GYM REFERENCE
    // Har member kis gym ka hai
    // =====================================================

    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // Phone optional hai
    // Same phone multiple members ke liye allowed hai
    phone: {
      type: String,
      trim: true,
      default: "",
    },

    planName: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },

    planDurationMonths: {
      type: Number,
      required: [true, "Plan duration in months is required"],
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "Paid",
        "Partial",
        "Pending",
      ],
      default: "Pending",
    },

    membershipStatus: {
      type: String,
      enum: [
        "Active",
        "Expired",
        "Inactive",
      ],
      default: "Active",
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "Member",
  memberSchema
);