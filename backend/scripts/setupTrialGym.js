const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Gym = require("../models/Gym");
const Admin = require("../models/Admin");

dotenv.config();

const setupTrialGym = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("MongoDB Connected");

    const adminEmail =
      process.env.DEFAULT_ADMIN_EMAIL;

    if (!adminEmail) {
      throw new Error(
        "DEFAULT_ADMIN_EMAIL missing in .env"
      );
    }

    // ==========================================
    // FIND TEST ADMIN
    // ==========================================

    const admin =
      await Admin.findOne({
        email: adminEmail
          .toLowerCase()
          .trim(),
      });

    if (!admin) {
      throw new Error(
        "Default admin not found"
      );
    }

    // ==========================================
    // CHECK IF ALREADY LINKED
    // ==========================================

    if (admin.gymId) {
      const existingGym =
        await Gym.findById(
          admin.gymId
        );

      console.log(
        "Admin already linked to gym:",
        existingGym?.gymName ||
          admin.gymId
      );

      process.exit(0);
    }

    // ==========================================
    // 3 DAY TRIAL
    // ==========================================

    const trialStart =
      new Date();

    const trialEnd =
      new Date();

    trialEnd.setDate(
      trialEnd.getDate() + 3
    );

    // ==========================================
    // CREATE GYM
    // ==========================================

    const gym =
      await Gym.create({
        gymName:
          "Flyit Test Gym",

        ownerName:
          admin.name ||
          "Test Owner",

        phone:
          admin.phone ||
          "9999999999",

        trialStart,

        trialEnd,

        status:
          "trial",
      });

    // ==========================================
    // LINK ADMIN
    // ==========================================

    admin.gymId =
      gym._id;

    await admin.save();

    console.log(
      "Trial gym created successfully"
    );

    console.log(
      "Gym ID:",
      gym._id.toString()
    );

    console.log(
      "Gym:",
      gym.gymName
    );

    console.log(
      "Admin:",
      admin.email
    );

    console.log(
      "Trial End:",
      gym.trialEnd
    );

    process.exit(0);

  } catch (error) {

    console.error(
      "Setup Error:",
      error.message
    );

    process.exit(1);
  }
};

setupTrialGym();