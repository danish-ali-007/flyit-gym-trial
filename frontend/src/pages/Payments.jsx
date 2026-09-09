import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";
import "./Payments.css";

const Payments = () => {
  const [members, setMembers] =
    useState([]);

  /* =========================
     RECORD PAYMENT
  ========================= */

  const [paymentSearch, setPaymentSearch] =
    useState("");

  const [
    selectedPaymentMember,
    setSelectedPaymentMember,
  ] = useState(null);

  const [paymentHistory, setPaymentHistory] =
    useState([]);

  const [amountPaid, setAmountPaid] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [remarks, setRemarks] =
    useState("");

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =========================
     RENEW MEMBERSHIP
  ========================= */

  const [renewalSearch, setRenewalSearch] =
    useState("");

  const [
    selectedRenewMember,
    setSelectedRenewMember,
  ] = useState(null);

  const [
    renewalHistory,
    setRenewalHistory,
  ] = useState([]);

  const [
    renewalHistoryLoading,
    setRenewalHistoryLoading,
  ] = useState(false);

  const [
    renewPlanName,
    setRenewPlanName,
  ] = useState("");

  const [
    renewDuration,
    setRenewDuration,
  ] = useState("");

  const [
    renewTotalAmount,
    setRenewTotalAmount,
  ] = useState("");

  const [
    renewPaidAmount,
    setRenewPaidAmount,
  ] = useState("");

  const [
    renewPaymentMethod,
    setRenewPaymentMethod,
  ] = useState("Cash");

  const [
    renewalStartMode,
    setRenewalStartMode,
  ] = useState("continue");

  const [
    customStartDate,
    setCustomStartDate,
  ] = useState("");

  const [
    renewalRemarks,
    setRenewalRemarks,
  ] = useState("");

  const [
    renewSubmitting,
    setRenewSubmitting,
  ] = useState(false);

  const [renewMessage, setRenewMessage] =
    useState("");

  const [renewError, setRenewError] =
    useState("");

  /* =========================
     PLAN CONFIG
  ========================= */

  const planDurationMap = {
    "1 Month Plan": 1,
    "3 Month Plan": 3,
    "6 Month Plan": 6,
    "1 Year Plan": 12,
  };

  /* =========================
     REQUEST ID
  ========================= */

  const createRequestId = (
    type = "payment"
  ) => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      return `${type}-${crypto.randomUUID()}`;
    }

    return `${type}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  };

  /* =========================
     FETCH ALL MEMBERS
  ========================= */

  const fetchMembers = async () => {
    try {
      const firstResponse =
        await api.get(
          "/members?page=1&limit=100"
        );

      const firstMembers =
        firstResponse.data.data || [];

      const totalPages =
        Number(
          firstResponse.data.pagination
            ?.totalPages || 1
        );

      if (totalPages <= 1) {
        setMembers(firstMembers);
        return;
      }

      const requests = [];

      for (
        let page = 2;
        page <= totalPages;
        page += 1
      ) {
        requests.push(
          api.get(
            `/members?page=${page}&limit=100`
          )
        );
      }

      const responses =
        await Promise.all(
          requests
        );

      const remainingMembers =
        responses.flatMap(
          (response) =>
            response.data.data || []
        );

      setMembers([
        ...firstMembers,
        ...remainingMembers,
      ]);
    } catch (error) {
      console.error(
        "Members Fetch Error:",
        error
      );

      setMembers([]);

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load members."
      );
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  /* =========================
     DATE FORMAT
  ========================= */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const toDateInputValue = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    const year =
      parsedDate.getFullYear();

    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =========================
     PAYMENT SEARCH
  ========================= */

  const paymentSearchResults =
    useMemo(() => {
      const query =
        paymentSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return [];
      }

      return members
        .filter((member) => {
          const memberId =
            String(
              member._id || ""
            ).toLowerCase();

          const phone =
            String(
              member.phone || ""
            );

          return (
            memberId.includes(query) ||
            phone.includes(query)
          );
        })
        .slice(0, 8);
    }, [
      paymentSearch,
      members,
    ]);

  /* =========================
     RENEWAL SEARCH
     Active + Expired members
  ========================= */

  const renewalSearchResults =
    useMemo(() => {
      const query =
        renewalSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return [];
      }

      return members
        .filter((member) => {
          const memberId =
            String(
              member._id || ""
            ).toLowerCase();

          const phone =
            String(
              member.phone || ""
            );

          const name =
            String(
              member.name || ""
            ).toLowerCase();

          return (
            memberId.includes(query) ||
            phone.includes(query) ||
            name.includes(query)
          );
        })
        .slice(0, 8);
    }, [
      renewalSearch,
      members,
    ]);

  /* =========================
     PAYMENT HISTORY
  ========================= */

  const fetchPaymentHistory =
    async (memberId) => {
      try {
        setHistoryLoading(true);

        const response =
          await api.get(
            `/payments/member/${memberId}`
          );

        setPaymentHistory(
          response.data.data || []
        );
      } catch (error) {
        console.error(
          "Payment History Error:",
          error
        );

        setPaymentHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

  /* =========================
     RENEWAL HISTORY
  ========================= */

  const fetchRenewalHistory =
    async (memberId) => {
      try {
        setRenewalHistoryLoading(
          true
        );

        const response =
          await api.get(
            `/payments/member/${memberId}`
          );

        const allPayments =
          response.data.data || [];

        const renewals =
          allPayments.filter(
            (payment) => {
              const requestId =
                String(
                  payment.requestId || ""
                );

              const paymentRemarks =
                String(
                  payment.remarks || ""
                ).toLowerCase();

              return (
                requestId.startsWith(
                  "renewal-"
                ) ||
                paymentRemarks.includes(
                  "renewal"
                )
              );
            }
          );

        setRenewalHistory(
          renewals
        );
      } catch (error) {
        console.error(
          "Renewal History Error:",
          error
        );

        setRenewalHistory([]);
      } finally {
        setRenewalHistoryLoading(
          false
        );
      }
    };

  /* =========================
     SELECT PAYMENT MEMBER
  ========================= */

  const handleSelectPaymentMember = (
    member
  ) => {
    setSelectedPaymentMember(
      member
    );

    setPaymentSearch("");
    setAmountPaid("");
    setRemarks("");

    setMessage("");
    setErrorMessage("");

    fetchPaymentHistory(
      member._id
    );
  };

  const clearPaymentMember = () => {
    setSelectedPaymentMember(
      null
    );

    setPaymentSearch("");
    setPaymentHistory([]);
    setAmountPaid("");
    setRemarks("");

    setMessage("");
    setErrorMessage("");
  };

  /* =========================
     SELECT RENEW MEMBER
  ========================= */

  const handleSelectRenewMember = (
    member
  ) => {
    setSelectedRenewMember(
      member
    );

    setRenewalSearch("");

    setRenewPlanName(
      member.planName || ""
    );

    setRenewDuration(
      String(
        member.planDurationMonths ||
          ""
      )
    );

    setRenewTotalAmount(
      member.totalAmount ?? ""
    );

    setRenewPaidAmount("");
    setRenewalStartMode("continue");
    setCustomStartDate("");
    setRenewalRemarks("");
    setRenewMessage("");
    setRenewError("");

    fetchRenewalHistory(
      member._id
    );
  };

  const clearRenewMember = () => {
    setSelectedRenewMember(
      null
    );

    setRenewalSearch("");

    setRenewalHistory([]);

    setRenewPlanName("");
    setRenewDuration("");
    setRenewTotalAmount("");
    setRenewPaidAmount("");
    setRenewalStartMode("continue");
    setCustomStartDate("");
    setRenewalRemarks("");

    setRenewMessage("");
    setRenewError("");
  };

  /* =========================
     PLAN CHANGE
  ========================= */

  const handleRenewPlanChange = (
    e
  ) => {
    const planName =
      e.target.value;

    setRenewPlanName(
      planName
    );

    setRenewDuration(
      planName
        ? String(
            planDurationMap[
              planName
            ]
          )
        : ""
    );

    setRenewMessage("");
    setRenewError("");
  };

  /* =========================
     RECORD PAYMENT
  ========================= */

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setMessage("");
      setErrorMessage("");

      if (
        !selectedPaymentMember
      ) {
        setErrorMessage(
          "Please select a member."
        );

        return;
      }

      const numericAmount =
        Number(amountPaid);

      if (
        !amountPaid ||
        numericAmount <= 0
      ) {
        setErrorMessage(
          "Please enter a valid payment amount."
        );

        return;
      }

      if (
        numericAmount >
        Number(
          selectedPaymentMember
            .pendingAmount || 0
        )
      ) {
        setErrorMessage(
          `Payment cannot exceed pending amount of ₹${
            selectedPaymentMember
              .pendingAmount || 0
          }.`
        );

        return;
      }

      try {
        setSubmitting(true);

        const requestId =
          createRequestId(
            "payment"
          );

        const response =
          await api.post(
            "/payments",
            {
              memberId:
                selectedPaymentMember._id,

              amountPaid:
                numericAmount,

              paymentMethod,

              remarks:
                remarks.trim() ||
                "Payment Received",

              requestId,
            }
          );

        setMessage(
          response.data.message ||
            "Payment recorded successfully."
        );

        const updatedMember =
          response.data.data
            ?.updatedMember;

        if (updatedMember) {
          const mergedMember = {
            ...selectedPaymentMember,

            paidAmount:
              updatedMember.paidAmount,

            pendingAmount:
              updatedMember.pendingAmount,

            paymentStatus:
              updatedMember.paymentStatus,
          };

          setSelectedPaymentMember(
            mergedMember
          );

          setMembers(
            (previousMembers) =>
              previousMembers.map(
                (member) =>
                  member._id ===
                  mergedMember._id
                    ? {
                        ...member,
                        ...mergedMember,
                      }
                    : member
              )
          );
        }

        setAmountPaid("");
        setRemarks("");

        await fetchPaymentHistory(
          selectedPaymentMember._id
        );
      } catch (error) {
        console.error(
          "Payment Error:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to record payment."
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =========================
     RENEW MEMBERSHIP
  ========================= */

  const handleRenewMembership =
    async (e) => {
      e.preventDefault();

      setRenewMessage("");
      setRenewError("");

      if (!selectedRenewMember) {
        setRenewError(
          "Please select an expired member first."
        );

        return;
      }

      if (!renewPlanName) {
        setRenewError(
          "Please select membership plan."
        );

        return;
      }

      const duration =
        Number(
          renewDuration
        );

      if (
        ![1, 3, 6, 12].includes(
          duration
        )
      ) {
        setRenewError(
          "Plan duration must be 1, 3, 6 or 12 months."
        );

        return;
      }

      const totalAmount =
        Number(
          renewTotalAmount
        );

      const initialPayment =
        Number(
          renewPaidAmount || 0
        );

      if (
        renewTotalAmount === "" ||
        totalAmount < 0
      ) {
        setRenewError(
          "Please enter a valid total amount."
        );

        return;
      }

      if (
        initialPayment < 0
      ) {
        setRenewError(
          "Initial payment cannot be negative."
        );

        return;
      }

      if (
        initialPayment >
        totalAmount
      ) {
        setRenewError(
          "Initial payment cannot be greater than total amount."
        );

        return;
      }

      if (
        renewalStartMode ===
          "custom" &&
        !customStartDate
      ) {
        setRenewError(
          "Please select custom start date."
        );

        return;
      }

      try {
        setRenewSubmitting(true);

        const requestId =
          createRequestId(
            "renewal"
          );

        const response =
          await api.put(
            `/payments/renew/${selectedRenewMember._id}`,
            {
              planName:
                renewPlanName,

              planDurationMonths:
                duration,

              totalAmount,

              paidAmount:
                initialPayment,

              paymentMethod:
                renewPaymentMethod,

              renewalStartMode,

              customStartDate:
                renewalStartMode ===
                "custom"
                  ? customStartDate
                  : undefined,

              remarks:
                renewalRemarks.trim(),

              requestId,
            }
          );

        const renewedMember =
          response.data.data
            ?.member;

        if (!renewedMember) {
          throw new Error(
            "Renewed member data was not received."
          );
        }

        setSelectedRenewMember(
          renewedMember
        );

        setMembers(
          (previousMembers) =>
            previousMembers.map(
              (member) =>
                member._id ===
                renewedMember._id
                  ? renewedMember
                  : member
            )
        );

        setRenewPlanName(
          renewedMember.planName ||
            ""
        );

        setRenewDuration(
          String(
            renewedMember
              .planDurationMonths ||
              ""
          )
        );

        setRenewTotalAmount(
          renewedMember.totalAmount ??
            ""
        );

        setRenewPaidAmount("");
        setCustomStartDate("");
        setRenewalRemarks("");

        setRenewMessage(
          response.data.message ||
            "Membership renewed successfully."
        );

        await fetchRenewalHistory(
          renewedMember._id
        );
      } catch (error) {
        console.error(
          "Renew Membership Error:",
          error
        );

        setRenewError(
          error.response?.data?.message ||
            error.message ||
            "Unable to renew membership."
        );
      } finally {
        setRenewSubmitting(false);
      }
    };

  return (
    <div className="payments-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="payments-header">

        <div>
          <h1>
            Payments
          </h1>

          <p>
            Manage Olympic Gym member
            payments and renewals
          </p>
        </div>

      </div>


      {/* =========================
          ORIGINAL 2 COLUMN LAYOUT
      ========================= */}

      <div className="payments-layout">

        {/* =========================
            RECORD PAYMENT
        ========================= */}

        <div className="payment-form-card">

          <div className="payment-card-heading">

            <h2>
              Record Payment
            </h2>

            <p>
              Search member by ID or
              phone number
            </p>

          </div>


          {/* SEARCH */}

          {!selectedPaymentMember && (

            <div className="payment-form-group payment-member-search">

              <label>
                Member ID / Phone Number
              </label>

              <input
                type="text"
                placeholder="GYM001 or 9876543210"
                value={
                  paymentSearch
                }
                onChange={(e) => {
                  setPaymentSearch(
                    e.target.value
                  );

                  setMessage("");
                  setErrorMessage("");
                }}
              />


              {paymentSearch && (

                <div className="payment-search-results">

                  {paymentSearchResults.length >
                  0 ? (

                    paymentSearchResults.map(
                      (member) => (

                        <button
                          type="button"
                          className="payment-search-item"
                          key={
                            member._id
                          }
                          onClick={() =>
                            handleSelectPaymentMember(
                              member
                            )
                          }
                        >

                          <div>

                            <strong>
                              {
                                member.name
                              }
                            </strong>

                            <span>
                              {
                                member._id
                              }
                            </span>

                          </div>


                          <span>
                            {
                              member.phone
                            }
                          </span>

                        </button>

                      )
                    )

                  ) : (

                    <p className="payment-search-empty">
                      No member found.
                    </p>

                  )}

                </div>

              )}

            </div>

          )}


          {selectedPaymentMember && (

            <>

              <div className="selected-payment-member-top">

                <div>

                  <strong>
                    {
                      selectedPaymentMember.name
                    }
                  </strong>

                  <span>
                    {
                      selectedPaymentMember._id
                    }
                    {" • "}
                    {
                      selectedPaymentMember.phone
                    }
                  </span>

                </div>


                <button
                  type="button"
                  className="payment-change-member-btn"
                  onClick={
                    clearPaymentMember
                  }
                >
                  Change
                </button>

              </div>


              <div className="selected-member-summary">

                <div>

                  <span>
                    Member
                  </span>

                  <strong>
                    {
                      selectedPaymentMember.name
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Plan
                  </span>

                  <strong>
                    {
                      selectedPaymentMember.planName ||
                      "-"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Total Fee
                  </span>

                  <strong>
                    ₹
                    {
                      selectedPaymentMember.totalAmount ??
                      0
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Paid
                  </span>

                  <strong>
                    ₹
                    {
                      selectedPaymentMember.paidAmount ??
                      0
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Pending
                  </span>

                  <strong>
                    ₹
                    {
                      selectedPaymentMember.pendingAmount ??
                      0
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Status
                  </span>

                  <strong>
                    {
                      selectedPaymentMember.paymentStatus ||
                      "-"
                    }
                  </strong>

                </div>

              </div>


              <form
                onSubmit={
                  handleSubmit
                }
              >

                <div className="payment-form-group">

                  <label>
                    Amount Paid
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={
                      selectedPaymentMember.pendingAmount
                    }
                    placeholder="Enter payment amount"
                    value={
                      amountPaid
                    }
                    onChange={(e) =>
                      setAmountPaid(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>


                <div className="payment-form-group">

                  <label>
                    Payment Method
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
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


                <div className="payment-form-group">

                  <label>
                    Remarks
                  </label>

                  <textarea
                    rows="3"
                    placeholder="Optional remarks"
                    value={
                      remarks
                    }
                    onChange={(e) =>
                      setRemarks(
                        e.target.value
                      )
                    }
                  />

                </div>


                {errorMessage && (

                  <p className="payment-error-message">
                    {errorMessage}
                  </p>

                )}


                {message && (

                  <p className="payment-success-message">
                    {message}
                  </p>

                )}


                <button
                  type="submit"
                  className="record-payment-btn"
                  disabled={
                    submitting ||
                    Number(
                      selectedPaymentMember.pendingAmount ||
                        0
                    ) <= 0
                  }
                >

                  {submitting
                    ? "Recording..."
                    : Number(
                        selectedPaymentMember.pendingAmount ||
                          0
                      ) <= 0
                    ? "Payment Completed"
                    : "Record Payment"}

                </button>

              </form>

            </>

          )}

        </div>


        {/* =========================
            PAYMENT HISTORY
        ========================= */}

        <div className="payment-history-card">

          <div className="payment-card-heading">

            <h2>
              Payment History
            </h2>

            <p>
              Previous payments for
              selected member
            </p>

          </div>


          {!selectedPaymentMember ? (

            <p className="payment-empty">
              Select a member to view
              payment history.
            </p>

          ) : historyLoading ? (

            <p className="payment-empty">
              Loading payment history...
            </p>

          ) : paymentHistory.length ===
            0 ? (

            <p className="payment-empty">
              No payment history found.
            </p>

          ) : (

            <div className="payment-table-container">

              <table className="payment-table">

                <thead>

                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Remarks</th>
                  </tr>

                </thead>


                <tbody>

                  {paymentHistory.map(
                    (payment) => (

                      <tr
                        key={
                          payment._id
                        }
                      >

                        <td>
                          {formatDate(
                            payment.createdAt
                          )}
                        </td>

                        <td>
                          ₹
                          {
                            payment.amountPaid ??
                            0
                          }
                        </td>

                        <td>
                          {
                            payment.paymentMethod ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            payment.remarks ||
                            "-"
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>


      {/* =========================
          RENEW MEMBERSHIP
      ========================= */}

      <section className="renew-membership-section">

        <div className="renew-membership-card">

          <div className="renew-heading">

            <div>

              <h2>
                Renew Membership
              </h2>

              <p>
                Search active or expired member by
                ID, name or phone number
              </p>

            </div>

          </div>


          {!selectedRenewMember && (

            <div className="payment-form-group payment-member-search">

              <label>
                Member ID / Name /
                Phone Number
              </label>

              <input
                type="text"
                placeholder="GYM007, Rajkumar or 9988776655"
                value={
                  renewalSearch
                }
                onChange={(e) => {
                  setRenewalSearch(
                    e.target.value
                  );

                  setRenewMessage("");
                  setRenewError("");
                }}
              />


              {renewalSearch && (

                <div className="payment-search-results">

                  {renewalSearchResults.length >
                  0 ? (

                    renewalSearchResults.map(
                      (member) => (

                        <button
                          type="button"
                          className="payment-search-item"
                          key={
                            member._id
                          }
                          onClick={() =>
                            handleSelectRenewMember(
                              member
                            )
                          }
                        >

                          <div>

                            <strong>
                              {
                                member.name
                              }
                            </strong>

                            <span>
                              {
                                member._id
                              }
                              {" • "}
                              {
                                member.membershipStatus ||
                                "-"
                              }
                              {" • Expiry "}
                              {formatDate(
                                member.expiryDate
                              )}
                            </span>

                          </div>


                          <span>
                            {
                              member.phone
                            }
                          </span>

                        </button>

                      )
                    )

                  ) : (

                    <p className="payment-search-empty">
                      No member found.
                    </p>

                  )}

                </div>

              )}

            </div>

          )}


          {!selectedRenewMember ? (

            <p className="renew-empty">
              Search and select a member
              to renew membership.
            </p>

          ) : (

            <>

              <div className="selected-renew-member-top">

                <div>

                  <strong>
                    {
                      selectedRenewMember.name
                    }
                  </strong>

                  <span>
                    {
                      selectedRenewMember._id
                    }
                    {" • "}
                    {
                      selectedRenewMember.phone
                    }
                  </span>

                </div>


                <button
                  type="button"
                  className="payment-change-member-btn"
                  onClick={
                    clearRenewMember
                  }
                >
                  Change
                </button>

              </div>


              <form
                className="renew-form"
                onSubmit={
                  handleRenewMembership
                }
              >

                <div className="renew-member-info">

                  <div>

                    <span>
                      Member
                    </span>

                    <strong>
                      {
                        selectedRenewMember.name
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Current Expiry
                    </span>

                    <strong>
                      {formatDate(
                        selectedRenewMember.expiryDate
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Current Status
                    </span>

                    <strong>
                      {
                        selectedRenewMember.membershipStatus ||
                        "Expired"
                      }
                    </strong>

                  </div>

                </div>


                <div className="renew-form-grid">

                  <div className="payment-form-group">

                    <label>
                      Renewal Start
                    </label>

                    <select
                      value={
                        renewalStartMode
                      }
                      onChange={(e) => {
                        setRenewalStartMode(
                          e.target.value
                        );

                        setRenewMessage("");
                        setRenewError("");
                      }}
                    >
                      <option value="continue">
                        Continue After Current Expiry
                      </option>

                      <option
                        value="today"
                        disabled={
                          selectedRenewMember
                            ?.membershipStatus ===
                          "Active"
                        }
                      >
                        Start from Today
                      </option>

                      <option value="custom">
                        Custom Start Date
                      </option>
                    </select>

                  </div>


                  {renewalStartMode ===
                    "custom" && (
                    <div className="payment-form-group">

                      <label>
                        Custom Start Date
                      </label>

                      <input
                        type="date"
                        value={
                          customStartDate
                        }
                        min={
                          toDateInputValue(
                            selectedRenewMember.expiryDate
                          )
                        }
                        onChange={(e) => {
                          setCustomStartDate(
                            e.target.value
                          );

                          setRenewMessage("");
                          setRenewError("");
                        }}
                        required
                      />

                    </div>
                  )}


                  <div className="payment-form-group">

                    <label>
                      Membership Plan
                    </label>

                    <select
                      value={
                        renewPlanName
                      }
                      onChange={
                        handleRenewPlanChange
                      }
                      required
                    >

                      <option value="">
                        Select Plan
                      </option>

                      <option value="1 Month Plan">
                        1 Month Plan
                      </option>

                      <option value="3 Month Plan">
                        3 Month Plan
                      </option>

                      <option value="6 Month Plan">
                        6 Month Plan
                      </option>

                      <option value="1 Year Plan">
                        1 Year Plan
                      </option>

                    </select>

                  </div>


                  <div className="payment-form-group">

                    <label>
                      Duration
                    </label>

                    <input
                      type="text"
                      value={
                        renewDuration
                          ? `${
                              renewDuration
                            } ${
                              Number(
                                renewDuration
                              ) === 1
                                ? "Month"
                                : "Months"
                            }`
                          : ""
                      }
                      readOnly
                    />

                  </div>


                  <div className="payment-form-group">

                    <label>
                      Total Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      placeholder="Enter total fee"
                      value={
                        renewTotalAmount
                      }
                      onChange={(e) =>
                        setRenewTotalAmount(
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>


                  <div className="payment-form-group">

                    <label>
                      Initial Payment
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={
                        renewTotalAmount ||
                        undefined
                      }
                      placeholder="Enter initial payment"
                      value={
                        renewPaidAmount
                      }
                      onChange={(e) =>
                        setRenewPaidAmount(
                          e.target.value
                        )
                      }
                    />

                  </div>


                  <div className="payment-form-group">

                    <label>
                      Payment Method
                    </label>

                    <select
                      value={
                        renewPaymentMethod
                      }
                      onChange={(e) =>
                        setRenewPaymentMethod(
                          e.target.value
                        )
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


                  <div className="payment-form-group">

                    <label>
                      Renewal Remarks
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Advance payment received"
                      value={
                        renewalRemarks
                      }
                      onChange={(e) =>
                        setRenewalRemarks(
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>


                {renewError && (

                  <p className="payment-error-message">
                    {renewError}
                  </p>

                )}


                {renewMessage && (

                  <p className="payment-success-message">
                    {renewMessage}
                  </p>

                )}


                <button
                  type="submit"
                  className="renew-membership-btn"
                  disabled={
                    renewSubmitting
                  }
                >

                  {renewSubmitting
                    ? "Renewing..."
                    : "Renew Membership"}

                </button>

              </form>

            </>

          )}

        </div>

      </section>


      {/* =========================
          RENEWAL HISTORY
      ========================= */}

      <section className="renewal-history-section">

        <div className="renewal-history-card">

          <div className="renewal-history-heading">

            <h2>
              Renewal History
            </h2>

            <p>
              Previous membership renewal
              payments for selected member
            </p>

          </div>


          {!selectedRenewMember ? (

            <p className="renewal-history-empty">
              Select a member to
              view renewal history.
            </p>

          ) : renewalHistoryLoading ? (

            <p className="renewal-history-empty">
              Loading renewal history...
            </p>

          ) : renewalHistory.length ===
            0 ? (

            <p className="renewal-history-empty">
              No renewal payment history
              found.
            </p>

          ) : (

            <div className="renewal-history-table-container">

              <table className="renewal-history-table">

                <thead>

                  <tr>

                    <th>
                      Renewal Date
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Payment Method
                    </th>

                    <th>
                      Remarks
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {renewalHistory.map(
                    (renewal) => (

                      <tr
                        key={
                          renewal._id
                        }
                      >

                        <td>
                          {formatDate(
                            renewal.createdAt
                          )}
                        </td>

                        <td>
                          ₹
                          {
                            renewal.amountPaid ??
                            0
                          }
                        </td>

                        <td>
                          {
                            renewal.paymentMethod ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            renewal.remarks ||
                            "-"
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

      <div className="page-powered-by">
      Powered by <span>Flyit Systems</span>
    </div>

    </div>
  );
};

export default Payments;