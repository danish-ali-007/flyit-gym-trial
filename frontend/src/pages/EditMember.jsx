import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FiArrowLeft,
} from "react-icons/fi";

import api from "../services/api";
import "./EditMember.css";

const EditMember = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] =
    useState({
      name: "",
      phone: "",
      planName: "",
      planDurationMonths: "",
      totalAmount: "",
      paidAmount: "",
      membershipStatus: "Active",
      joiningDate: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  // =========================================
  // FETCH MEMBER
  // =========================================

  const fetchMember = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get(
        `/members/${id}`
      );

      const member =
        response.data.data;

      let normalizedPlanName =
        member.planName || "";

      // Old database plan names support
      const oldPlanMap = {
        Monthly: "1 Month Plan",
        Quarterly: "3 Month Plan",
        "Half Yearly": "6 Month Plan",
        Yearly: "1 Year Plan",
      };

      if (
        oldPlanMap[
          normalizedPlanName
        ]
      ) {
        normalizedPlanName =
          oldPlanMap[
            normalizedPlanName
          ];
      }

      setFormData({
        name:
          member.name || "",

        phone:
          member.phone || "",

        planName:
          normalizedPlanName,

        planDurationMonths:
          String(
            member.planDurationMonths ||
              ""
          ),

        totalAmount:
          member.totalAmount ?? "",

        paidAmount:
          member.paidAmount ?? "",

        membershipStatus:
          member.membershipStatus ||
          "Active",

        joiningDate:
          member.joiningDate
            ? new Date(
                member.joiningDate
              )
                .toISOString()
                .split("T")[0]
            : "",
      });

    } catch (error) {

      console.error(
        "Edit Member Fetch Error:",
        error
      );

      setErrorMessage(
        error.response?.data
          ?.message ||
          "Unable to load member details."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    fetchMember();
  }, [id]);


  // =========================================
  // NORMAL INPUT CHANGE
  // =========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setErrorMessage("");
    setSuccessMessage("");
  };


  // =========================================
  // PLAN CHANGE
  // =========================================

  const handlePlanChange = (e) => {
    const planName =
      e.target.value;

    const durationMap = {
      "1 Month Plan": 1,
      "3 Month Plan": 3,
      "6 Month Plan": 6,
      "1 Year Plan": 12,
    };

    setFormData(
      (previous) => ({
        ...previous,

        planName,

        planDurationMonths:
          String(
            durationMap[planName] ||
              1
          ),
      })
    );

    setErrorMessage("");
    setSuccessMessage("");
  };


  // =========================================
  // UPDATE MEMBER
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");


    // Name
    if (
      !formData.name.trim()
    ) {
      setErrorMessage(
        "Please enter member name."
      );

      return;
    }


    // Phone
    const cleanPhone =
      formData.phone.replace(
        /\D/g,
        ""
      );

    if (
      cleanPhone.length !== 10
    ) {
      setErrorMessage(
        "Please enter a valid 10 digit phone number."
      );

      return;
    }


    // Duration
    const duration =
      Number(
        formData.planDurationMonths
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
      setErrorMessage(
        "Plan duration must be 1, 3, 6 or 12 months."
      );

      return;
    }


    // Amounts
    const totalAmount =
      Number(
        formData.totalAmount
      );

    const paidAmount =
      Number(
        formData.paidAmount ||
          0
      );


    if (
      Number.isNaN(
        totalAmount
      ) ||
      totalAmount < 0
    ) {
      setErrorMessage(
        "Please enter a valid total amount."
      );

      return;
    }


    if (
      Number.isNaN(
        paidAmount
      ) ||
      paidAmount < 0
    ) {
      setErrorMessage(
        "Please enter a valid paid amount."
      );

      return;
    }


    if (
      paidAmount >
      totalAmount
    ) {
      setErrorMessage(
        "Paid amount cannot exceed total amount."
      );

      return;
    }


    try {
      setSubmitting(true);


      const payload = {
        name:
          formData.name.trim(),

        phone:
          cleanPhone,

        planName:
          formData.planName,

        planDurationMonths:
          duration,

        totalAmount,

        paidAmount,

        membershipStatus:
          formData.membershipStatus,
      };


      if (
        formData.joiningDate
      ) {
        payload.joiningDate =
          formData.joiningDate;
      }


      const response =
        await api.put(
          `/members/${id}`,
          payload
        );


      setSuccessMessage(
        response.data.message ||
          "Member updated successfully."
      );


      setTimeout(() => {
        navigate(
          `/members/view/${id}`,
          {
            replace: true,
          }
        );
      }, 500);

    } catch (error) {

      console.error(
        "Update Member Error:",
        error
      );


      setErrorMessage(
        error.response?.data
          ?.message ||
          "Unable to update member."
      );

    } finally {

      setSubmitting(false);

    }
  };


  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="edit-member-page">

        <p className="edit-member-loading">
          Loading member details...
        </p>

      </div>
    );
  }


  return (
    <div className="edit-member-page">


      {/* =========================================
          HEADER
      ========================================= */}

      <div className="edit-member-header">

        <div>

          <h1>
            Edit Member
          </h1>

          <p>
            Update Olympic Gym member information
          </p>

        </div>


        <button
          type="button"
          className="edit-back-btn"
          onClick={() =>
            navigate("/members")
          }
          aria-label="Back to members"
          title="Back to Members"
        >
          <FiArrowLeft />
        </button>

      </div>


      {/* =========================================
          ERROR
      ========================================= */}

      {errorMessage && (
        <p className="edit-member-error">
          {errorMessage}
        </p>
      )}


      {/* =========================================
          FORM
      ========================================= */}

      <form
        className="edit-member-form"
        onSubmit={handleSubmit}
      >

        <div className="edit-form-grid">


          {/* NAME */}

          <div className="edit-form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              required
            />

          </div>


          {/* PHONE */}

          <div className="edit-form-group">

            <label>
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={
                formData.phone
              }
              onChange={
                handleChange
              }
              maxLength="10"
              required
            />

          </div>


          {/* MEMBERSHIP PLAN */}

          <div className="edit-form-group">

            <label>
              Membership Plan
            </label>

            <select
              name="planName"
              value={
                formData.planName
              }
              onChange={
                handlePlanChange
              }
              required
            >

              <option value="">
                Select Plan
              </option>

              <option
                value="1 Month Plan"
              >
                1 Month Plan
              </option>

              <option
                value="3 Month Plan"
              >
                3 Month Plan
              </option>

              <option
                value="6 Month Plan"
              >
                6 Month Plan
              </option>

              <option
                value="1 Year Plan"
              >
                1 Year Plan
              </option>

            </select>

          </div>


          {/* PLAN DURATION */}

          <div className="edit-form-group">

            <label>
              Plan Duration
            </label>

            <input
              type="number"
              name="planDurationMonths"
              value={
                formData.planDurationMonths
              }
              readOnly
            />

          </div>


          {/* TOTAL FEE */}

          <div className="edit-form-group">

            <label>
              Total Fee
            </label>

            <input
              type="number"
              name="totalAmount"
              min="0"
              value={
                formData.totalAmount
              }
              onChange={
                handleChange
              }
              required
            />

          </div>


          {/* PAID AMOUNT */}

          <div className="edit-form-group">

            <label>
              Paid Amount
            </label>

            <input
              type="number"
              name="paidAmount"
              min="0"
              value={
                formData.paidAmount
              }
              onChange={
                handleChange
              }
            />

          </div>


          {/* JOINING DATE */}

          <div className="edit-form-group">

            <label>
              Joining Date
            </label>

            <input
              type="date"
              name="joiningDate"
              value={
                formData.joiningDate
              }
              onChange={
                handleChange
              }
            />

          </div>


          {/* STATUS */}

          <div className="edit-form-group">

            <label>
              Membership Status
            </label>

            <select
              name="membershipStatus"
              value={
                formData.membershipStatus
              }
              onChange={
                handleChange
              }
            >

              <option value="Active">
                Active
              </option>

              <option value="Expired">
                Expired
              </option>

              <option value="Inactive">
                Inactive
              </option>

            </select>

          </div>

        </div>


        {/* SUCCESS */}

        {successMessage && (
          <p className="edit-member-success">
            {successMessage}
          </p>
        )}


        {/* ACTIONS */}

        <div className="edit-form-actions">

          <button
            type="button"
            className="edit-cancel-btn"
            onClick={() =>
              navigate("/members")
            }
            disabled={
              submitting
            }
          >
            Cancel
          </button>


          <button
            type="submit"
            className="update-member-btn"
            disabled={
              submitting
            }
          >
            {submitting
              ? "Updating..."
              : "Update Member"}
          </button>

        </div>

      </form>

    </div>
  );
};

export default EditMember;