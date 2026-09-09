const mongoose = require("mongoose");

const membershipRenewalSchema = new mongoose.Schema(
  {
    // Trial system: renewal kis gym ka hai
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    member: {
      type: String,
      ref: "Member",
      required: true,
      index: true,
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    planDurationMonths: {
      type: Number,
      required: true,
      enum: [1, 3, 6, 12],
    },

    startDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
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
      enum: ["Paid", "Partial", "Pending"],
      default: "Pending",
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer"],
      default: "Cash",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Upcoming", "Activated", "Cancelled"],
      default: "Upcoming",
      index: true,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    requestId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "MembershipRenewal",
  membershipRenewalSchema
);