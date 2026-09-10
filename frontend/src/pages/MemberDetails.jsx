import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";
import "./MemberDetails.css";


const MemberDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();


  // =========================================
  // CURRENT GYM
  // =========================================

  const isTrial =
    localStorage.getItem("isTrial") ===
    "true";


  const trialGym =
    JSON.parse(
      localStorage.getItem(
        "trialGym"
      ) || "{}"
    );


  const gymName =
    isTrial
      ? trialGym.gymName ||
        "Trial Gym"
      : "Olympics Gym";


  // =========================================
  // STATE
  // =========================================

  const [
    member,
    setMember,
  ] =
    useState(null);


  const [
    upcomingRenewal,
    setUpcomingRenewal,
  ] =
    useState(null);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  const [
    reminderError,
    setReminderError,
  ] =
    useState("");


  // =========================================
  // FETCH MEMBER + UPCOMING RENEWAL
  // =========================================

  const fetchMemberDetails =
    async () => {

      try {

        setLoading(true);

        setErrorMessage("");


        const [
          memberResponse,
          renewalResponse,
        ] =
          await Promise.all([

            api.get(
              `/members/${id}`
            ),

            api.get(
              `/payments/renewal/${id}`
            ),

          ]);


        setMember(
          memberResponse
            .data
            .data
        );


        setUpcomingRenewal(
          renewalResponse
            .data
            .data ||
            null
        );

      } catch (error) {

        console.error(
          "Member Details Fetch Error:",
          error
        );


        setErrorMessage(
          error.response
            ?.data
            ?.message ||
            "Unable to load member details."
        );


        setMember(null);

        setUpcomingRenewal(
          null
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    fetchMemberDetails();

  }, [id]);


  // =========================================
  // DATE FORMAT
  // =========================================

  const formatDate = (
    date
  ) => {

    if (!date) {

      return "-";
    }


    const parsedDate =
      new Date(
        date
      );


    if (
      Number.isNaN(
        parsedDate
          .getTime()
      )
    ) {

      return "-";
    }


    return parsedDate
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
  };


  // =========================================
  // WHATSAPP REMINDER
  // =========================================

  const handleWhatsAppReminder =
    () => {

      try {

        setReminderError(
          ""
        );


        if (!member) {

          setReminderError(
            "Member details are not available."
          );

          return;
        }


        let cleanPhone =
          String(
            member.phone ||
            ""
          ).replace(
            /\D/g,
            ""
          );


        if (
          cleanPhone.length ===
          10
        ) {

          cleanPhone =
            `91${cleanPhone}`;
        }


        if (!cleanPhone) {

          setReminderError(
            "Member phone number is not available."
          );

          return;
        }


        const memberId =
          member._id ||
          "N/A";


        const pendingAmount =
          Number(
            member.pendingAmount ||
            0
          );


        const isExpired =
          member
            .membershipStatus ===
          "Expired";


        let message = "";


        // =========================================
        // EXPIRED
        // =========================================

        if (isExpired) {

          const expiryDate =
            formatDate(
              member.expiryDate ||
              member.endDate
            );


          message =
            `Hello *${member.name}*,\n\n` +

            `Member ID: *${memberId}*\n\n` +

            `Your *${member.planName}* membership at *${gymName}* has expired.\n\n` +

            `Expiry Date: *${expiryDate}*\n\n` +

            `Please renew your membership to continue your training without interruption.\n\n` +

            `Thank you,\n` +

            `*${gymName}*`;
        }


        // =========================================
        // ACTIVE + PAYMENT PENDING
        // =========================================

        else if (
          pendingAmount > 0
        ) {

          message =
            `Hello *${member.name}*,\n\n` +

            `Member ID: *${memberId}*\n\n` +

            `Your pending membership payment at *${gymName}* is *₹${pendingAmount}*.\n\n` +

            `Please clear the pending amount at your earliest convenience.\n\n` +

            `Thank you,\n` +

            `*${gymName}*`;
        }


        // =========================================
        // NO REMINDER
        // =========================================

        else {

          setReminderError(
            "No reminder is required for this member."
          );

          return;
        }


        const whatsappUrl =
          `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
            message
          )}`;


        // Same browser tab use karo.
        // Mobile par WhatsApp se back aane ke baad
        // extra blank/white tab nahi rahega.
        window.location.href =
          whatsappUrl;

      } catch (error) {

        console.error(
          "WhatsApp Reminder Error:",
          error
        );


        setReminderError(
          "Unable to open WhatsApp reminder."
        );
      }
    };


  // =========================================
  // SKELETON LOADING
  // =========================================

  if (loading) {

    return (
      <div className="member-details-page">

        <div className="member-details-header">

          <div>

            <div className="skeleton-line skeleton-title" />

            <div className="skeleton-line skeleton-subtitle" />

          </div>


          <div className="skeleton-back-button" />

        </div>


        <div
          className="member-details-card member-details-skeleton"
          aria-hidden="true"
        >

          {/* PROFILE */}

          <div className="member-profile-section">

            <div className="skeleton-avatar" />


            <div className="skeleton-profile-text">

              <div className="skeleton-line skeleton-name" />

              <div className="skeleton-line skeleton-id" />

            </div>


            <div className="skeleton-status" />

          </div>


          {/* DETAILS */}

          <div className="member-details-grid">

            {Array.from({
              length: 10,
            }).map(
              (
                _,
                index
              ) => (

                <div
                  className="detail-item skeleton-detail-item"
                  key={index}
                >

                  <div className="skeleton-line skeleton-label" />

                  <div className="skeleton-line skeleton-value" />

                </div>

              )
            )}

          </div>


          {/* ACTIONS */}

          <div className="member-details-actions skeleton-actions">

            <div className="skeleton-action-button" />

            <div className="skeleton-action-button skeleton-action-wide" />

          </div>

        </div>

      </div>
    );
  }


  // =========================================
  // ERROR
  // =========================================

  if (
    errorMessage ||
    !member
  ) {

    return (
      <div className="member-details-page">

        <div className="member-not-found">

          <h2>
            Member not found
          </h2>


          <p>
            {errorMessage ||
              "Unable to find this member."}
          </p>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/members"
              )
            }
          >
            Back to Members
          </button>

        </div>

      </div>
    );
  }


  // =========================================
  // REMINDER STATE
  // =========================================

  const pendingAmount =
    Number(
      member.pendingAmount ||
      0
    );


  const hasPendingPayment =
    pendingAmount > 0;


  const isExpired =
    member
      .membershipStatus ===
    "Expired";


  const canSendReminder =
    isExpired ||
    hasPendingPayment;


  // =========================================
  // UI
  // =========================================

  return (
    <div className="member-details-page">

      {/* HEADER */}

      <div className="member-details-header">

        <div>

          <h1>
            Member Details
          </h1>

          <p>
            View complete {gymName} member information
          </p>

        </div>


        <button
          type="button"
          className="details-back-btn"
          onClick={() =>
            navigate(
              "/members"
            )
          }
        >
          Back
        </button>

      </div>


      {/* CURRENT MEMBER */}

      <div className="member-details-card">

        <div className="member-profile-section">

          <div className="member-avatar">

            {member.name
              ? member.name
                  .charAt(0)
                  .toUpperCase()
              : "M"}

          </div>


          <div>

            <h2>
              {member.name ||
                "-"}
            </h2>

            <p>
              Member ID:{" "}
              {member._id ||
                "-"}
            </p>

          </div>


          <span
            className={
              member.membershipStatus ===
              "Active"
                ? "details-status active"
                : member.membershipStatus ===
                  "Expired"
                ? "details-status expired"
                : "details-status inactive"
            }
          >

            {member.membershipStatus ||
              "-"}

          </span>

        </div>


        <div className="member-details-grid">

          <div className="detail-item">

            <span>
              Phone Number
            </span>

            <strong>
              {member.phone ||
                "-"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Membership Plan
            </span>

            <strong>
              {member.planName ||
                "-"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Plan Duration
            </span>

            <strong>

              {member.planDurationMonths
                ? `${
                    member.planDurationMonths
                  } ${
                    Number(
                      member.planDurationMonths
                    ) === 1
                      ? "Month"
                      : "Months"
                  }`
                : "-"}

            </strong>

          </div>


          <div className="detail-item">

            <span>
              Total Amount
            </span>

            <strong>
              ₹
              {member.totalAmount ??
                0}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Paid Amount
            </span>

            <strong>
              ₹
              {member.paidAmount ??
                0}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Pending Amount
            </span>

            <strong>
              ₹
              {member.pendingAmount ??
                0}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Payment Status
            </span>

            <strong>
              {member.paymentStatus ||
                "-"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Membership Status
            </span>

            <strong>
              {member.membershipStatus ||
                "-"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Joining Date
            </span>

            <strong>

              {formatDate(
                member.joiningDate
              )}

            </strong>

          </div>


          <div className="detail-item">

            <span>
              Expiry Date
            </span>

            <strong>

              {formatDate(
                member.expiryDate ||
                member.endDate
              )}

            </strong>

          </div>

        </div>


        {/* =====================================
            UPCOMING ADVANCE RENEWAL
            ONLY IF ADVANCE EXISTS
        ===================================== */}

        {upcomingRenewal && (

          <div className="upcoming-renewal-section">

            <div className="upcoming-renewal-header">

              <div>

                <h3>
                  Upcoming Renewal
                </h3>

                <p>
                  Advance membership renewal
                </p>

              </div>


              <span className="upcoming-renewal-badge">
                Upcoming
              </span>

            </div>


            <div className="upcoming-renewal-grid">

              <div className="upcoming-renewal-item">

                <span>
                  Next Start Date
                </span>

                <strong>
                  {formatDate(
                    upcomingRenewal.startDate
                  )}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Next Expiry Date
                </span>

                <strong>
                  {formatDate(
                    upcomingRenewal.expiryDate
                  )}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Membership Plan
                </span>

                <strong>
                  {upcomingRenewal.planName ||
                    "-"}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Plan Duration
                </span>

                <strong>

                  {upcomingRenewal
                    .planDurationMonths
                    ? `${
                        upcomingRenewal
                          .planDurationMonths
                      } ${
                        Number(
                          upcomingRenewal
                            .planDurationMonths
                        ) === 1
                          ? "Month"
                          : "Months"
                      }`
                    : "-"}

                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Total Amount
                </span>

                <strong>
                  ₹
                  {upcomingRenewal
                    .totalAmount ??
                    0}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Paid Amount
                </span>

                <strong>
                  ₹
                  {upcomingRenewal
                    .paidAmount ??
                    0}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Pending Amount
                </span>

                <strong>
                  ₹
                  {upcomingRenewal
                    .pendingAmount ??
                    0}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Payment Status
                </span>

                <strong>
                  {upcomingRenewal
                    .paymentStatus ||
                    "-"}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Payment Method
                </span>

                <strong>
                  {upcomingRenewal
                    .paymentMethod ||
                    "-"}
                </strong>

              </div>


              <div className="upcoming-renewal-item">

                <span>
                  Advance Payment Date
                </span>

                <strong>
                  {formatDate(
                    upcomingRenewal.paymentDate
                  )}
                </strong>

              </div>

            </div>


            {upcomingRenewal.remarks && (

              <div className="upcoming-renewal-remarks">

                <span>
                  Remarks
                </span>

                <p>
                  {upcomingRenewal.remarks}
                </p>

              </div>

            )}

          </div>

        )}


        {reminderError && (

          <p className="details-reminder-error">
            {reminderError}
          </p>

        )}


        <div className="member-details-actions">

          <button
            type="button"
            className="details-edit-btn"
            onClick={() =>
              navigate(
                `/members/edit/${member._id}`
              )
            }
          >
            Edit Member
          </button>


          <button
            type="button"
            className="details-whatsapp-btn"
            onClick={
              handleWhatsAppReminder
            }
            disabled={
              !canSendReminder
            }
          >

            {isExpired
              ? "WhatsApp Renewal Reminder"
              : hasPendingPayment
              ? "WhatsApp Payment Reminder"
              : "No Reminder Needed"}

          </button>

        </div>

      </div>

    </div>
  );
};


export default MemberDetails;