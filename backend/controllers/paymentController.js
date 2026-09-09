const Payment = require("../models/Payment");
const Member = require("../models/Member");
const MembershipRenewal = require("../models/MembershipRenewal");


// =====================================================
// HELPER: CHECK DUPLICATE REQUEST
// =====================================================

const findDuplicateRequest = async (
  requestId,
  gymId
) => {
  if (!requestId) {
    return null;
  }

  const payment =
    await Payment.findOne({
      gymId,
      requestId,
    });

  if (payment) {
    return payment;
  }

  return MembershipRenewal.findOne({
    gymId,
    requestId,
  });
};


// =====================================================
// TODAY - INDIA DATE START
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
    ) -
      IST_OFFSET_MS
  );
};


// =====================================================
// NORMALIZE DATE TO IST DATE START
// =====================================================

const getISTDateStart = (date) => {
  const IST_OFFSET_MS =
    5.5 * 60 * 60 * 1000;

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return null;
  }

  const istDate =
    new Date(
      parsedDate.getTime() +
        IST_OFFSET_MS
    );

  return new Date(
    Date.UTC(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate()
    ) -
      IST_OFFSET_MS
  );
};


// =====================================================
// ADD MONTHS SAFELY
// =====================================================

const addMonths = (
  date,
  months
) => {
  const IST_OFFSET_MS =
    5.5 * 60 * 60 * 1000;

  const istDate =
    new Date(
      date.getTime() +
        IST_OFFSET_MS
    );

  const currentYear =
    istDate.getUTCFullYear();

  const currentMonth =
    istDate.getUTCMonth();

  const currentDay =
    istDate.getUTCDate();

  const rawTargetMonth =
    currentMonth +
    Number(months);

  const targetYear =
    currentYear +
    Math.floor(
      rawTargetMonth / 12
    );

  const targetMonth =
    ((rawTargetMonth % 12) + 12) %
    12;

  const lastDayOfTargetMonth =
    new Date(
      Date.UTC(
        targetYear,
        targetMonth + 1,
        0
      )
    ).getUTCDate();

  const targetDay =
    Math.min(
      currentDay,
      lastDayOfTargetMonth
    );

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay
    ) -
      IST_OFFSET_MS
  );
};


// =====================================================
// PAYMENT STATUS
// =====================================================

const calculatePaymentStatus = (
  total,
  paid
) => {
  const pending =
    Math.max(
      total - paid,
      0
    );

  let status = "Pending";

  if (paid >= total) {
    status = "Paid";
  } else if (paid > 0) {
    status = "Partial";
  }

  return {
    pending,
    status,
  };
};


// =====================================================
// RECORD NORMAL PAYMENT
// POST /api/payments
// =====================================================

exports.recordPayment = async (req, res) => {
  try {
    const gymId =
      req.admin?.gymId;

    if (!gymId) {
      return res.status(403).json({
        success: false,
        message:
          "Gym account is not configured",
      });
    }

    const {
      memberId,
      amountPaid,
      paymentMethod = "Cash",
      remarks = "Payment Received",
      requestId,
    } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          "requestId is required",
      });
    }

    const duplicateRequest =
      await findDuplicateRequest(
        requestId,
        gymId
      );

    if (duplicateRequest) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate payment request detected.",
      });
    }

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message:
          "Member ID is required",
      });
    }

    const member =
      await Member.findOne({
        _id: memberId,
        gymId,
      });

    if (!member) {
      return res.status(404).json({
        success: false,
        message:
          "Member not found",
      });
    }

    const numericAmountPaid =
      Number(amountPaid);

    if (
      Number.isNaN(
        numericAmountPaid
      ) ||
      numericAmountPaid <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid amount",
      });
    }

    if (
      Number(
        member.pendingAmount || 0
      ) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fees are already fully paid for this member",
      });
    }

    if (
      numericAmountPaid >
      Number(
        member.pendingAmount
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Amount exceeds pending balance. Remaining pending fee is Rs. ${member.pendingAmount}`,
      });
    }

    const payment =
      await Payment.create({
        gymId,

        member:
          member._id,

        amountPaid:
          numericAmountPaid,

        paymentMethod,

        remarks,

        requestId,
      });

    const oldPaid =
      Number(
        member.paidAmount || 0
      );

    const total =
      Number(
        member.totalAmount || 0
      );

    const newPaid =
      oldPaid +
      numericAmountPaid;

    const {
      pending,
      status,
    } =
      calculatePaymentStatus(
        total,
        newPaid
      );

    member.paidAmount =
      newPaid;

    member.pendingAmount =
      pending;

    member.paymentStatus =
      status;

    await member.save();

    return res.status(201).json({
      success: true,

      message:
        "Payment recorded successfully",

      data: {
        payment,

        updatedMember: {
          id:
            member._id,

          name:
            member.name,

          totalAmount:
            member.totalAmount,

          paidAmount:
            member.paidAmount,

          pendingAmount:
            member.pendingAmount,

          paymentStatus:
            member.paymentStatus,
        },
      },
    });

  } catch (error) {

    console.error(
      "Record Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};


// =====================================================
// GET PAYMENT HISTORY
// =====================================================

exports.getMemberPaymentHistory =
  async (req, res) => {
    try {
      const gymId =
        req.admin?.gymId;

      if (!gymId) {
        return res.status(403).json({
          success: false,
          message:
            "Gym account is not configured",
        });
      }

      const member =
        await Member.findOne({
          _id:
            req.params.memberId,

          gymId,
        });

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found",
        });
      }

      const payments =
        await Payment.find({
          gymId,

          member:
            member._id,
        }).sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,

        count:
          payments.length,

        member: {
          id:
            member._id,

          name:
            member.name,

          totalAmount:
            member.totalAmount,

          paidAmount:
            member.paidAmount,

          pendingAmount:
            member.pendingAmount,

          paymentStatus:
            member.paymentStatus,
        },

        data:
          payments,
      });

    } catch (error) {

      console.error(
        "Payment History Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// GET UPCOMING RENEWAL
// =====================================================

exports.getUpcomingRenewal =
  async (req, res) => {
    try {
      const gymId =
        req.admin?.gymId;

      if (!gymId) {
        return res.status(403).json({
          success: false,
          message:
            "Gym account is not configured",
        });
      }

      const member =
        await Member.findOne({
          _id:
            req.params.memberId,

          gymId,
        });

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found",
        });
      }

      const renewal =
        await MembershipRenewal.findOne({
          gymId,

          member:
            member._id,

          status:
            "Upcoming",
        }).sort({
          startDate: 1,
        });

      return res.status(200).json({
        success: true,
        data:
          renewal || null,
      });

    } catch (error) {

      console.error(
        "Upcoming Renewal Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// RENEW MEMBERSHIP
// =====================================================

exports.renewMembership =
  async (req, res) => {
    try {
      const gymId =
        req.admin?.gymId;

      if (!gymId) {
        return res.status(403).json({
          success: false,
          message:
            "Gym account is not configured",
        });
      }

      const {
        planName,

        planDurationMonths,

        totalAmount,

        paidAmount = 0,

        paymentMethod =
          "Cash",

        renewalStartMode =
          "continue",

        customStartDate,

        remarks = "",

        requestId,
      } = req.body;


      // ==========================================
      // REQUEST ID
      // ==========================================

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message:
            "requestId is required",
        });
      }


      const duplicateRequest =
        await findDuplicateRequest(
          requestId,
          gymId
        );


      if (duplicateRequest) {
        return res.status(409).json({
          success: false,
          message:
            "Duplicate renewal request detected.",
        });
      }


      // ==========================================
      // MEMBER
      // ==========================================

      const member =
        await Member.findOne({
          _id:
            req.params.memberId,

          gymId,
        });


      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found",
        });
      }


      // ==========================================
      // VALUES
      // ==========================================

      const duration =
        Number(
          planDurationMonths
        );

      const newTotal =
        Number(
          totalAmount
        );

      const newPaid =
        Number(
          paidAmount || 0
        );


      if (
        ![
          1,
          3,
          6,
          12,
        ].includes(
          duration
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Plan duration must be 1, 3, 6 or 12 months",
        });
      }


      if (
        Number.isNaN(
          newTotal
        ) ||
        newTotal < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid total amount",
        });
      }


      if (
        Number.isNaN(
          newPaid
        ) ||
        newPaid < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid paid amount",
        });
      }


      if (
        newPaid >
        newTotal
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Paid amount cannot exceed total amount",
        });
      }


      const allowedModes = [
        "continue",
        "today",
        "custom",
      ];


      if (
        !allowedModes.includes(
          renewalStartMode
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid renewal start mode",
        });
      }


      // ==========================================
      // DATES
      // ==========================================

      const today =
        getISTTodayStart();


      const previousExpiry =
        getISTDateStart(
          member.expiryDate
        );


      if (!previousExpiry) {
        return res.status(400).json({
          success: false,
          message:
            "Current expiry date is invalid",
        });
      }


      const isCurrentlyActive =
        previousExpiry >
        today;


      // ==========================================
      // CHECK EXISTING UPCOMING
      // ==========================================

      const existingUpcoming =
        await MembershipRenewal.findOne({
          gymId,

          member:
            member._id,

          status:
            "Upcoming",
        });


      // ==========================================
      // DETERMINE START DATE
      // ==========================================

      let membershipStartDate;

      let shouldCreateUpcoming =
        false;


      // ==========================================
      // CONTINUE
      // ==========================================

      if (
        renewalStartMode ===
        "continue"
      ) {
        membershipStartDate =
          previousExpiry;


        // Active member = advance
        if (isCurrentlyActive) {
          shouldCreateUpcoming =
            true;
        }
      }


      // ==========================================
      // START TODAY
      // ==========================================

      else if (
        renewalStartMode ===
        "today"
      ) {

        if (isCurrentlyActive) {
          return res.status(400).json({
            success: false,

            message:
              "Member is currently active. Use Continue or Custom Start Date for advance renewal.",
          });
        }


        membershipStartDate =
          today;
      }


      // ==========================================
      // CUSTOM START DATE
      // ==========================================

      else {

        if (!customStartDate) {
          return res.status(400).json({
            success: false,

            message:
              "Custom start date is required",
          });
        }


        const normalizedCustomDate =
          getISTDateStart(
            customStartDate
          );


        if (!normalizedCustomDate) {
          return res.status(400).json({
            success: false,

            message:
              "Custom start date is invalid",
          });
        }


        // Never overlap previous membership
        if (
          normalizedCustomDate <
          previousExpiry
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Custom start date cannot be before current membership expiry date.",
          });
        }


        membershipStartDate =
          normalizedCustomDate;


        // Future date means upcoming renewal
        if (
          normalizedCustomDate >
          today
        ) {
          shouldCreateUpcoming =
            true;
        }
      }


      // ==========================================
      // NEW EXPIRY
      // ==========================================

      const newExpiry =
        addMonths(
          membershipStartDate,
          duration
        );


      const {
        pending:
          newPending,

        status:
          newPaymentStatus,
      } =
        calculatePaymentStatus(
          newTotal,
          newPaid
        );


      // ==========================================
      // UPCOMING / ADVANCE RENEWAL
      // ==========================================

      if (shouldCreateUpcoming) {

        if (existingUpcoming) {
          return res.status(400).json({
            success: false,

            message:
              "An upcoming renewal already exists for this member.",
          });
        }


        if (
          isCurrentlyActive &&
          Number(
            member.pendingAmount || 0
          ) > 0
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Please clear current membership pending amount before advance renewal.",
          });
        }


        const upcomingRenewal =
          await MembershipRenewal.create({
            gymId,

            member:
              member._id,

            planName:
              planName ||
              member.planName,

            planDurationMonths:
              duration,

            startDate:
              membershipStartDate,

            expiryDate:
              newExpiry,

            totalAmount:
              newTotal,

            paidAmount:
              newPaid,

            pendingAmount:
              newPending,

            paymentStatus:
              newPaymentStatus,

            paymentMethod,

            remarks:
              remarks.trim() ||
              "Advance membership renewal",

            status:
              "Upcoming",

            paymentDate:
              new Date(),

            requestId,
          });


        let renewalPayment =
          null;


        if (newPaid > 0) {

          renewalPayment =
            await Payment.create({
              gymId,

              member:
                member._id,

              amountPaid:
                newPaid,

              paymentMethod,

              remarks:
                remarks.trim() ||
                "Advance Membership Renewal Payment",

              requestId:
                `${requestId}-payment`,
            });
        }


        return res.status(200).json({
          success: true,

          message:
            "Upcoming renewal saved successfully",

          data: {
            member,

            upcomingRenewal,

            payment:
              renewalPayment,

            renewalType:
              "advance",
          },
        });
      }


      // ==========================================
      // IMMEDIATE RENEWAL
      // ==========================================

      member.planName =
        planName ||
        member.planName;

      member.planDurationMonths =
        duration;

      member.totalAmount =
        newTotal;

      member.paidAmount =
        newPaid;

      member.pendingAmount =
        newPending;

      member.paymentStatus =
        newPaymentStatus;

      member.membershipStatus =
        "Active";

      member.joiningDate =
        membershipStartDate;

      member.expiryDate =
        newExpiry;


      await member.save();


      // ==========================================
      // PAYMENT
      // ==========================================

      let renewalPayment =
        null;


      if (newPaid > 0) {

        renewalPayment =
          await Payment.create({
            gymId,

            member:
              member._id,

            amountPaid:
              newPaid,

            paymentMethod,

            remarks:
              remarks.trim() ||
              "Membership Renewal Payment",

            requestId,
          });
      }


      return res.status(200).json({
        success: true,

        message:
          "Membership renewed successfully",

        data: {
          member,

          payment:
            renewalPayment,

          renewalType:
            "immediate",

          renewalInfo: {
            renewalStartMode,

            membershipStartDate,

            newExpiry,

            paymentDate:
              new Date(),

            remarks:
              remarks.trim(),
          },
        },
      });

    } catch (error) {

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,

          message:
            "Duplicate renewal request detected.",
        });
      }


      console.error(
        "Renew Membership Error:",
        error
      );


      return res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };