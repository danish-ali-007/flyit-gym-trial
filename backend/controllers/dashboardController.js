const mongoose = require("mongoose");

const Member =
  require("../models/Member");

const Payment =
  require("../models/Payment");

const {
  createWhatsAppLink,
} = require("../utils/whatsappHelper");


// =====================================================
// CURRENT GYM HELPERS
// =====================================================

const getCurrentGymId =
  (req) => {

    return (
      req.admin?.gymId ||
      null
    );
  };


const getGymObjectId =
  (gymId) => {

    if (!gymId) {
      return null;
    }


    if (
      gymId instanceof
      mongoose.Types.ObjectId
    ) {

      return gymId;
    }


    return new mongoose
      .Types
      .ObjectId(
        String(gymId)
      );
  };


const requireGymId =
  (
    req,
    res
  ) => {

    const gymId =
      getCurrentGymId(
        req
      );


    if (!gymId) {

      res
        .status(403)
        .json({
          success: false,

          message:
            "Gym account is not configured",
        });


      return null;
    }


    return gymId;
  };


// =====================================================
// GET DASHBOARD OVERVIEW STATISTICS
// =====================================================
// @route   GET /api/dashboard/stats
// @access  Private
// =====================================================

exports.getDashboardStats =
  async (
    req,
    res
  ) => {

    try {

      const gymId =
        requireGymId(
          req,
          res
        );


      if (!gymId) {
        return;
      }


      const gymObjectId =
        getGymObjectId(
          gymId
        );


      const today =
        new Date();


      // =================================================
      // AUTO EXPIRE
      // ONLY CURRENT GYM
      // =================================================

      await Member.updateMany(
        {
          gymId,

          expiryDate: {
            $lt: today,
          },

          membershipStatus:
            "Active",
        },

        {
          $set: {
            membershipStatus:
              "Expired",
          },
        }
      );


      // =================================================
      // ALL DASHBOARD STATS
      // =================================================

      const [
        totalMembers,
        activeMembers,
        expiredMembers,
        totalRevenueResult,
        totalPendingResult,
      ] =
        await Promise.all([

          // TOTAL MEMBERS
          Member.countDocuments({
            gymId,
          }),


          // ACTIVE MEMBERS
          Member.countDocuments({
            gymId,

            membershipStatus:
              "Active",

            expiryDate: {
              $gte: today,
            },
          }),


          // EXPIRED MEMBERS
          Member.countDocuments({
            gymId,

            $or: [
              {
                membershipStatus:
                  "Expired",
              },

              {
                expiryDate: {
                  $lt: today,
                },
              },
            ],
          }),


          // TOTAL REVENUE
          Payment.aggregate([
            {
              $match: {
                gymId:
                  gymObjectId,
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
          ]),


          // TOTAL PENDING
          Member.aggregate([
            {
              $match: {
                gymId:
                  gymObjectId,
              },
            },

            {
              $group: {
                _id: null,

                total: {
                  $sum:
                    "$pendingAmount",
                },
              },
            },
          ]),

        ]);


      const totalRevenue =
        totalRevenueResult.length >
        0
          ? totalRevenueResult[0]
              .total
          : 0;


      const totalPendingAmount =
        totalPendingResult.length >
        0
          ? totalPendingResult[0]
              .total
          : 0;


      return res
        .status(200)
        .json({
          success: true,

          data: {
            totalMembers,

            activeMembers,

            expiredMembers,

            totalRevenue,

            totalPendingAmount,
          },
        });

    } catch (error) {

      console.error(
        "Dashboard Stats Error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// GET EXPIRY ALERTS
// =====================================================
// @route   GET /api/dashboard/expiry-alerts
// @access  Private
// =====================================================

exports.getExpiryAlerts =
  async (
    req,
    res
  ) => {

    try {

      const gymId =
        requireGymId(
          req,
          res
        );


      if (!gymId) {
        return;
      }


      // =================================================
      // IST DAY BOUNDARY
      // =================================================

      const IST_OFFSET_MS =
        5.5 *
        60 *
        60 *
        1000;


      const now =
        new Date();


      const istNow =
        new Date(
          now.getTime() +
            IST_OFFSET_MS
        );


      const todayStart =
        new Date(

          Date.UTC(
            istNow
              .getUTCFullYear(),

            istNow
              .getUTCMonth(),

            istNow
              .getUTCDate()
          ) -
            IST_OFFSET_MS
        );


      const tomorrowStart =
        new Date(

          todayStart.getTime() +

            (
              24 *
              60 *
              60 *
              1000
            )
        );


      // =================================================
      // EXPIRING TODAY
      // CURRENT GYM ONLY
      // =================================================

      const todayExpiring =
        await Member.find({
          gymId,

          expiryDate: {
            $gte:
              todayStart,

            $lt:
              tomorrowStart,
          },
        })
          .select(
            "name phone planName expiryDate membershipStatus"
          );


      // =================================================
      // PAST EXPIRED FILTER
      // CURRENT GYM ONLY
      // =================================================

      const pastExpiredFilter =
        {
          gymId,

          expiryDate: {
            $lt:
              todayStart,
          },
        };


      const [
        pastExpiredCount,
        pastExpired,
      ] =
        await Promise.all([

          Member.countDocuments(
            pastExpiredFilter
          ),


          Member.find(
            pastExpiredFilter
          )
            .select(
              "name phone planName expiryDate membershipStatus"
            )
            .sort({
              expiryDate: -1,
            })
            .limit(10),

        ]);


      // =================================================
      // TODAY WHATSAPP LINKS
      // =================================================

      const todayList =
        todayExpiring.map(
          (member) => {

            return {
              ...member.toObject(),

              whatsappLink:
                createWhatsAppLink(
                  member,
                  "TODAY_EXPIRY"
                ),
            };
          }
        );


      // =================================================
      // PAST EXPIRED WHATSAPP LINKS
      // =================================================

      const pastList =
        pastExpired.map(
          (member) => {

            const expiryDate =
              new Date(
                member.expiryDate
              );


            const diffTime =
              todayStart
                .getTime() -
              expiryDate
                .getTime();


            const daysAgo =
              Math.max(

                1,

                Math.floor(

                  diffTime /

                    (
                      1000 *
                      60 *
                      60 *
                      24
                    )
                )
              );


            return {
              ...member.toObject(),

              daysAgo,

              whatsappLink:
                createWhatsAppLink(
                  member,
                  "PAST_EXPIRED"
                ),
            };
          }
        );


      return res
        .status(200)
        .json({
          success: true,

          data: {

            todayExpiringCount:
              todayList.length,

            todayExpiring:
              todayList,

            pastExpiredCount,

            pastExpired:
              pastList,
          },
        });

    } catch (error) {

      console.error(
        "Expiry Alerts Error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// GET MONTHLY REVENUE REPORT
// =====================================================
// @route   GET /api/dashboard/reports/monthly-revenue
// @access  Private
// =====================================================

exports.getMonthlyRevenueReport =
  async (
    req,
    res
  ) => {

    try {

      const gymId =
        requireGymId(
          req,
          res
        );


      if (!gymId) {
        return;
      }


      const gymObjectId =
        getGymObjectId(
          gymId
        );


      const revenueReport =
        await Payment.aggregate([

          // =============================================
          // CURRENT GYM ONLY
          // =============================================

          {
            $match: {
              gymId:
                gymObjectId,
            },
          },


          // =============================================
          // GROUP MONTH-WISE
          // =============================================

          {
            $group: {

              _id: {

                year: {
                  $year: {

                    $ifNull: [
                      "$paymentDate",
                      "$createdAt",
                    ],
                  },
                },


                month: {
                  $month: {

                    $ifNull: [
                      "$paymentDate",
                      "$createdAt",
                    ],
                  },
                },
              },


              totalRevenue: {
                $sum:
                  "$amountPaid",
              },


              totalTransactions: {
                $sum: 1,
              },

            },
          },


          // =============================================
          // LATEST MONTH FIRST
          // =============================================

          {
            $sort: {
              "_id.year":
                -1,

              "_id.month":
                -1,
            },
          },

        ]);


      return res
        .status(200)
        .json({
          success: true,

          data:
            revenueReport,
        });

    } catch (error) {

      console.error(
        "Monthly Revenue Report Error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message,
        });
    }
  };


// =====================================================
// GET MEMBERSHIP CALENDAR
// =====================================================
// @route GET /api/dashboard/membership-calendar
// @access Private
// =====================================================

exports.getMembershipCalendar =
  async (
    req,
    res
  ) => {

    try {

      const gymId =
        requireGymId(
          req,
          res
        );


      if (!gymId) {
        return;
      }


      const gymObjectId =
        getGymObjectId(
          gymId
        );


      const currentYear =
        new Date()
          .getFullYear();


      const year =
        Number(
          req.query.year
        ) ||
        currentYear;


      const month =
        Number(
          req.query.month
        ) ||
        new Date()
          .getMonth() + 1;


      const view =
        req.query.view ||
        "joining";


      const planDuration =
        req.query
          .planDuration;


      // =================================================
      // VIEW VALIDATION
      // =================================================

      if (
        ![
          "joining",
          "expiry",
        ].includes(
          view
        )
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "View must be joining or expiry",
          });
      }


      // =================================================
      // MONTH VALIDATION
      // =================================================

      if (
        month < 1 ||
        month > 12
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Month must be between 1 and 12",
          });
      }


      // =================================================
      // DATE FIELD
      // =================================================

      const dateField =
        view === "joining"
          ? "joiningDate"
          : "expiryDate";


      // =================================================
      // IST MONTH BOUNDARIES
      // =================================================

      const IST_OFFSET_MS =
        5.5 *
        60 *
        60 *
        1000;


      const monthStart =
        new Date(

          Date.UTC(
            year,
            month - 1,
            1
          ) -
            IST_OFFSET_MS
        );


      const monthEnd =
        new Date(

          Date.UTC(
            year,
            month,
            1
          ) -
            IST_OFFSET_MS
        );


      // =================================================
      // CURRENT GYM FILTER
      // =================================================

      const filter = {
        gymId,

        [dateField]: {
          $gte:
            monthStart,

          $lt:
            monthEnd,
        },
      };


      // =================================================
      // PLAN FILTER
      // =================================================

      if (
        planDuration &&
        planDuration !==
          "All"
      ) {

        const duration =
          Number(
            planDuration
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

          return res
            .status(400)
            .json({
              success: false,

              message:
                "Plan duration must be 1, 3, 6 or 12 months",
            });
        }


        filter
          .planDurationMonths =
          duration;
      }


      // =================================================
      // MEMBERS
      // CURRENT GYM ONLY
      // =================================================

      const members =
        await Member.find(
          filter
        )
          .select(
            "_id name phone planName planDurationMonths totalAmount paidAmount pendingAmount paymentStatus membershipStatus joiningDate expiryDate"
          )
          .sort({
            [dateField]:
              1,
          });


      // =================================================
      // PLAN SUMMARY
      // =================================================

      const planSummary = {
        1: 0,
        3: 0,
        6: 0,
        12: 0,
      };


      members.forEach(
        (member) => {

          const duration =
            member
              .planDurationMonths;


          if (
            Object
              .prototype
              .hasOwnProperty
              .call(
                planSummary,
                duration
              )
          ) {

            planSummary[
              duration
            ]++;
          }
        }
      );


      // =================================================
      // MONTH NAMES
      // =================================================

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];


      // =================================================
      // AVAILABLE YEARS
      // CURRENT GYM ONLY
      // =================================================

      const availableYearsRaw =
        await Member.aggregate([

          {
            $match: {
              gymId:
                gymObjectId,
            },
          },


          {
            $project: {

              years: [

                {
                  $year: {

                    date:
                      "$joiningDate",

                    timezone:
                      "Asia/Kolkata",
                  },
                },


                {
                  $year: {

                    date:
                      "$expiryDate",

                    timezone:
                      "Asia/Kolkata",
                  },
                },

              ],
            },
          },


          {
            $unwind:
              "$years",
          },


          {
            $group: {
              _id:
                "$years",
            },
          },


          {
            $sort: {
              _id: 1,
            },
          },

        ]);


      const availableYears =
        availableYearsRaw
          .map(
            (item) =>
              item._id
          )
          .filter(
            (item) =>
              Number
                .isInteger(
                  item
                )
          );


      const yearOptions =
        Array.from(

          new Set([
            ...availableYears,

            currentYear,

            currentYear +
              1,
          ])
        )
          .sort(
            (
              a,
              b
            ) =>
              a - b
          );


      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(200)
        .json({
          success: true,


          filters: {

            year,

            month,


            monthName:
              monthNames[
                month - 1
              ],


            view,


            planDuration:
              planDuration ||
              "All",


            availableYears:
              yearOptions,
          },


          summary: {

            totalMembers:
              members.length,


            planSummary,
          },


          data:
            members,
        });

    } catch (error) {

      console.error(
        "Membership Calendar Error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message,
        });
    }
  };