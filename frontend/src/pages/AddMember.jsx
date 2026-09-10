import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./AddMember.css";

const AddMember = () => {
  const navigate = useNavigate();


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


  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    planName: "1 Month Plan",
    planDurationMonths: "1",
    totalAmount: "",
    paidAmount: "",
    joiningDate: "",
    paymentMethod: "Cash",
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  // =========================================
  // NORMAL INPUT CHANGE
  // =========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

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

    setFormData((previous) => ({
      ...previous,

      planName,

      planDurationMonths:
        String(
          durationMap[planName] || 1
        ),
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };


  // =========================================
  // ADD MEMBER
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");


    // Member Name
    if (!formData.name.trim()) {
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


    // Total Amount
    if (
      formData.totalAmount === "" ||
      Number(
        formData.totalAmount
      ) < 0
    ) {
      setErrorMessage(
        "Please enter a valid total amount."
      );

      return;
    }


    const totalAmount =
      Number(
        formData.totalAmount
      );


    const paidAmount =
      Number(
        formData.paidAmount || 0
      );


    // Paid Amount
    if (paidAmount < 0) {
      setErrorMessage(
        "Paid amount cannot be negative."
      );

      return;
    }


    if (
      paidAmount >
      totalAmount
    ) {
      setErrorMessage(
        "Paid amount cannot be greater than total amount."
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
          Number(
            formData.planDurationMonths
          ),

        totalAmount,

        paidAmount,

        paymentMethod:
          formData.paymentMethod,
      };


      // Joining Date optional
      if (
        formData.joiningDate
      ) {
        payload.joiningDate =
          formData.joiningDate;
      }


      const response =
        await api.post(
          "/members",
          payload
        );


      console.log(
        "Add Member Response:",
        response.data
      );


      setSuccessMessage(
        response.data.message ||
          "Member added successfully."
      );


      navigate(
        "/members",
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        "Add Member Error:",
        error
      );


      setErrorMessage(
        error.response?.data
          ?.message ||
          "Unable to add member."
      );

    } finally {

      setSubmitting(false);

    }
  };


  return (
    <div className="add-member-page">


      {/* =========================================
          HEADER
      ========================================= */}

      <div className="add-member-header">

        <div>

          <h1>
            Add Member
          </h1>

          <p>
            Add a new {gymName} member
          </p>

        </div>


        <button
          type="button"
          className="back-member-btn"
          onClick={() =>
            navigate("/members")
          }
        >
          Back
        </button>

      </div>


      {/* =========================================
          FORM CARD
      ========================================= */}

      <div className="add-member-card">

        <form
          className="add-member-form"
          onSubmit={handleSubmit}
        >


          {/* MEMBER NAME */}

          <div className="form-group">

            <label>
              Member Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter member name"
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

          <div className="form-group">

            <label>
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              placeholder="Enter 10 digit phone number"
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

          <div className="form-group">

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
            >

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

          <div className="form-group">

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

          <div className="form-group">

            <label>
              Total Fee
            </label>

            <input
              type="number"
              name="totalAmount"
              min="0"
              placeholder="Enter total fee"
              value={
                formData.totalAmount
              }
              onChange={
                handleChange
              }
              required
            />

          </div>


          {/* INITIAL PAYMENT */}

          <div className="form-group">

            <label>
              Initial Payment
            </label>

            <input
              type="number"
              name="paidAmount"
              min="0"
              placeholder="Enter initial payment"
              value={
                formData.paidAmount
              }
              onChange={
                handleChange
              }
            />

          </div>


          {/* PAYMENT METHOD */}

          <div className="form-group">

            <label>
              Payment Method
            </label>

            <select
              name="paymentMethod"
              value={
                formData.paymentMethod
              }
              onChange={
                handleChange
              }
            >

              <option value="Cash">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="Card">
                Card
              </option>

              <option value="Bank Transfer">
                Bank Transfer
              </option>

            </select>

          </div>


          {/* JOINING DATE */}

          <div className="form-group">

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


          {/* ERROR */}

          {errorMessage && (
            <p className="add-member-error">
              {errorMessage}
            </p>
          )}


          {/* SUCCESS */}

          {successMessage && (
            <p className="add-member-success">
              {successMessage}
            </p>
          )}


          {/* ACTIONS */}

          <div className="add-member-actions">

            <button
              type="button"
              className="cancel-member-btn"
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
              className="save-member-btn"
              disabled={
                submitting
              }
            >
              {submitting
                ? "Adding Member..."
                : "Add Member"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddMember;