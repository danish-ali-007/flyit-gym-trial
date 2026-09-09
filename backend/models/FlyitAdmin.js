const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const flyitAdminSchema = new mongoose.Schema(
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

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["superadmin"],
      default: "superadmin",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


// =====================================================
// PASSWORD COMPARE
// =====================================================

flyitAdminSchema.methods.matchPassword =
  async function (enteredPassword) {
    return bcrypt.compare(
      enteredPassword,
      this.password
    );
  };


// =====================================================
// HASH PASSWORD BEFORE SAVE
// =====================================================

flyitAdminSchema.pre(
  "save",
  async function () {
    if (
      !this.isModified(
        "password"
      )
    ) {
      return;
    }

    const salt =
      await bcrypt.genSalt(10);

    this.password =
      await bcrypt.hash(
        this.password,
        salt
      );
  }
);


module.exports =
  mongoose.model(
    "FlyitAdmin",
    flyitAdminSchema
  );