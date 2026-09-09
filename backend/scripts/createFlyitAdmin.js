const mongoose = require("mongoose");
const dotenv = require("dotenv");

const FlyitAdmin = require("../models/FlyitAdmin");

dotenv.config();

const createFlyitAdmin = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("MongoDB Connected");


    // ==========================================
    // FLYIT ADMIN CREDENTIALS
    // YAHI TUMHARA MAIN SUPER ADMIN LOGIN HOGA
    // ==========================================

    const name =
      "Flyit Admin";

    const email =
      "admin@flyitsystems.com";

    const password =
      "Flyit@12345";


    // ==========================================
    // CHECK EXISTING ADMIN
    // ==========================================

    const existingAdmin =
      await FlyitAdmin.findOne({
        email:
          email
            .toLowerCase()
            .trim(),
      });


    if (existingAdmin) {
      console.log(
        "Flyit Admin already exists"
      );

      console.log(
        "Email:",
        existingAdmin.email
      );

      process.exit(0);
    }


    // ==========================================
    // CREATE ADMIN
    // Password automatically bcrypt hash hoga
    // ==========================================

    const admin =
      await FlyitAdmin.create({
        name,

        email:
          email
            .toLowerCase()
            .trim(),

        password,

        role:
          "superadmin",
      });


    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      "FLYIT ADMIN CREATED"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Name:",
      admin.name
    );

    console.log(
      "Email:",
      admin.email
    );

    console.log(
      "Password:",
      password
    );

    console.log(
      "Role:",
      admin.role
    );

    console.log(
      "======================================"
    );


    process.exit(0);

  } catch (error) {

    console.error(
      "Create Flyit Admin Error:",
      error.message
    );

    process.exit(1);
  }
};


createFlyitAdmin();