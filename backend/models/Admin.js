const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // GYM REFERENCE
    // Trial system me har admin ek specific gym se linked hoga.
    // Existing testing admin ke liye abhi optional rakha hai.
    // =====================================================

    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: false,
      default: null,
    },

    password: {
      type: String,
      required: true,
    },

    // =========================================
    // SECURITY PIN
    // DB me plain PIN nahi,
    // sirf bcrypt hash store hoga.
    // =========================================

    securityPin: {
      type: String,
      default: null,
    },

    // =========================================
    // RECOVERY CODE
    // DB me plain recovery code nahi,
    // sirf bcrypt hash store hoga.
    // =========================================

    recoveryCode: {
      type: String,
      default: null,
    },

    // =========================================
    // SECURITY PIN ATTEMPTS
    // =========================================

    securityPinAttempts: {
      type: Number,
      default: 0,
    },

    securityPinLockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// PASSWORD COMPARE
// =====================================================

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// =====================================================
// SECURITY PIN COMPARE
// =====================================================

adminSchema.methods.matchSecurityPin = async function (enteredPin) {
  if (!this.securityPin) {
    return false;
  }

  return bcrypt.compare(enteredPin, this.securityPin);
};

// =====================================================
// RECOVERY CODE COMPARE
// =====================================================

adminSchema.methods.matchRecoveryCode = async function (enteredCode) {
  if (!this.recoveryCode) {
    return false;
  }

  return bcrypt.compare(enteredCode, this.recoveryCode);
};

// =====================================================
// HASH PASSWORD BEFORE SAVE
// =====================================================

adminSchema.pre("save", async function () {
  // Password change nahi hua,
  // to kuch nahi karna.
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Admin", adminSchema);