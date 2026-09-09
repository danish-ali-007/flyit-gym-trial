const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Payment = require("../models/Payment");
const Gym = require("../models/Gym");

dotenv.config();

const attachPaymentsToGym = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const gymId = "6aa0000f8e0b96417250e5eb";

    const gym = await Gym.findById(gymId);

    if (!gym) {
      console.log("Gym not found");
      process.exit(1);
    }

    console.log("Gym:", gym.gymName);

    const result = await Payment.updateMany(
      {
        $or: [
          { gymId: { $exists: false } },
          { gymId: null },
        ],
      },
      {
        $set: {
          gymId: gym._id,
        },
      }
    );

    console.log(
      "Payments matched:",
      result.matchedCount
    );

    console.log(
      "Payments updated:",
      result.modifiedCount
    );

    console.log(
      "Payments attached successfully"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "Attach payments error:",
      error.message
    );

    process.exit(1);
  }
};

attachPaymentsToGym();