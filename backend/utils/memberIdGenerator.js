const Member = require("../models/Member");

const generateMemberId = async () => {
  const lastMember = await Member.findOne({
    _id: { $regex: /^GYM\d+$/ },
  }).sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastMember) {
    const currentNumber = parseInt(
      lastMember._id.replace("GYM", ""),
      10
    );

    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `GYM${String(nextNumber).padStart(3, "0")}`;
};

module.exports = generateMemberId;