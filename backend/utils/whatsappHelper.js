// Dynamic WhatsApp Expiry Reminder Link Generator

const IST_OFFSET_MS =
  5.5 * 60 * 60 * 1000;


// ==========================================
// GET IST DAY START
// ==========================================

const getISTDayStart = (
  date = new Date()
) => {

  const shiftedDate =
    new Date(
      date.getTime() +
        IST_OFFSET_MS
    );


  return new Date(
    Date.UTC(
      shiftedDate.getUTCFullYear(),
      shiftedDate.getUTCMonth(),
      shiftedDate.getUTCDate()
    ) -
      IST_OFFSET_MS
  );
};


// ==========================================
// CREATE WHATSAPP LINK
// ==========================================

exports.createWhatsAppLink = (
  member,
  type = "TODAY_EXPIRY",
  gymName = "Olympics Gym"
) => {

  // ==========================================
  // CLEAN PHONE NUMBER
  // ==========================================

  let cleanPhone =
    String(
      member.phone || ""
    ).replace(
      /[^0-9]/g,
      ""
    );


  // 10-digit Indian number me
  // +91 country code add karo
  if (
    cleanPhone.length === 10
  ) {

    cleanPhone =
      "91" + cleanPhone;
  }


  // ==========================================
  // SAFE GYM NAME
  // ==========================================

  const displayGymName =
    String(
      gymName ||
        "Olympics Gym"
    ).trim();


  let message = "";


  // ==========================================
  // MEMBER ID
  // ==========================================

  const memberId =
    member._id ||
    "N/A";


  // ==========================================
  // MEMBER EXPIRY DATE
  // ==========================================

  const expiryDateObj =
    new Date(
      member.expiryDate
    );


  // ==========================================
  // FORMAT EXPIRY DATE IN INDIA TIMEZONE
  // Example: 01/09/2026
  // ==========================================

  const formattedExpiryDate =
    expiryDateObj
      .toLocaleDateString(
        "en-IN",
        {
          day:
            "2-digit",

          month:
            "2-digit",

          year:
            "numeric",

          timeZone:
            "Asia/Kolkata",
        }
      );


  // ==========================================
  // CASE 1:
  // MEMBERSHIP EXPIRES TODAY
  // ==========================================

  if (
    type ===
    "TODAY_EXPIRY"
  ) {

    message =
      `Hello *${member.name}*,\n\n` +

      `Member ID: *${memberId}*\n\n` +

      `Your *${member.planName}* membership at *${displayGymName}* expires today, *${formattedExpiryDate}*.\n\n` +

      `Please renew your membership to continue your training without interruption.\n\n` +

      `Thank you,\n` +

      `*${displayGymName}*`;
  }


  // ==========================================
  // CASE 2:
  // MEMBERSHIP ALREADY EXPIRED
  // ==========================================

  else if (
    type ===
    "PAST_EXPIRED"
  ) {

    const todayStart =
      getISTDayStart(
        new Date()
      );


    const expiryStart =
      getISTDayStart(
        expiryDateObj
      );


    const diffTime =
      todayStart.getTime() -
      expiryStart.getTime();


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


    const dayText =
      daysAgo === 1
        ? "day"
        : "days";


    message =
      `Hello *${member.name}*,\n\n` +

      `Member ID: *${memberId}*\n\n` +

      `Your *${member.planName}* membership at *${displayGymName}* expired on *${formattedExpiryDate}* (${daysAgo} ${dayText} ago).\n\n` +

      `Please renew your membership to continue your training.\n\n` +

      `Thank you,\n` +

      `*${displayGymName}*`;
  }


  // ==========================================
  // WHATSAPP URL
  // ==========================================

  return (
    `https://wa.me/${cleanPhone}` +
    `?text=${encodeURIComponent(
      message
    )}`
  );
};