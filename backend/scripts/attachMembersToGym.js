const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Member = require("../models/Member");
const Gym = require("../models/Gym");

dotenv.config();

const attachMembersToGym = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const gymId = "6aa0000f8e0b96417250e5eb";

    // Safety check
    const gym = await Gym.findById(gymId);

    if (!gym) {
      console.log("Gym not found");
      process.exit(1);
    }

    console.log("Gym:", gym.gymName);

    // Sirf un members ko attach karega
    // jinke paas abhi gymId nahi hai
    const result = await Member.updateMany(
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
      "Members matched:",
      result.matchedCount
    );

    console.log(
      "Members updated:",
      result.modifiedCount
    );

    console.log(
      "Members attached successfully"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "Attach members error:",
      error.message
    );

    process.exit(1);
  }
};

attachMembersToGym();