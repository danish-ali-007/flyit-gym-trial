const mongoose = require("mongoose");
const dotenv = require("dotenv");

const MembershipRenewal = require("../models/MembershipRenewal");
const Gym = require("../models/Gym");

dotenv.config();

const attachRenewalsToGym = async () => {
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

    const result = await MembershipRenewal.updateMany(
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
      "Renewals matched:",
      result.matchedCount
    );

    console.log(
      "Renewals updated:",
      result.modifiedCount
    );

    console.log(
      "Renewals attached successfully"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "Attach renewals error:",
      error.message
    );

    process.exit(1);
  }
};

attachRenewalsToGym();