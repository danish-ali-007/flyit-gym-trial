const mongoose = require("mongoose");

const Member = require("../models/Member");
const Payment = require("../models/Payment");


exports.getReports = async (req, res) => {
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

    const gymObjectId =
      new mongoose.Types.ObjectId(
        gymId
      );


    const now = new Date();


    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );


    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );


    // =========================================
    // ACTIVE / EXPIRED
    // =========================================

    const activeMembers =
      await Member.countDocuments({
        gymId,
        membershipStatus: "Active",
      });


    const expiredMembers =
      await Member.countDocuments({
        gymId,
        membershipStatus: "Expired",
      });


    // =========================================
    // PENDING PAYMENT TOTAL
    // =========================================

    const pendingAggregation =
      await Member.aggregate([
        {
          $match: {
            gymId:
              gymObjectId,
          },
        },

        {
          $group: {
            _id: null,

            totalPending: {
              $sum:
                "$pendingAmount",
            },
          },
        },
      ]);


    const pendingPayments =
      pendingAggregation[0]
        ?.totalPending || 0;


    // =========================================
    // MONTHLY REVENUE
    // =========================================

    const monthlyRevenueAggregation =
      await Payment.aggregate([
        {
          $match: {
            gymId:
              gymObjectId,

            createdAt: {
              $gte:
                startOfMonth,

              $lt:
                startOfNextMonth,
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum:
                "$amountPaid",
            },
          },
        },
      ]);


    const monthlyRevenue =
      monthlyRevenueAggregation[0]
        ?.total || 0;


    // =========================================
    // PLAN BREAKDOWN
    // =========================================

    const planBreakdownRaw =
      await Member.aggregate([
        {
          $match: {
            gymId:
              gymObjectId,
          },
        },

        {
          $group: {
            _id:
              "$planName",

            count: {
              $sum: 1,
            },

            revenue: {
              $sum:
                "$paidAmount",
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);


    const planBreakdown =
      planBreakdownRaw.map(
        (plan) => ({
          name:
            plan._id ||
            "Unknown Plan",

          count:
            plan.count ||
            0,

          revenue:
            plan.revenue ||
            0,
        })
      );


    // =========================================
    // PENDING MEMBERS LIST
    // =========================================

    const pendingMembers =
      await Member.find({
        gymId,

        pendingAmount: {
          $gt: 0,
        },
      })
        .select(
          "_id name phone pendingAmount expiryDate paymentStatus"
        )
        .sort({
          pendingAmount: -1,
        });


    const pendingList =
      pendingMembers.map(
        (member) => ({
          _id:
            member._id,

          name:
            member.name,

          phone:
            member.phone,

          pendingAmount:
            member.pendingAmount,

          paymentStatus:
            member.paymentStatus,

          dueDate:
            member.expiryDate,
        })
      );


    return res.status(200).json({
      success: true,

      monthlyRevenue,

      pendingPayments,

      activeMembers,

      expiredMembers,

      planBreakdown,

      pendingList,
    });


  } catch (error) {

    console.error(
      "Get Reports Error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};