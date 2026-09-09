const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Trial system: payment kis gym ka hai
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    member: {
      type: String,
      ref: "Member",
      required: [true, "Member ID is required"],
      index: true,
    },

    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Card",
        "Bank Transfer",
      ],
      default: "Cash",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "Payment Received",
    },

    requestId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);