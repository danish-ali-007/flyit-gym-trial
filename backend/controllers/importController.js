const XLSX = require("xlsx");

const Member = require("../models/Member");
const Payment = require("../models/Payment");
const generateMemberId = require("../utils/memberIdGenerator");


// =====================================================
// CLEAN PHONE
// =====================================================

const cleanPhone = (phone) => {
  return String(phone || "")
    .replace(/\D/g, "")
    .trim();
};


// =====================================================
// CALCULATE EXPIRY DATE
// =====================================================

const calculateExpiryDate = (
  joiningDate,
  durationMonths
) => {
  const expiryDate = new Date(joiningDate);

  expiryDate.setMonth(
    expiryDate.getMonth() +
      Number(durationMonths)
  );

  return expiryDate;
};


// =====================================================
// PARSE JOINING DATE
// =====================================================

const parseJoiningDate = (joiningDateRaw) => {
  // Excel numeric date
  if (typeof joiningDateRaw === "number") {
    const excelDate =
      XLSX.SSF.parse_date_code(joiningDateRaw);

    if (!excelDate) {
      return null;
    }

    return new Date(
      excelDate.y,
      excelDate.m - 1,
      excelDate.d
    );
  }

  // Date object
  if (joiningDateRaw instanceof Date) {
    if (!isNaN(joiningDateRaw.getTime())) {
      return joiningDateRaw;
    }

    return null;
  }

  // Text date
  if (typeof joiningDateRaw === "string") {
    let value = joiningDateRaw.trim();

    if (!value) {
      return null;
    }

    while (value.includes("//")) {
      value = value.replace("//", "/");
    }

    // DD/MM/YY or DD/MM/YYYY
    const parts = value.split("/");

    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]);

      let year = Number(parts[2]);

      if (year < 100) {
        year += 2000;
      }

      const parsedDate = new Date(
        year,
        month - 1,
        day
      );

      if (
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day
      ) {
        return parsedDate;
      }
    }

    // Fallback
    const fallbackDate = new Date(value);

    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
  }

  return null;
};


// =====================================================
// IMPORT MEMBERS
// =====================================================

exports.importMembers = async (req, res) => {
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


    // =================================================
    // FILE CHECK
    // =================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload an Excel or CSV file",
      });
    }


    // =================================================
    // READ FILE
    // =================================================

    const workbook = XLSX.read(
      req.file.buffer,
      {
        type: "buffer",
      }
    );

    const sheetName =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[sheetName];

    const rows =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: "",
        }
      );


    // =================================================
    // EMPTY FILE CHECK
    // =================================================

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message:
          "Uploaded file contains no member data",
      });
    }


    let imported = 0;
    let skipped = 0;
    let paymentsCreated = 0;

    const skippedRows = [];


    // =================================================
    // PROCESS ROWS
    // =================================================

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {
      const row = rows[index];

      try {
        // =============================================
        // NAME
        // =============================================

        const name =
          row.name ||
          row.Name ||
          row["Member Name"] ||
          row["Full Name"];


        // =============================================
        // PHONE - OPTIONAL
        // =============================================

        const phone =
          cleanPhone(
            row.phone ||
            row.Phone ||
            row.Mobile ||
            row.mobile ||
            row["Phone Number"] ||
            row["Mobile Number"]
          );


        // =============================================
        // PLAN NAME
        // =============================================

        const planName =
          row.planName ||
          row["Plan Name"] ||
          row.Plan ||
          row.plan ||
          row["Membership Plan"];


        // =============================================
        // PLAN DURATION
        // =============================================

        const planDurationMonths =
          Number(
            row.planDurationMonths ||
              row["Plan Duration Months"] ||
              row.Duration ||
              row.duration ||
              row["Duration Months"]
          );


        // =============================================
        // TOTAL AMOUNT
        // =============================================

        const totalAmountRaw =
          row.totalAmount ??
          row["Total Amount"] ??
          row.Total ??
          row.total ??
          row.Fee ??
          row.fee ??
          row["Total Fee"] ??
          0;

        const totalAmount =
          Number(totalAmountRaw);


        // =============================================
        // PAID AMOUNT
        // =============================================

        const paidAmountRaw =
          row.paidAmount ??
          row["Paid Amount"] ??
          row.Paid ??
          row.paid ??
          0;

        const paidAmount =
          Number(paidAmountRaw);


        // =============================================
        // JOINING DATE
        // =============================================

        const joiningDateRaw =
          row.joiningDate ||
          row["Joining Date"] ||
          row["Start Date"] ||
          row.startDate ||
          row.Date ||
          row.date;


        // =============================================
        // REQUIRED FIELDS
        // PHONE IS OPTIONAL
        // =============================================

        if (
          !name ||
          !planName ||
          !planDurationMonths ||
          !joiningDateRaw
        ) {
          skipped++;

          skippedRows.push({
            row: index + 2,
            name: name || "",
            phone: phone || "",
            reason:
              "Missing required member data",
          });

          continue;
        }


        // =============================================
        // PHONE VALIDATION
        // BLANK PHONE ALLOWED
        // =============================================

        if (
          phone &&
          phone.length < 10
        ) {
          skipped++;

          skippedRows.push({
            row: index + 2,
            name,
            phone,
            reason:
              "Invalid phone number",
          });

          continue;
        }


        // =============================================
        // PLAN DURATION VALIDATION
        // =============================================

        if (
          ![1, 3, 6, 12].includes(
            planDurationMonths
          )
        ) {
          skipped++;

          skippedRows.push({
            row: index + 2,
            name,
            phone,
            reason:
              "Plan duration must be 1, 3, 6 or 12 months",
          });

          continue;
        }


        // =============================================
        // TOTAL AMOUNT VALIDATION
        // =============================================

        if (
          isNaN(totalAmount) ||
          totalAmount < 0
        ) {
          skipped++;

          skippedRows.push({
            row: index + 2,
            name,
            phone,
            reason:
              "Invalid total amount",
          });

          continue;
        }


        // =============================================
        // PAID AMOUNT VALIDATION
        // =============================================

        if (
          isNaN(paidAmount) ||
          paidAmount < 0
        ) {
          skipped++;

          skippedRows.push({
            row: index + 2,
            name,
            phone,
            reason:
              "Invalid paid amount",
          });

          continue;
        }


        // =============================================
        // PAID CANNOT EXCEED TOTAL
        // =============================================

        if (
          paidAmount > totalAmount
        ) {
          skipped++;

          skippedRows.push({
            row: index + 2,
            name,
            phone,
            reason:
              "Paid amount cannot exceed total amount",
          });

          continue;
        }


        // =============================================
        // JOINING DATE
        // =============================================

        const joiningDate =
          parseJoiningDate(
            joiningDateRaw
          );


        if (
          !joiningDate ||
          isNaN(
            joiningDate.getTime()
          )
        ) {
          skipped++;

          skippedRows.push({
            row: index + 2,
            name,
            phone,
            reason:
              "Invalid joining date",
          });

          continue;
        }


        // =============================================
        // EXPIRY DATE
        // =============================================

        const expiryDate =
          calculateExpiryDate(
            joiningDate,
            planDurationMonths
          );


        // =============================================
        // PAYMENT VALUES
        // =============================================

        const pendingAmount =
          totalAmount - paidAmount;


        let paymentStatus =
          "Pending";


        if (
          totalAmount > 0 &&
          paidAmount === totalAmount
        ) {
          paymentStatus =
            "Paid";
        } else if (
          paidAmount > 0
        ) {
          paymentStatus =
            "Partial";
        }


        // =============================================
        // MEMBERSHIP STATUS
        // =============================================

        const today = new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );


        const expiryCheck =
          new Date(expiryDate);

        expiryCheck.setHours(
          0,
          0,
          0,
          0
        );


        const membershipStatus =
          expiryCheck < today
            ? "Expired"
            : "Active";


        // =============================================
        // GENERATE MEMBER ID
        // =============================================

        const memberId =
          await generateMemberId();


        // =============================================
        // CREATE MEMBER
        // =============================================

        const member =
          await Member.create({
            _id: memberId,

            gymId,

            name:
              String(name).trim(),

            phone:
              phone || "",

            planName:
              String(planName).trim(),

            planDurationMonths,

            totalAmount,

            paidAmount,

            pendingAmount,

            paymentStatus,

            membershipStatus,

            joiningDate,

            expiryDate,
          });


        // =============================================
        // CREATE PAYMENT RECORD
        // =============================================

        if (paidAmount > 0) {
          await Payment.create({
            gymId,

            member:
              member._id,

            amountPaid:
              paidAmount,

            paymentMethod:
              "Cash",

            paymentDate:
              joiningDate,

            remarks:
              "Imported Member Payment",
          });

          paymentsCreated++;
        }


        imported++;

      } catch (rowError) {

        skipped++;

        skippedRows.push({
          row: index + 2,

          name:
            row.name ||
            row.Name ||
            "",

          phone:
            row.phone ||
            row.Phone ||
            row.Mobile ||
            "",

          reason:
            rowError.message,
        });
      }
    }


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "Member import completed",

      summary: {
        totalRows:
          rows.length,

        imported,

        skipped,

        paymentsCreated,
      },

      skippedRows,
    });

  } catch (error) {

    console.error(
      "Import Members Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};