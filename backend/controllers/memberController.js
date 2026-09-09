const Member = require("../models/Member");
const Payment = require("../models/Payment");
const generateMemberId = require("../utils/memberIdGenerator");


// ======================================================
// ADD NEW MEMBER
// ======================================================
// @route   POST /api/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const gymId = req.admin?.gymId;

    if (!gymId) {
      return res.status(403).json({
        success: false,
        message: "Gym account is not configured",
      });
    }

    const {
      name,
      phone,
      planName,
      planDurationMonths,
      totalAmount,
      paidAmount = 0,
      joiningDate,
      paymentMethod = "Cash",
    } = req.body;

    const total = Number(totalAmount);
    const paid = Number(paidAmount);
    const duration = Number(planDurationMonths);
    const cleanPhone = String(phone || "").trim();

    if (
      !name ||
      !cleanPhone ||
      !planName ||
      !duration ||
      isNaN(total) ||
      total < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid member details",
      });
    }

    if (isNaN(paid) || paid < 0) {
      return res.status(400).json({
        success: false,
        message: "Paid amount must be valid",
      });
    }

    if (paid > total) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot exceed total amount",
      });
    }


    // ==================================================
    // EXISTING MEMBER
    // Same behavior, bas current gym ke andar check
    // ==================================================

    const existingMember = await Member.findOne({
      gymId,
      phone: cleanPhone,
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: `Member already exists with this phone number. Member ID: ${existingMember._id}`,
      });
    }


    // Existing member ID generator unchanged
    const memberId = await generateMemberId();


    const startDate = joiningDate
      ? new Date(joiningDate)
      : new Date();

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid joining date",
      });
    }


    const expiryDate = new Date(startDate);

    expiryDate.setMonth(
      expiryDate.getMonth() + duration
    );


    const pendingAmount = total - paid;

    let paymentStatus = "Pending";

    if (paid === total) {
      paymentStatus = "Paid";
    } else if (paid > 0) {
      paymentStatus = "Partial";
    }


    // ==================================================
    // CREATE MEMBER
    // Sirf gymId extra
    // ==================================================

    const member = await Member.create({
      _id: memberId,

      gymId,

      name: String(name).trim(),
      phone: cleanPhone,
      planName: String(planName).trim(),
      planDurationMonths: duration,
      totalAmount: total,
      paidAmount: paid,
      pendingAmount,
      paymentStatus,
      membershipStatus: "Active",
      joiningDate: startDate,
      expiryDate,
    });


    // Existing payment behavior unchanged
    if (paid > 0) {
      await Payment.create({
        gymId,
        member: member._id,
        amountPaid: paid,
        paymentMethod,
        remarks: "Initial Membership Payment",
      });
    }


    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Member with this phone number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// GET ALL MEMBERS + FILTER + SEARCH + PAGINATION
// ======================================================
// @route   GET /api/members
// @access  Private
exports.getAllMembers = async (req, res) => {
  try {
    const gymId = req.admin?.gymId;

    if (!gymId) {
      return res.status(403).json({
        success: false,
        message: "Gym account is not configured",
      });
    }


    const today = new Date();


    // Automatically expire members
    // Bas current gym ke members
    await Member.updateMany(
      {
        gymId,

        expiryDate: { $lt: today },
        membershipStatus: "Active",
      },
      {
        $set: {
          membershipStatus: "Expired",
        },
      }
    );


    const {
      membershipStatus,
      paymentStatus,
      planName,
      query,
      page = 1,
      limit = 50,
    } = req.query;


    // Bas ye main isolation hai
    const filter = {
      gymId,
    };


    // Prevent regex special characters causing problems
    const escapeRegex = (value) => {
      return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
    };


    // ==================================================
    // MEMBERSHIP STATUS FILTER
    // ==================================================

    if (
      membershipStatus &&
      membershipStatus.toLowerCase() !== "all"
    ) {
      const status = escapeRegex(
        membershipStatus.trim()
      );

      filter.membershipStatus = {
        $regex: `^\\s*${status}\\s*$`,
        $options: "i",
      };
    }


    // ==================================================
    // PAYMENT STATUS FILTER
    // ==================================================

    if (
      paymentStatus &&
      paymentStatus.toLowerCase() !== "all"
    ) {
      const status = escapeRegex(
        paymentStatus.trim()
      );

      filter.paymentStatus = {
        $regex: `^\\s*${status}\\s*$`,
        $options: "i",
      };
    }


    // ==================================================
    // PLAN FILTER
    // ==================================================

    if (
      planName &&
      planName.toLowerCase() !== "all"
    ) {
      const plan = escapeRegex(
        planName.trim()
      );

      filter.planName = {
        $regex: `^\\s*${plan}\\s*$`,
        $options: "i",
      };
    }


    // ==================================================
    // SEARCH
    // Same search, bas current gym ke andar
    // ==================================================

    if (query && query.trim()) {
      const searchValue = escapeRegex(
        query.trim()
      );

      filter.$or = [
        {
          _id: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          name: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          phone: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }


    // ==================================================
    // PAGINATION
    // ==================================================

    const currentPage = Math.max(
      1,
      Number(page) || 1
    );


    // Maximum 50 members per page
    const perPage = Math.min(
      50,
      Math.max(
        1,
        Number(limit) || 50
      )
    );


    const skip =
      (currentPage - 1) * perPage;


    // ==================================================
    // COUNT AFTER FILTER
    // ==================================================

    const totalMembers =
      await Member.countDocuments(filter);


    // ==================================================
    // FETCH AFTER FILTER
    // ==================================================

    const members =
      await Member.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage);


    const totalPages = Math.max(
      1,
      Math.ceil(
        totalMembers / perPage
      )
    );


    return res.status(200).json({
      success: true,

      count: members.length,

      pagination: {
        currentPage,
        perPage,
        totalMembers,
        totalPages,

        hasNextPage:
          currentPage < totalPages,

        hasPreviousPage:
          currentPage > 1,
      },

      filters: {
        membershipStatus:
          membershipStatus || "All",

        paymentStatus:
          paymentStatus || "All",

        planName:
          planName || "All",

        query:
          query || "",
      },

      data: members,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// GET SINGLE MEMBER
// ======================================================
// @route   GET /api/members/:id
// @access  Private
exports.getMemberById = async (req, res) => {
  try {
    const gymId = req.admin?.gymId;

    if (!gymId) {
      return res.status(403).json({
        success: false,
        message: "Gym account is not configured",
      });
    }


    const member =
      await Member.findOne({
        _id: req.params.id,
        gymId,
      });


    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }


    return res.status(200).json({
      success: true,
      data: member,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// UPDATE MEMBER
// ======================================================
// @route   PUT /api/members/:id
// @access  Private
exports.updateMember = async (req, res) => {
  try {
    const gymId = req.admin?.gymId;

    if (!gymId) {
      return res.status(403).json({
        success: false,
        message: "Gym account is not configured",
      });
    }


    const member =
      await Member.findOne({
        _id: req.params.id,
        gymId,
      });


    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }


    // Gym ownership frontend se kabhi change nahi hogi
    delete req.body.gymId;


    // Existing phone behavior kept unchanged
    if (req.body.phone !== undefined) {
      const cleanPhone =
        String(
          req.body.phone
        ).trim();


      const existingPhone =
        await Member.findOne({
          gymId,

          phone: cleanPhone,

          _id: {
            $ne: member._id,
          },
        });


      if (existingPhone) {
        return res.status(409).json({
          success: false,

          message:
            `Another member already uses this phone number. Member ID: ${existingPhone._id}`,
        });
      }


      req.body.phone =
        cleanPhone;
    }


    // ==================================================
    // PAYMENT UPDATE
    // Existing logic unchanged
    // ==================================================

    if (
      req.body.totalAmount !== undefined ||
      req.body.paidAmount !== undefined
    ) {

      const total =
        req.body.totalAmount !== undefined
          ? Number(
              req.body.totalAmount
            )
          : Number(
              member.totalAmount
            );


      const paid =
        req.body.paidAmount !== undefined
          ? Number(
              req.body.paidAmount
            )
          : Number(
              member.paidAmount
            );


      if (
        isNaN(total) ||
        total < 0 ||
        isNaN(paid) ||
        paid < 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid payment amounts",
        });
      }


      if (paid > total) {

        return res.status(400).json({
          success: false,

          message:
            "Paid amount cannot exceed total amount",
        });
      }


      req.body.totalAmount =
        total;


      req.body.paidAmount =
        paid;


      req.body.pendingAmount =
        total - paid;


      if (paid === total) {

        req.body.paymentStatus =
          "Paid";

      } else if (paid > 0) {

        req.body.paymentStatus =
          "Partial";

      } else {

        req.body.paymentStatus =
          "Pending";
      }
    }


    // ==================================================
    // JOINING DATE / PLAN UPDATE
    // Existing logic unchanged
    // ==================================================

    if (
      req.body.joiningDate !== undefined ||
      req.body.planDurationMonths !== undefined
    ) {

      const joiningDate =
        req.body.joiningDate !== undefined
          ? new Date(
              req.body.joiningDate
            )
          : new Date(
              member.joiningDate
            );


      const duration =
        req.body.planDurationMonths !== undefined
          ? Number(
              req.body.planDurationMonths
            )
          : Number(
              member.planDurationMonths
            );


      if (
        isNaN(
          joiningDate.getTime()
        ) ||
        !duration ||
        duration <= 0
      ) {

        return res.status(400).json({
          success: false,

          message:
            "Invalid joining date or plan duration",
        });
      }


      const expiryDate =
        new Date(joiningDate);


      expiryDate.setMonth(
        expiryDate.getMonth() +
          duration
      );


      req.body.expiryDate =
        expiryDate;
    }


    // ==================================================
    // AUTO STATUS
    // Existing logic unchanged
    // ==================================================

    if (req.body.expiryDate) {

      const expiry =
        new Date(
          req.body.expiryDate
        );


      req.body.membershipStatus =
        expiry < new Date()
          ? "Expired"
          : "Active";
    }


    // Bas findByIdAndUpdate ki jagah gym-safe query
    const updatedMember =
      await Member.findOneAndUpdate(
        {
          _id: req.params.id,
          gymId,
        },

        req.body,

        {
          new: true,
          runValidators: true,
        }
      );


    return res.status(200).json({
      success: true,

      message:
        "Member updated successfully",

      data: updatedMember,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "Member with this phone number already exists",
      });
    }


    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// DELETE MEMBER
// ======================================================
// @route   DELETE /api/members/:id
// @access  Private
exports.deleteMember = async (req, res) => {
  try {
    const gymId = req.admin?.gymId;

    if (!gymId) {
      return res.status(403).json({
        success: false,
        message: "Gym account is not configured",
      });
    }


    const member =
      await Member.findOne({
        _id: req.params.id,
        gymId,
      });


    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }


    // ==================================================
    // DELETE PAYMENTS
    // CURRENT GYM ONLY
    // ==================================================

    await Payment.deleteMany({
      gymId,
      member: member._id,
    });


    await member.deleteOne();


    return res.status(200).json({
      success: true,
      message:
        "Member removed successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// SEARCH MEMBERS
// ======================================================
// @route GET /api/members/search?query=rahul
// @access Private
exports.searchMembers = async (req, res) => {
  try {
    const gymId = req.admin?.gymId;

    if (!gymId) {
      return res.status(403).json({
        success: false,
        message: "Gym account is not configured",
      });
    }


    const { query } =
      req.query;


    if (
      !query ||
      !query.trim()
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Search query is required",
      });
    }


    const searchValue =
      query.trim();


    const members =
      await Member.find({
        gymId,

        $or: [
          {
            _id: {
              $regex:
                searchValue,

              $options: "i",
            },
          },

          {
            name: {
              $regex:
                searchValue,

              $options: "i",
            },
          },

          {
            phone: {
              $regex:
                searchValue,

              $options: "i",
            },
          },
        ],
      }).sort({
        createdAt: -1,
      });


    return res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};