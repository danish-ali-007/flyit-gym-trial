const Member = require("../models/Member");
const MembershipRenewal = require(
  "../models/MembershipRenewal"
);


// =====================================================
// GET TODAY START IN INDIA TIME
// =====================================================

const getISTTodayStart = () => {
  const IST_OFFSET_MS =
    5.5 * 60 * 60 * 1000;

  const now = new Date();

  const istNow =
    new Date(
      now.getTime() +
        IST_OFFSET_MS
    );

  return new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate()
    ) - IST_OFFSET_MS
  );
};


// =====================================================
// ACTIVATE UPCOMING RENEWALS
// =====================================================

const activateUpcomingRenewals =
  async () => {
    try {

      const today =
        getISTTodayStart();


      // All gyms ke due upcoming renewals
      // scheduler automatically process karega
      const renewals =
        await MembershipRenewal.find({
          status: "Upcoming",

          startDate: {
            $lte: today,
          },
        }).sort({
          startDate: 1,
        });


      let activatedCount = 0;


      for (const renewal of renewals) {

        try {

          // Renewal ke gym ka hi member
          const member =
            await Member.findOne({
              _id:
                renewal.member,

              gymId:
                renewal.gymId,
            });


          if (!member) {

            console.error(
              `Member not found for upcoming renewal: ${renewal.member}`
            );

            continue;
          }


          // =========================================
          // PROMOTE UPCOMING → CURRENT MEMBERSHIP
          // =========================================

          member.planName =
            renewal.planName;

          member.planDurationMonths =
            renewal.planDurationMonths;

          member.totalAmount =
            renewal.totalAmount;

          member.paidAmount =
            renewal.paidAmount;

          member.pendingAmount =
            renewal.pendingAmount;

          member.paymentStatus =
            renewal.paymentStatus;

          member.membershipStatus =
            "Active";

          member.joiningDate =
            renewal.startDate;

          member.expiryDate =
            renewal.expiryDate;


          await member.save();


          // =========================================
          // MARK RENEWAL AS ACTIVATED
          // =========================================

          renewal.status =
            "Activated";

          await renewal.save();


          activatedCount += 1;


          console.log(
            `Upcoming renewal activated: ${member._id}`
          );

        } catch (renewalError) {

          console.error(
            `Failed to activate renewal ${renewal._id}:`,
            renewalError.message
          );

        }
      }


      console.log(
        `Upcoming renewals activated: ${activatedCount}`
      );


      return activatedCount;

    } catch (error) {

      console.error(
        "Upcoming Renewal Activation Error:",
        error
      );

      return 0;
    }
  };


module.exports =
  activateUpcomingRenewals;