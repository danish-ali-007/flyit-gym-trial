const Member = require("../models/Member");
const Payment = require("../models/Payment");


// =====================================================
// DATE HELPERS
// =====================================================

const getTodayStart = () => {
  const date = new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
};


const addDays = (
  date,
  days
) => {
  const next =
    new Date(date);

  next.setDate(
    next.getDate() +
      days
  );

  return next;
};


const subtractDays = (
  date,
  days
) => {
  return addDays(
    date,
    -days
  );
};


// =====================================================
// DEMO MEMBER ID
// =====================================================

const createDemoMemberId = (
  gymId,
  serial
) => {
  const gymPart =
    String(gymId)
      .slice(-6)
      .toUpperCase();

  const number =
    String(serial)
      .padStart(
        3,
        "0"
      );

  return `DEMO-${gymPart}-${number}`;
};


// =====================================================
// DEMO PAYMENT REQUEST ID
// =====================================================

const createDemoRequestId = (
  gymId,
  serial
) => {
  return `TRIAL-DEMO-${String(
    gymId
  )}-${serial}`;
};


// =====================================================
// SEED TRIAL DEMO DATA
// =====================================================

const seedTrialDemoData =
  async (gymId) => {
    if (!gymId) {
      throw new Error(
        "Gym ID is required to seed trial demo data"
      );
    }


    // =================================================
    // DUPLICATE SAFETY
    // =================================================

    const existingDemoMembers =
      await Member.countDocuments({
        gymId,

        _id: {
          $regex:
            /^DEMO-/,
        },
      });


    if (
      existingDemoMembers > 0
    ) {
      console.log(
        `Trial demo data already exists for gym ${gymId}`
      );

      return {
        membersCreated: 0,
        paymentsCreated: 0,
        skipped: true,
      };
    }


    const today =
      getTodayStart();


    // =================================================
    // 10 DEMO MEMBERS
    // =================================================

    const demoMembers = [

      {
        name:
          "Aarav Sharma",

        phone:
          "9876500001",

        planName:
          "Monthly",

        planDurationMonths:
          1,

        totalAmount:
          1500,

        paidAmount:
          1500,

        pendingAmount:
          0,

        paymentStatus:
          "Paid",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            10
          ),

        expiryDate:
          addDays(
            today,
            20
          ),

        paymentMethod:
          "UPI",
      },


      {
        name:
          "Rohan Verma",

        phone:
          "9876500002",

        planName:
          "3 Months",

        planDurationMonths:
          3,

        totalAmount:
          4500,

        paidAmount:
          2500,

        pendingAmount:
          2000,

        paymentStatus:
          "Partial",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            25
          ),

        expiryDate:
          addDays(
            today,
            65
          ),

        paymentMethod:
          "Cash",
      },


      {
        name:
          "Aditya Patel",

        phone:
          "9876500003",

        planName:
          "Monthly",

        planDurationMonths:
          1,

        totalAmount:
          1800,

        paidAmount:
          0,

        pendingAmount:
          1800,

        paymentStatus:
          "Pending",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            5
          ),

        expiryDate:
          addDays(
            today,
            25
          ),

        paymentMethod:
          null,
      },


      {
        name:
          "Vikas Singh",

        phone:
          "9876500004",

        planName:
          "Monthly",

        planDurationMonths:
          1,

        totalAmount:
          1500,

        paidAmount:
          1500,

        pendingAmount:
          0,

        paymentStatus:
          "Paid",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            30
          ),

        expiryDate:
          new Date(today),

        paymentMethod:
          "Cash",
      },


      {
        name:
          "Rahul Yadav",

        phone:
          "9876500005",

        planName:
          "Monthly",

        planDurationMonths:
          1,

        totalAmount:
          1600,

        paidAmount:
          1600,

        pendingAmount:
          0,

        paymentStatus:
          "Paid",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            29
          ),

        expiryDate:
          addDays(
            today,
            1
          ),

        paymentMethod:
          "UPI",
      },


      {
        name:
          "Mohit Sahu",

        phone:
          "9876500006",

        planName:
          "Monthly",

        planDurationMonths:
          1,

        totalAmount:
          1500,

        paidAmount:
          1000,

        pendingAmount:
          500,

        paymentStatus:
          "Partial",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            27
          ),

        expiryDate:
          addDays(
            today,
            3
          ),

        paymentMethod:
          "Cash",
      },


      {
        name:
          "Kunal Jain",

        phone:
          "9876500007",

        planName:
          "Monthly",

        planDurationMonths:
          1,

        totalAmount:
          1500,

        paidAmount:
          1500,

        pendingAmount:
          0,

        paymentStatus:
          "Paid",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            23
          ),

        expiryDate:
          addDays(
            today,
            7
          ),

        paymentMethod:
          "UPI",
      },


      {
        name:
          "Nikhil Gupta",

        phone:
          "9876500008",

        planName:
          "Monthly",

        planDurationMonths:
          1,

        totalAmount:
          1400,

        paidAmount:
          1400,

        pendingAmount:
          0,

        paymentStatus:
          "Paid",

        membershipStatus:
          "Expired",

        joiningDate:
          subtractDays(
            today,
            40
          ),

        expiryDate:
          subtractDays(
            today,
            10
          ),

        paymentMethod:
          "Cash",
      },


      {
        name:
          "Sahil Khan",

        phone:
          "9876500009",

        planName:
          "6 Months",

        planDurationMonths:
          6,

        totalAmount:
          7500,

        paidAmount:
          7500,

        pendingAmount:
          0,

        paymentStatus:
          "Paid",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            60
          ),

        expiryDate:
          addDays(
            today,
            120
          ),

        paymentMethod:
          "Card",
      },


      {
        name:
          "Arjun Mehta",

        phone:
          "9876500010",

        planName:
          "12 Months",

        planDurationMonths:
          12,

        totalAmount:
          12000,

        paidAmount:
          9000,

        pendingAmount:
          3000,

        paymentStatus:
          "Partial",

        membershipStatus:
          "Active",

        joiningDate:
          subtractDays(
            today,
            90
          ),

        expiryDate:
          addDays(
            today,
            275
          ),

        paymentMethod:
          "Bank Transfer",
      },
    ];


    let membersCreated =
      0;

    let paymentsCreated =
      0;


    const createdMemberIds =
      [];


    try {

      // =================================================
      // CREATE MEMBERS + PAYMENTS
      // =================================================

      for (
        let index = 0;
        index <
        demoMembers.length;
        index++
      ) {

        const demo =
          demoMembers[index];


        const serial =
          index + 1;


        const memberId =
          createDemoMemberId(
            gymId,
            serial
          );


        const member =
          await Member.create({
            _id:
              memberId,

            gymId,

            name:
              demo.name,

            phone:
              demo.phone,

            planName:
              demo.planName,

            planDurationMonths:
              demo.planDurationMonths,

            totalAmount:
              demo.totalAmount,

            paidAmount:
              demo.paidAmount,

            pendingAmount:
              demo.pendingAmount,

            paymentStatus:
              demo.paymentStatus,

            membershipStatus:
              demo.membershipStatus,

            joiningDate:
              demo.joiningDate,

            expiryDate:
              demo.expiryDate,
          });


        createdMemberIds.push(
          member._id
        );


        membersCreated +=
          1;


        if (
          demo.paidAmount > 0
        ) {

          await Payment.create({
            gymId,

            member:
              member._id,

            amountPaid:
              demo.paidAmount,

            paymentMethod:
              demo.paymentMethod ||
              "Cash",

            paymentDate:
              demo.joiningDate,

            remarks:
              "Trial Demo Payment",

            requestId:
              createDemoRequestId(
                gymId,
                serial
              ),
          });


          paymentsCreated +=
            1;
        }
      }


      console.log(
        `Trial demo data seeded for gym ${gymId}`
      );


      console.log(
        `Members created: ${membersCreated}`
      );


      console.log(
        `Payments created: ${paymentsCreated}`
      );


      return {
        membersCreated,
        paymentsCreated,
        skipped: false,
      };

    } catch (error) {

      console.error(
        "Trial Demo Seed Error:",
        error
      );


      // =================================================
      // CLEANUP IF PARTIAL SEED FAILS
      // =================================================

      await Payment.deleteMany({
        gymId,

        requestId: {
          $regex:
            `^TRIAL-DEMO-${String(
              gymId
            )}-`,
        },
      });


      if (
        createdMemberIds.length >
        0
      ) {

        await Member.deleteMany({
          gymId,

          _id: {
            $in:
              createdMemberIds,
          },
        });
      }


      throw error;
    }
  };


module.exports =
  seedTrialDemoData;