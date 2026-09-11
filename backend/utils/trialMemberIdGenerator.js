const Member = require("../models/Member");
const Gym = require("../models/Gym");


// =====================================================
// BUILD SAFE GYM PREFIX
// Example:
// Abhay Gym -> ABH
// Power House Gym -> POW
// =====================================================

const buildGymPrefix = (
  gymName
) => {
  const cleaned =
    String(
      gymName || "GYM"
    )
      .replace(
        /[^A-Za-z0-9]/g,
        ""
      )
      .toUpperCase();


  return cleaned
    .slice(0, 3)
    .padEnd(
      3,
      "X"
    );
};


// =====================================================
// GENERATE TRIAL MEMBER ID
//
// IMPORTANT:
// Normal admin ke memberIdGenerator.js se
// iska koi connection nahi hai.
//
// Format:
// ABH9518-001
// ABH9518-002
//
// Gym name + gymId suffix use karne ka reason:
// MongoDB _id globally unique hota hai.
// =====================================================

const generateTrialMemberId =
  async (
    gymId,
    gymName = ""
  ) => {

    if (!gymId) {
      throw new Error(
        "Gym ID is required to generate trial member ID"
      );
    }


    let resolvedGymName =
      gymName;


    // Agar controller ne gymName pass nahi kiya
    // to DB se gym name le lenge.
    if (!resolvedGymName) {

      const gym =
        await Gym.findById(
          gymId
        ).select(
          "gymName"
        );


      if (!gym) {
        throw new Error(
          "Gym not found"
        );
      }


      resolvedGymName =
        gym.gymName;
    }


    const prefix =
      buildGymPrefix(
        resolvedGymName
      );


    // Mongo gym id ke last 4 characters
    // globally unique-looking member ID ke liye.
    const gymPart =
      String(gymId)
        .slice(-4)
        .toUpperCase();


    const idPrefix =
      `${prefix}${gymPart}-`;


    const escapedPrefix =
      idPrefix.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );


    // Current trial gym ke existing
    // trial member IDs hi check honge.
    const existingMembers =
      await Member.find({
        gymId,

        _id: {
          $regex:
            new RegExp(
              `^${escapedPrefix}\\d+$`
            ),
        },
      })
        .select("_id")
        .lean();


    let highestNumber =
      0;


    for (
      const member
      of existingMembers
    ) {

      const numberPart =
        String(
          member._id
        ).slice(
          idPrefix.length
        );


      const currentNumber =
        parseInt(
          numberPart,
          10
        );


      if (
        !Number.isNaN(
          currentNumber
        ) &&
        currentNumber >
          highestNumber
      ) {

        highestNumber =
          currentNumber;
      }
    }


    let nextNumber =
      highestNumber + 1;


    // Extra global _id collision safety.
    while (true) {

      const candidate =
        `${idPrefix}${String(
          nextNumber
        ).padStart(
          3,
          "0"
        )}`;


      const exists =
        await Member.exists({
          _id:
            candidate,
        });


      if (!exists) {
        return candidate;
      }


      nextNumber +=
        1;
    }
  };


module.exports =
  generateTrialMemberId;