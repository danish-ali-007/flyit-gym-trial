const mongoose = require("mongoose");

const gymSchema = new mongoose.Schema(
  {
    gymName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // UNIQUE TRIAL ACCESS TOKEN
    // Client ko password ki jagah unique link milega
    // =====================================================

    trialToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },

    trialStart: {
      type: Date,
      default: Date.now,
    },

    trialEnd: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "trial",
        "expired",
        "disabled",
      ],
      default: "trial",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Gym",
    gymSchema
  );