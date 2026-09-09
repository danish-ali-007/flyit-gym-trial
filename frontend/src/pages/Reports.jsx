import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiClock,
  FiPieChart,
} from "react-icons/fi";

import api from "../services/api";
import "./Reports.css";


// ====================================================
// REPORT CACHE
// Reports page dobara open karne par previous
// data immediately show hoga.
// ====================================================

let reportsCache = null;


const Reports = () => {

  const revenueSectionRef = useRef(null);

  /* =========================
     STATE
  ========================= */

  const [
    reportData,
    setReportData,
  ] = useState(
    reportsCache?.reportData || {
      monthlyRevenue: 0,
      pendingPayments: 0,
      activeMembers: 0,
      expiredMembers: 0,
      planBreakdown: [],
      pendingList: [],
    }
  );


  const [
    monthlyRevenueHistory,
    setMonthlyRevenueHistory,
  ] = useState(
    reportsCache
      ?.monthlyRevenueHistory ||
      []
  );


  const [
    members,
    setMembers,
  ] = useState(
    reportsCache?.members ||
      []
  );


  const [
    dataReady,
    setDataReady,
  ] = useState(
    Boolean(reportsCache)
  );


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const [
    membershipFilter,
    setMembershipFilter,
  ] = useState("All");


  /* =========================
     FETCH ALL MEMBERS
     PAGINATION SAFE
  ========================= */

  const fetchAllMembers = async () => {

    const firstResponse =
      await api.get(
        "/members?page=1&limit=100"
      );


    let allMembers =
      firstResponse.data.data || [];


    const totalPages =
      firstResponse.data.pagination
        ?.totalPages || 1;


    if (totalPages > 1) {

      const requests = [];


      for (
        let page = 2;
        page <= totalPages;
        page++
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


      responses.forEach(
        (response) => {

          allMembers = [
            ...allMembers,
            ...(response.data.data || []),
          ];

        }
      );
    }


    return allMembers;
  };


  /* =========================
     FETCH REPORT DATA
  ========================= */

  const fetchReportsData =
    async () => {

      try {

        setErrorMessage("");


        const [
          reportsResponse,
          revenueResponse,
          allMembers,
        ] =
          await Promise.all([

            api.get("/reports"),

            api.get(
              "/dashboard/reports/monthly-revenue"
            ),

            fetchAllMembers(),

          ]);


        /* REPORT API */

        const reports =
          reportsResponse.data || {};


        const newReportData = {

          monthlyRevenue:
            Number(
              reports.monthlyRevenue || 0
            ),

          pendingPayments:
            Number(
              reports.pendingPayments || 0
            ),

          activeMembers:
            Number(
              reports.activeMembers || 0
            ),

          expiredMembers:
            Number(
              reports.expiredMembers || 0
            ),

          planBreakdown:
            reports.planBreakdown || [],

          pendingList:
            reports.pendingList || [],

        };


        /* MONTHLY HISTORY */

        const newMonthlyRevenueHistory =
          revenueResponse.data.data ||
          [];


        /* MEMBERS */

        const newMembers =
          allMembers || [];


        /* UPDATE UI */

        setReportData(
          newReportData
        );


        setMonthlyRevenueHistory(
          newMonthlyRevenueHistory
        );


        setMembers(
          newMembers
        );


        setDataReady(true);


        /* UPDATE CACHE */

        reportsCache = {
          reportData:
            newReportData,

          monthlyRevenueHistory:
            newMonthlyRevenueHistory,

          members:
            newMembers,
        };


      } catch (error) {

        console.error(
          "Reports Fetch Error:",
          error
        );


        /*
          Agar cached/current data already
          hai to usko remove nahi karenge.
        */

        if (
          !reportsCache &&
          !dataReady
        ) {

          setErrorMessage(
            error.response?.data?.message ||
              "Unable to load reports."
          );

          setDataReady(true);
        }

      }
    };


  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {

    /*
      Cache available ho to state already
      populated hai.

      API fir bhi background me chalegi
      so latest values milengi.
    */

    fetchReportsData();

  }, []);


  /* =========================
     REVENUE SECTION NAVIGATION
  ========================= */

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get("section") ===
      "revenue"
    ) {

      requestAnimationFrame(() => {

        revenueSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

      });
    }

  }, []);


  /* =========================
     TOTAL MEMBERS
  ========================= */

  const totalMembers =
    useMemo(() => {

      return members.length;

    }, [members]);


  /* =========================
     PAYMENT SUMMARY
  ========================= */

  const paymentSummary =
    useMemo(() => {

      return members.reduce(
        (
          summary,
          member
        ) => {

          if (
            member.paymentStatus ===
            "Paid"
          ) {

            summary.paid += 1;

          } else if (
            member.paymentStatus ===
            "Partial"
          ) {

            summary.partial += 1;

          } else {

            summary.pending += 1;

          }


          return summary;

        },
        {
          paid: 0,
          partial: 0,
          pending: 0,
        }
      );

    }, [members]);


  /* =========================
     TOTAL TRANSACTIONS
  ========================= */

  const totalTransactions =
    useMemo(() => {

      return monthlyRevenueHistory.reduce(
        (
          total,
          item
        ) => {

          return (
            total +
            Number(
              item.totalTransactions || 0
            )
          );

        },
        0
      );

    }, [
      monthlyRevenueHistory,
    ]);


  /* =========================
     MEMBERSHIP FILTER
  ========================= */

  const filteredMembershipMembers =
    useMemo(() => {

      if (
        membershipFilter ===
        "All"
      ) {

        return members;

      }


      return members.filter(
        (member) =>
          member.membershipStatus ===
          membershipFilter
      );

    }, [
      members,
      membershipFilter,
    ]);


  /* =========================
     FORMAT MONTH
  ========================= */

  const formatMonth = (
    year,
    month
  ) => {

    if (
      !year ||
      !month
    ) {
      return "-";
    }


    return new Date(
      year,
      month - 1
    ).toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  };


  /* =========================
     FORMAT DATE
  ========================= */

  const formatDate = (
    date
  ) => {

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
      "en-IN"
    );
  };


  /* =========================
     CURRENCY
  ========================= */

  const formatCurrency =
    (amount) => {

      return Number(
        amount || 0
      ).toLocaleString(
        "en-IN"
      );

    };


  /* =========================
     ERROR
  ========================= */

  if (
    dataReady &&
    errorMessage &&
    !reportsCache
  ) {

    return (
      <div className="reports-page">

        <div className="reports-error-box">

          <h2>
            Unable to load reports
          </h2>

          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={
              fetchReportsData
            }
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  return (
    <div className="reports-page">


      {/* =========================
          HEADER
      ========================= */}

      <div className="reports-header">

        <div>

          <h1>
            Reports
          </h1>

          <p>
            Olympic Gym performance and
            financial overview
          </p>

        </div>

      </div>


      {/* =========================
          SUMMARY CARDS
      ========================= */}

      <div className="reports-summary-grid">


        <div className="report-summary-card">

          <div className="report-icon">
            <FiUsers />
          </div>

          <div>

            <span>
              Total Members
            </span>

            <h2>
              {totalMembers}
            </h2>

          </div>

        </div>


        <div className="report-summary-card">

          <div className="report-icon">
            <FiUserCheck />
          </div>

          <div>

            <span>
              Active Members
            </span>

            <h2>
              {
                reportData.activeMembers
              }
            </h2>

          </div>

        </div>


        <div className="report-summary-card">

          <div className="report-icon">
            <FiUserX />
          </div>

          <div>

            <span>
              Expired Members
            </span>

            <h2>
              {
                reportData.expiredMembers
              }
            </h2>

          </div>

        </div>


        <div className="report-summary-card">

          <div className="report-icon">
            <FiTrendingUp />
          </div>

          <div>

            <span>
              This Month Revenue
            </span>

            <h2>
              ₹
              {formatCurrency(
                reportData.monthlyRevenue
              )}
            </h2>

          </div>

        </div>


        <div className="report-summary-card">

          <div className="report-icon">
            <FiClock />
          </div>

          <div>

            <span>
              Pending Amount
            </span>

            <h2>
              ₹
              {formatCurrency(
                reportData.pendingPayments
              )}
            </h2>

          </div>

        </div>


        <div className="report-summary-card">

          <div className="report-icon">
            <FiPieChart />
          </div>

          <div>

            <span>
              Transactions
            </span>

            <h2>
              {totalTransactions}
            </h2>

          </div>

        </div>

      </div>


      {/* =========================
          PAYMENT STATUS
      ========================= */}

      <section className="report-section">

        <div className="report-section-heading">

          <h2>
            Payment Status Summary
          </h2>

          <p>
            Current payment position of
            Olympic Gym members
          </p>

        </div>


        <div className="payment-status-grid">


          <div className="payment-status-card paid">

            <span>
              Paid
            </span>

            <h3>
              {paymentSummary.paid}
            </h3>

          </div>


          <div className="payment-status-card partial">

            <span>
              Partial
            </span>

            <h3>
              {paymentSummary.partial}
            </h3>

          </div>


          <div className="payment-status-card pending">

            <span>
              Pending
            </span>

            <h3>
              {paymentSummary.pending}
            </h3>

          </div>


        </div>

      </section>


      {/* =========================
          PLAN BREAKDOWN
      ========================= */}

      <section className="report-section">

        <div className="report-section-heading">

          <h2>
            Membership Plan Summary
          </h2>

          <p>
            Member count and revenue by
            membership plan
          </p>

        </div>


        <div className="reports-table-card">

          {!dataReady ? null :

          reportData.planBreakdown.length ===
          0 ? (

            <p className="reports-empty">
              No membership plan data found.
            </p>

          ) : (

            <div className="reports-table-container">

              <table className="reports-table">

                <thead>

                  <tr>

                    <th>
                      Plan
                    </th>

                    <th>
                      Members
                    </th>

                    <th>
                      Revenue
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {reportData.planBreakdown.map(
                    (
                      plan,
                      index
                    ) => (

                      <tr
                        key={`${plan.name}-${index}`}
                      >

                        <td>
                          {plan.name}
                        </td>

                        <td>
                          {plan.count || 0}
                        </td>

                        <td>
                          ₹
                          {formatCurrency(
                            plan.revenue
                          )}
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


      {/* =========================
          PENDING PAYMENT REPORT
      ========================= */}

      <section className="report-section">

        <div className="report-section-heading">

          <h2>
            Pending Payment Report
          </h2>

          <p>
            Members with outstanding
            membership fees
          </p>

        </div>


        <div className="reports-table-card">

          {!dataReady ? null :

          reportData.pendingList.length ===
          0 ? (

            <p className="reports-empty">
              No pending payments found.
            </p>

          ) : (

            <div className="reports-table-container">

              <table
                className="
                  reports-table
                  pending-report-table
                "
              >

                <thead>

                  <tr>

                    <th>
                      Member ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Pending
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Due Date
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {reportData.pendingList.map(
                    (member) => (

                      <tr
                        key={
                          member._id
                        }
                      >

                        <td>
                          {member._id}
                        </td>

                        <td>
                          {member.name}
                        </td>

                        <td>
                          {member.phone}
                        </td>

                        <td>

                          <strong className="pending-amount-text">

                            ₹
                            {formatCurrency(
                              member.pendingAmount
                            )}

                          </strong>

                        </td>

                        <td>

                          <span className="report-payment-status">

                            {
                              member.paymentStatus ||
                              "-"
                            }

                          </span>

                        </td>

                        <td>
                          {formatDate(
                            member.dueDate
                          )}
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


      {/* =========================
          MEMBERSHIP REPORT
      ========================= */}

      <section className="report-section">

        <div className="membership-report-header">


          <div
            className="
              report-section-heading
              membership-heading
            "
          >

            <h2>
              Membership Report
            </h2>

            <p>
              Detailed Olympic Gym
              membership status
            </p>

          </div>


          <select
            className="membership-report-filter"
            value={
              membershipFilter
            }
            onChange={(e) =>
              setMembershipFilter(
                e.target.value
              )
            }
          >

            <option value="All">
              All Members
            </option>

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


        <div className="reports-table-card">

          {!dataReady ? null :

          filteredMembershipMembers.length ===
          0 ? (

            <p className="reports-empty">
              No members found for this
              filter.
            </p>

          ) : (

            <div className="reports-table-container">

              <table
                className="
                  reports-table
                  membership-report-table
                "
              >

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Plan
                    </th>

                    <th>
                      Joining Date
                    </th>

                    <th>
                      Expiry Date
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredMembershipMembers.map(
                    (member) => (

                      <tr
                        key={
                          member._id
                        }
                      >

                        <td>
                          {member._id}
                        </td>

                        <td>
                          {member.name}
                        </td>

                        <td>
                          {member.phone}
                        </td>

                        <td>
                          {
                            member.planName ||
                            "-"
                          }
                        </td>

                        <td>
                          {formatDate(
                            member.joiningDate
                          )}
                        </td>

                        <td>
                          {formatDate(
                            member.expiryDate
                          )}
                        </td>

                        <td>

                          <span
                            className={`membership-report-status ${
                              member.membershipStatus ===
                              "Active"
                                ? "active"
                                : member.membershipStatus ===
                                  "Expired"
                                ? "expired"
                                : "inactive"
                            }`}
                          >

                            {
                              member.membershipStatus ||
                              "-"
                            }

                          </span>

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


      {/* =========================
          MONTHLY REVENUE HISTORY
      ========================= */}

      <section
        className="report-section"
        ref={revenueSectionRef}
      >

        <div className="report-section-heading">

          <h2>
            Monthly Revenue Report
          </h2>

          <p>
            Revenue and transaction
            history by month
          </p>

        </div>


        <div className="reports-table-card">

          {!dataReady ? null :

          monthlyRevenueHistory.length ===
          0 ? (

            <p className="reports-empty">
              No monthly revenue records
              found.
            </p>

          ) : (

            <div className="reports-table-container">

              <table className="reports-table">

                <thead>

                  <tr>

                    <th>
                      Month
                    </th>

                    <th>
                      Revenue
                    </th>

                    <th>
                      Transactions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {monthlyRevenueHistory.map(
                    (
                      item,
                      index
                    ) => (

                      <tr
                        key={`${item._id?.year}-${item._id?.month}-${index}`}
                      >

                        <td>

                          {formatMonth(
                            item._id?.year,
                            item._id?.month
                          )}

                        </td>

                        <td>

                          ₹
                          {formatCurrency(
                            item.totalRevenue
                          )}

                        </td>

                        <td>

                          {
                            item.totalTransactions ||
                            0
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

export default Reports;