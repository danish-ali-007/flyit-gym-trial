import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiAlertCircle,
  FiMessageCircle,
  FiTrash2,
} from "react-icons/fi";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import api from "../services/api";
import "./Dashboard.css";


/* ====================================================
   ONLY DASHBOARD STATS CACHE
==================================================== */

let dashboardStatsCache = null;
let dashboardTodayExpiringCache = null;
let dashboardUpcomingExpiryCache = null;
let dashboardPastExpiredCache = null;
let dashboardPastExpiredCountCache = null;
let dashboardMonthlyRevenueCache = null;


let dashboardCacheOwnerKey = null;


const getDashboardGymKey = () => {

  const isTrial =
    localStorage.getItem("isTrial") ===
    "true";


  if (isTrial) {

    const trialGym =
      JSON.parse(
        localStorage.getItem(
          "trialGym"
        ) || "{}"
      );


    return `trial:${
      trialGym._id ||
      trialGym.gymId ||
      trialGym.trialToken ||
      "unknown"
    }`;
  }


  const admin =
    JSON.parse(
      localStorage.getItem(
        "admin"
      ) || "{}"
    );


  return `admin:${
    admin.gymId ||
    admin._id ||
    "olympics-gym"
  }`;
};


const ensureDashboardCacheOwner =
  (gymKey) => {

    if (
      dashboardCacheOwnerKey ===
      gymKey
    ) {
      return;
    }


    dashboardCacheOwnerKey =
      gymKey;


    dashboardStatsCache =
      null;

    dashboardTodayExpiringCache =
      null;

    dashboardUpcomingExpiryCache =
      null;

    dashboardPastExpiredCache =
      null;

    dashboardPastExpiredCountCache =
      null;

    dashboardMonthlyRevenueCache =
      null;
  };


const Dashboard = () => {
  const navigate = useNavigate();


  // ====================================================
  // GYM DISPLAY DATA
  // ====================================================

  const isTrial =
    localStorage.getItem("isTrial") === "true";


  const trialGym = JSON.parse(
    localStorage.getItem("trialGym") || "{}"
  );


  const gymName =
    isTrial
      ? trialGym.gymName || "Trial Gym"
      : "Olympics Gym";


  // ====================================================
  // GYM-WISE CACHE ISOLATION
  // ====================================================

  const dashboardGymKey =
    getDashboardGymKey();


  ensureDashboardCacheOwner(
    dashboardGymKey
  );


  // ====================================================
  // DASHBOARD STATE
  // ====================================================

  const [stats, setStats] = useState(
    dashboardStatsCache || {
      totalMembers: null,
      activeMembers: null,
      expiredMembers: null,
      totalRevenue: null,
      totalPendingAmount: null,
    }
  );


  const [loading, setLoading] =
    useState(false);


  const [
    todayExpiring,
    setTodayExpiring,
  ] = useState(
    dashboardTodayExpiringCache || []
  );


  const [
    upcomingExpiry,
    setUpcomingExpiry,
  ] = useState(
    dashboardUpcomingExpiryCache || []
  );


  const [
    pastExpired,
    setPastExpired,
  ] = useState(
    dashboardPastExpiredCache || []
  );


  const [
    pastExpiredCount,
    setPastExpiredCount,
  ] = useState(
    dashboardPastExpiredCountCache ?? 0
  );


  const [
    expiryLoading,
    setExpiryLoading,
  ] = useState(false);


  const [
    upcomingLoading,
    setUpcomingLoading,
  ] = useState(false);


  const [
    monthlyRevenue,
    setMonthlyRevenue,
  ] = useState(
    dashboardMonthlyRevenueCache || []
  );


  const [
    revenueLoading,
    setRevenueLoading,
  ] = useState(false);


  // ====================================================
  // DELETE MEMBER
  // ====================================================

  const [
    memberToDelete,
    setMemberToDelete,
  ] = useState(null);


  const [
    deletingMember,
    setDeletingMember,
  ] = useState(false);


  const [
    deleteError,
    setDeleteError,
  ] = useState("");


  // ====================================================
  // DASHBOARD STATS
  // ====================================================

  const fetchDashboardStats =
    async () => {
      try {
        const response =
          await api.get(
            "/dashboard/stats"
          );


        const newStats =
          response.data.data || {
            totalMembers: 0,
            activeMembers: 0,
            expiredMembers: 0,
            totalRevenue: 0,
            totalPendingAmount: 0,
          };


        setStats(newStats);

        dashboardStatsCache =
          newStats;

      } catch (error) {

        console.error(
          "Dashboard Stats Error:",
          error
        );

      } finally {

        setLoading(false);
      }
    };


  // ====================================================
  // EXPIRY ALERTS
  // ====================================================

  const fetchExpiryAlerts =
    async () => {
      try {

        const response =
          await api.get(
            "/dashboard/expiry-alerts"
          );


        const nextTodayExpiring =
          response.data.data
            ?.todayExpiring || [];


        const nextPastExpired =
          response.data.data
            ?.pastExpired || [];


        const nextPastExpiredCount =
          Number(
            response.data.data
              ?.pastExpiredCount || 0
          );


        setTodayExpiring(
          nextTodayExpiring
        );


        setPastExpired(
          nextPastExpired
        );


        setPastExpiredCount(
          nextPastExpiredCount
        );


        dashboardTodayExpiringCache =
          nextTodayExpiring;


        dashboardPastExpiredCache =
          nextPastExpired;


        dashboardPastExpiredCountCache =
          nextPastExpiredCount;

      } catch (error) {

        console.error(
          "Expiry Alerts Error:",
          error
        );


        setTodayExpiring([]);
        setPastExpired([]);
        setPastExpiredCount(0);


        dashboardTodayExpiringCache =
          [];

        dashboardPastExpiredCache =
          [];

        dashboardPastExpiredCountCache =
          0;

      } finally {

        setExpiryLoading(false);
      }
    };


  // ====================================================
  // UPCOMING EXPIRY
  // ====================================================

  const fetchUpcomingExpiry =
    async () => {
      try {

        const firstResponse =
          await api.get(
            "/members?page=1&limit=100"
          );


        const firstPageMembers =
          firstResponse.data.data ||
          [];


        const totalPages =
          firstResponse.data
            .pagination
            ?.totalPages || 1;


        let allMembers = [
          ...firstPageMembers,
        ];


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

              const pageMembers =
                response.data.data ||
                [];


              allMembers = [
                ...allMembers,
                ...pageMembers,
              ];
            }
          );
        }


        const today =
          new Date();


        today.setHours(
          0,
          0,
          0,
          0
        );


        const nextSevenDays =
          new Date(today);


        nextSevenDays.setDate(
          today.getDate() + 7
        );


        nextSevenDays.setHours(
          23,
          59,
          59,
          999
        );


        const upcoming =
          allMembers

            .filter(
              (member) => {

                if (
                  !member.expiryDate
                ) {
                  return false;
                }


                const expiryDate =
                  new Date(
                    member.expiryDate
                  );


                if (
                  Number.isNaN(
                    expiryDate.getTime()
                  )
                ) {
                  return false;
                }


                expiryDate.setHours(
                  0,
                  0,
                  0,
                  0
                );


                return (
                  expiryDate >
                    today &&
                  expiryDate <=
                    nextSevenDays
                );
              }
            )

            .map(
              (member) => {

                const expiryDate =
                  new Date(
                    member.expiryDate
                  );


                expiryDate.setHours(
                  0,
                  0,
                  0,
                  0
                );


                const difference =
                  expiryDate.getTime() -
                  today.getTime();


                const daysLeft =
                  Math.ceil(
                    difference /
                      (
                        1000 *
                        60 *
                        60 *
                        24
                      )
                  );


                const cleanPhone =
                  String(
                    member.phone ||
                      ""
                  ).replace(
                    /\D/g,
                    ""
                  );


                const whatsappPhone =
                  cleanPhone.length ===
                  10
                    ? `91${cleanPhone}`
                    : cleanPhone;


                const memberId =
                  member._id ||
                  "N/A";


                // =========================================
                // DYNAMIC GYM NAME IN WHATSAPP MESSAGE
                // =========================================

                const message =
                  `Hello *${member.name}*,\n\n` +
                  `Member ID: *${memberId}*\n\n` +
                  `Your *${member.planName}* membership at *${gymName}* ` +
                  `will expire in ${daysLeft} ${
                    daysLeft === 1
                      ? "day"
                      : "days"
                  }.\n\n` +
                  `Expiry Date: *${expiryDate.toLocaleDateString(
                    "en-IN"
                  )}*\n\n` +
                  `Please renew your membership to continue your training without interruption.\n\n` +
                  `Thank you,\n` +
                  `*${gymName}*`;


                return {
                  ...member,

                  daysLeft,

                  upcomingWhatsappLink:
                    whatsappPhone
                      ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                          message
                        )}`
                      : null,
                };
              }
            )

            .sort(
              (a, b) =>
                a.daysLeft -
                b.daysLeft
            );


        setUpcomingExpiry(
          upcoming
        );


        dashboardUpcomingExpiryCache =
          upcoming;

      } catch (error) {

        console.error(
          "Upcoming Expiry Error:",
          error
        );


        setUpcomingExpiry([]);

        dashboardUpcomingExpiryCache =
          [];

      } finally {

        setUpcomingLoading(
          false
        );
      }
    };


  // ====================================================
  // MONTHLY REVENUE
  // ====================================================

  const fetchMonthlyRevenue =
    async () => {
      try {

        const response =
          await api.get(
            "/dashboard/reports/monthly-revenue"
          );


        const nextMonthlyRevenue =
          response.data.data || [];


        setMonthlyRevenue(
          nextMonthlyRevenue
        );


        dashboardMonthlyRevenueCache =
          nextMonthlyRevenue;

      } catch (error) {

        console.error(
          "Monthly Revenue Error:",
          error
        );


        setMonthlyRevenue([]);

        dashboardMonthlyRevenueCache =
          [];

      } finally {

        setRevenueLoading(false);
      }
    };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    fetchDashboardStats();

    fetchExpiryAlerts();

    fetchUpcomingExpiry();

    fetchMonthlyRevenue();

  }, []);


  // ====================================================
  // DELETE EXPIRED MEMBER
  // ====================================================

  const openDeleteModal = (
    member
  ) => {

    setDeleteError("");

    setMemberToDelete(
      member
    );
  };


  const closeDeleteModal =
    () => {

      if (deletingMember) {
        return;
      }


      setDeleteError("");

      setMemberToDelete(null);
    };


  const handleDeleteMember =
    async () => {

      if (
        !memberToDelete?._id
      ) {
        return;
      }


      try {

        setDeletingMember(
          true
        );

        setDeleteError("");


        await api.delete(
          `/members/${memberToDelete._id}`
        );


        setPastExpired(
          (
            previousMembers
          ) => {

            const nextMembers =
              previousMembers.filter(
                (member) =>
                  member._id !==
                  memberToDelete._id
              );


            dashboardPastExpiredCache =
              nextMembers;


            return nextMembers;
          }
        );


        setPastExpiredCount(
          (
            previousCount
          ) => {

            const nextCount =
              Math.max(
                0,
                previousCount - 1
              );


            dashboardPastExpiredCountCache =
              nextCount;


            return nextCount;
          }
        );


        setMemberToDelete(
          null
        );


        fetchDashboardStats();

      } catch (error) {

        console.error(
          "Delete Member Error:",
          error
        );


        setDeleteError(
          error.response?.data
            ?.message ||
            "Unable to delete member."
        );

      } finally {

        setDeletingMember(
          false
        );
      }
    };


  // ====================================================
  // FORMAT DATE
  // ====================================================

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


    return parsedDate
      .toLocaleDateString(
        "en-IN"
      );
  };


  // ====================================================
  // FORMAT MONTH
  // ====================================================

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
        month:
          "long",

        year:
          "numeric",
      }
    );
  };


  // ====================================================
  // MEMBER INITIALS
  // ====================================================

  const getMemberInitials = (
    name
  ) => {

    if (!name) {
      return "M";
    }


    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (
      parts.length === 1
    ) {

      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }


    return (
      parts[0][0] +
      parts[
        parts.length - 1
      ][0]
    ).toUpperCase();
  };


  // ====================================================
  // CHART DATA
  // ====================================================

  const revenueChartData =
    monthlyRevenue
      .map(
        (item) => ({
          month:
            formatMonth(
              item._id?.year,
              item._id?.month
            ),

          revenue:
            Number(
              item.totalRevenue ||
                0
            ),
        })
      )
      .reverse();


  const membershipChartData = [
    {
      name: "Active",

      value:
        Number(
          stats.activeMembers ||
            0
        ),
    },

    {
      name: "Expired",

      value:
        Number(
          stats.expiredMembers ||
            0
        ),
    },
  ];


  // ====================================================
  // CARD KEYBOARD NAVIGATION
  // ====================================================

  const handleCardKeyDown = (
    event,
    path
  ) => {

    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      navigate(path);
    }
  };


  return (
    <div className="dashboard-page">


      {/* =========================
          HEADER
      ========================= */}

      <div className="dashboard-page-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Welcome to {gymName}{" "}
            Management System
          </p>

        </div>

      </div>


      {/* =========================
          DASHBOARD STATS
      ========================= */}

      {loading ? (

        <p className="dashboard-loading">
          Loading dashboard...
        </p>

      ) : (

        <div className="stats-grid">


          {/* TOTAL MEMBERS */}

          <div
            className="stat-card clickable-stat-card"

            onClick={() =>
              navigate(
                "/members?status=All"
              )
            }

            onKeyDown={(
              event
            ) =>
              handleCardKeyDown(
                event,
                "/members?status=All"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="stat-card-top">

              <div className="stat-icon">
                <FiUsers />
              </div>

              <span className="stat-label">
                Total Members
              </span>

            </div>


            <h2>
              {stats.totalMembers ??
                "—"}
            </h2>


            <p className="stat-description">
              All registered{" "}
              {gymName} members
            </p>

          </div>


          {/* ACTIVE MEMBERS */}

          <div
            className="stat-card clickable-stat-card"

            onClick={() =>
              navigate(
                "/members?status=Active"
              )
            }

            onKeyDown={(
              event
            ) =>
              handleCardKeyDown(
                event,
                "/members?status=Active"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="stat-card-top">

              <div className="stat-icon">
                <FiUserCheck />
              </div>

              <span className="stat-label">
                Active Members
              </span>

            </div>


            <h2>
              {stats.activeMembers ??
                "—"}
            </h2>


            <p className="stat-description">
              Currently active
              memberships
            </p>

          </div>


          {/* EXPIRED MEMBERS */}

          <div
            className="stat-card clickable-stat-card"

            onClick={() =>
              navigate(
                "/members?status=Expired"
              )
            }

            onKeyDown={(
              event
            ) =>
              handleCardKeyDown(
                event,
                "/members?status=Expired"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="stat-card-top">

              <div className="stat-icon">
                <FiUserX />
              </div>

              <span className="stat-label">
                Expired Members
              </span>

            </div>


            <h2>
              {stats.expiredMembers ??
                "—"}
            </h2>


            <p className="stat-description">
              Memberships requiring
              renewal
            </p>

          </div>


          {/* TOTAL REVENUE */}

          <div
            className="stat-card clickable-stat-card"

            onClick={() =>
              navigate(
                "/reports?section=revenue"
              )
            }

            onKeyDown={(
              event
            ) =>
              handleCardKeyDown(
                event,
                "/reports?section=revenue"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="stat-card-top">

              <div className="stat-icon">
                <FiTrendingUp />
              </div>

              <span className="stat-label">
                Total Revenue
              </span>

            </div>


            <h2>
              {stats.totalRevenue ==
              null
                ? "—"
                : `₹${stats.totalRevenue}`}
            </h2>


            <p className="stat-description">
              Total amount collected
            </p>

          </div>


          {/* PENDING AMOUNT */}

          <div
            className="stat-card clickable-stat-card"

            onClick={() =>
              navigate(
                "/reports"
              )
            }

            onKeyDown={(
              event
            ) =>
              handleCardKeyDown(
                event,
                "/reports"
              )
            }

            role="button"

            tabIndex={0}
          >

            <div className="stat-card-top">

              <div className="stat-icon">
                <FiAlertCircle />
              </div>

              <span className="stat-label">
                Pending Amount
              </span>

            </div>


            <h2>
              {stats.totalPendingAmount ==
              null
                ? "—"
                : `₹${stats.totalPendingAmount}`}
            </h2>


            <p className="stat-description">
              Outstanding membership
              fees
            </p>

          </div>

        </div>

      )}


      {/* =========================
          MEMBERSHIP EXPIRY
      ========================= */}

      <section className="expiry-section">

        <div className="section-heading">

          <h2>
            Membership Expiry Alerts
          </h2>

          <p>
            Monitor memberships that
            need attention
          </p>

        </div>


        {/* =========================
            EXPIRING TODAY
        ========================= */}

        <div className="expiry-card">

          <div className="expiry-card-header">

            <div>

              <h3>
                Expiring Today
              </h3>

              <p className="expiry-card-subtitle">
                Members whose
                membership expires
                today
              </p>

            </div>


            <span className="expiry-count">
              {todayExpiring.length}
            </span>

          </div>


          {expiryLoading ? (

            <p className="expiry-message">
              Loading expiry alerts...
            </p>

          ) : todayExpiring.length ===
            0 ? (

            <p className="expiry-message">
              No memberships are
              expiring today.
            </p>

          ) : (

            <>

              {/* DESKTOP TABLE */}

              <div className="desktop-expiry-view">

                <div className="expiry-table-container">

                  <table className="expiry-table">

                    <thead>

                      <tr>

                        <th>
                          Member
                        </th>

                        <th>
                          Phone
                        </th>

                        <th>
                          Plan
                        </th>

                        <th>
                          Expiry
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {todayExpiring.map(
                        (member) => (

                          <tr
                            key={
                              member._id
                            }
                          >

                            <td>
                              {member.name}
                            </td>

                            <td>
                              {member.phone}
                            </td>

                            <td>
                              {
                                member.planName
                              }
                            </td>

                            <td>
                              {formatDate(
                                member.expiryDate ||
                                  member.endDate
                              )}
                            </td>

                            <td>

                              {member.whatsappLink ? (

                                <a
                                  href={
                                    member.whatsappLink
                                  }
className="whatsapp-btn"
                                >
                                  WhatsApp
                                </a>

                              ) : (

                                <span>
                                  -
                                </span>

                              )}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* MOBILE CARDS */}

              <div className="mobile-expiry-view">

                {todayExpiring.map(
                  (member) => (

                    <div
                      className="mobile-expiry-member-card"

                      key={
                        member._id
                      }
                    >

                      <div className="mobile-expiry-card-top">

                        <div className="mobile-expiry-avatar">

                          {getMemberInitials(
                            member.name
                          )}

                        </div>


                        <div className="mobile-expiry-main">

                          <h3>
                            {member.name}
                          </h3>

                          <p>
                            {
                              member.planName
                            }
                          </p>

                        </div>

                      </div>


                      <div className="mobile-expiry-info-grid">

                        <div>

                          <span>
                            Phone
                          </span>

                          <strong>
                            {member.phone ||
                              "-"}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Expiry
                          </span>

                          <strong>
                            {formatDate(
                              member.expiryDate ||
                                member.endDate
                            )}
                          </strong>

                        </div>

                      </div>


                      {member.whatsappLink && (

                        <div className="mobile-expiry-actions single-action">

                          <a
                            href={
                              member.whatsappLink
                            }
className="mobile-whatsapp-action"
                          >

                            <FiMessageCircle />

                            WhatsApp

                          </a>

                        </div>

                      )}

                    </div>

                  )
                )}

              </div>

            </>

          )}

        </div>


        {/* =========================
            UPCOMING EXPIRY
        ========================= */}

        <div className="expiry-card upcoming-expiry-card">

          <div className="expiry-card-header">

            <div>

              <h3>
                Upcoming Expiry
              </h3>

              <p className="expiry-card-subtitle">
                Memberships expiring
                within the next 7 days
              </p>

            </div>


            <span className="expiry-count">
              {upcomingExpiry.length}
            </span>

          </div>


          {upcomingLoading ? (

            <p className="expiry-message">
              Loading upcoming
              expiries...
            </p>

          ) : upcomingExpiry.length ===
            0 ? (

            <p className="expiry-message">
              No memberships are
              expiring in the next
              7 days.
            </p>

          ) : (

            <>

              {/* DESKTOP TABLE */}

              <div className="desktop-expiry-view">

                <div className="expiry-table-container">

                  <table className="expiry-table">

                    <thead>

                      <tr>

                        <th>
                          Member
                        </th>

                        <th>
                          Phone
                        </th>

                        <th>
                          Plan
                        </th>

                        <th>
                          Expiry Date
                        </th>

                        <th>
                          Days Left
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {upcomingExpiry.map(
                        (member) => (

                          <tr
                            key={
                              member._id
                            }
                          >

                            <td>
                              {member.name}
                            </td>

                            <td>
                              {member.phone}
                            </td>

                            <td>
                              {
                                member.planName
                              }
                            </td>

                            <td>
                              {formatDate(
                                member.expiryDate ||
                                  member.endDate
                              )}
                            </td>

                            <td>

                              <span className="days-left-badge">

                                {
                                  member.daysLeft
                                }{" "}

                                {member.daysLeft ===
                                1
                                  ? "day"
                                  : "days"}

                              </span>

                            </td>

                            <td>

                              {member.upcomingWhatsappLink ? (

                                <a
                                  href={
                                    member.upcomingWhatsappLink
                                  }
className="whatsapp-btn"
                                >
                                  WhatsApp
                                </a>

                              ) : (

                                <span>
                                  -
                                </span>

                              )}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* MOBILE CARDS */}

              <div className="mobile-expiry-view">

                {upcomingExpiry.map(
                  (member) => (

                    <div
                      className="mobile-expiry-member-card"

                      key={
                        member._id
                      }
                    >

                      <div className="mobile-expiry-card-top">

                        <div className="mobile-expiry-avatar">

                          {getMemberInitials(
                            member.name
                          )}

                        </div>


                        <div className="mobile-expiry-main">

                          <h3>
                            {member.name}
                          </h3>

                          <p>
                            {
                              member.planName
                            }
                          </p>

                        </div>

                      </div>


                      <div className="mobile-expiry-info-grid">

                        <div>

                          <span>
                            Phone
                          </span>

                          <strong>
                            {member.phone ||
                              "-"}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Expiry
                          </span>

                          <strong>
                            {formatDate(
                              member.expiryDate ||
                                member.endDate
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Days Left
                          </span>

                          <strong className="mobile-days-left">

                            {
                              member.daysLeft
                            }{" "}

                            {member.daysLeft ===
                            1
                              ? "day"
                              : "days"}

                          </strong>

                        </div>

                      </div>


                      {member.upcomingWhatsappLink && (

                        <div className="mobile-expiry-actions single-action">

                          <a
                            href={
                              member.upcomingWhatsappLink
                            }
className="mobile-whatsapp-action"
                          >

                            <FiMessageCircle />

                            WhatsApp

                          </a>

                        </div>

                      )}

                    </div>

                  )
                )}

              </div>

            </>

          )}

        </div>


        {/* =========================
            PAST EXPIRED
        ========================= */}

        <div className="expiry-card past-expired-card">

          <div className="expiry-card-header">

            <div>

              <h3>
                Past Expired
              </h3>

              <p className="expiry-card-subtitle">
                Members whose
                membership has
                already expired
              </p>

            </div>


            <span className="expiry-count">
              {pastExpiredCount}
            </span>

          </div>


          {expiryLoading ? (

            <p className="expiry-message">
              Loading expired
              members...
            </p>

          ) : pastExpired.length ===
            0 ? (

            <p className="expiry-message">
              No past expired
              memberships found.
            </p>

          ) : (

            <>

              {/* DESKTOP TABLE */}

              <div className="desktop-expiry-view">

                <div className="expiry-table-container">

                  <table className="expiry-table">

                    <thead>

                      <tr>

                        <th>
                          Member
                        </th>

                        <th>
                          Phone
                        </th>

                        <th>
                          Plan
                        </th>

                        <th>
                          Expired Ago
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {pastExpired.map(
                        (member) => (

                          <tr
                            key={
                              member._id
                            }
                          >

                            <td>
                              {member.name}
                            </td>

                            <td>
                              {member.phone}
                            </td>

                            <td>
                              {
                                member.planName
                              }
                            </td>

                            <td>

                              {member.daysAgo
                                ? `${member.daysAgo} days ago`
                                : "-"}

                            </td>

                            <td>

                              <div className="past-expiry-actions">

                                {member.whatsappLink ? (

                                  <a
                                    href={
                                      member.whatsappLink
                                    }
className="expiry-icon-btn whatsapp-icon-btn"

                                    title="WhatsApp"

                                    aria-label={`WhatsApp ${member.name}`}
                                  >

                                    <FiMessageCircle />

                                  </a>

                                ) : (

                                  <button
                                    type="button"

                                    className="expiry-icon-btn disabled-expiry-icon"

                                    disabled

                                    title="WhatsApp unavailable"
                                  >

                                    <FiMessageCircle />

                                  </button>

                                )}


                                <button
                                  type="button"

                                  className="expiry-icon-btn delete-expiry-icon-btn"

                                  onClick={() =>
                                    openDeleteModal(
                                      member
                                    )
                                  }

                                  title="Delete member"

                                  aria-label={`Delete ${member.name}`}
                                >

                                  <FiTrash2 />

                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* MOBILE CARDS */}

              <div className="mobile-expiry-view">

                {pastExpired.map(
                  (member) => (

                    <div
                      className="mobile-expiry-member-card"

                      key={
                        member._id
                      }
                    >

                      <div className="mobile-expiry-card-top">

                        <div className="mobile-expiry-avatar">

                          {getMemberInitials(
                            member.name
                          )}

                        </div>


                        <div className="mobile-expiry-main">

                          <h3>
                            {member.name}
                          </h3>

                          <p>
                            {
                              member.planName
                            }
                          </p>

                        </div>

                      </div>


                      <div className="mobile-expiry-info-grid">

                        <div>

                          <span>
                            Phone
                          </span>

                          <strong>
                            {member.phone ||
                              "-"}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Expired
                          </span>

                          <strong className="mobile-expired-text">

                            {member.daysAgo
                              ? `${member.daysAgo} days ago`
                              : "-"}

                          </strong>

                        </div>

                      </div>


                      <div className="mobile-expiry-actions">

                        {member.whatsappLink ? (

                          <a
                            href={
                              member.whatsappLink
                            }
className="mobile-whatsapp-action"

                            aria-label={`WhatsApp ${member.name}`}
                          >

                            <FiMessageCircle />

                            WhatsApp

                          </a>

                        ) : (

                          <button
                            type="button"

                            className="mobile-whatsapp-action disabled-mobile-action"

                            disabled
                          >

                            <FiMessageCircle />

                            WhatsApp

                          </button>

                        )}


                        <button
                          type="button"

                          className="mobile-delete-action"

                          onClick={() =>
                            openDeleteModal(
                              member
                            )
                          }
                        >

                          <FiTrash2 />

                          Delete

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>


              {/* =========================
                  VIEW ALL EXPIRED MEMBERS
              ========================= */}

              {pastExpiredCount >
                10 && (

                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "center",

                    marginTop:
                      "18px",
                  }}
                >

                  <button
                    type="button"

                    onClick={() =>
                      navigate(
                        "/members?status=Expired"
                      )
                    }

                    style={{
                      padding:
                        "10px 20px",

                      border:
                        "1px solid #e5e7eb",

                      borderRadius:
                        "8px",

                      background:
                        "#ffffff",

                      cursor:
                        "pointer",

                      fontWeight:
                        "600",

                      fontSize:
                        "13px",
                    }}
                  >

                    View All Expired Members

                  </button>

                </div>

              )}

            </>

          )}

        </div>

      </section>


      {/* =========================
          ANALYTICS
      ========================= */}

      <section className="charts-section">

        <div className="section-heading">

          <h2>
            Analytics Overview
          </h2>

          <p>
            Visual summary of revenue
            and memberships
          </p>

        </div>


        <div className="charts-grid">


          {/* REVENUE CHART */}

          <div className="chart-card">

            <div className="chart-card-header">

              <h3>
                Monthly Revenue Trend
              </h3>

              <p>
                Revenue performance by
                month
              </p>

            </div>


            <div className="chart-wrapper">

              {revenueChartData.length ===
              0 ? (

                <p className="chart-empty">
                  No revenue data
                  available.
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={
                      revenueChartData
                    }

                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />


                    <XAxis
                      dataKey="month"

                      tick={{
                        fontSize: 11,
                      }}
                    />


                    <YAxis
                      tick={{
                        fontSize: 11,
                      }}
                    />


                    <Tooltip
                      formatter={(
                        value
                      ) => [
                        `₹${value}`,
                        "Revenue",
                      ]}
                    />


                    <Line
                      type="monotone"

                      dataKey="revenue"

                      stroke="#ff4d30"

                      strokeWidth={3}

                      dot={{
                        r: 4,
                      }}

                      activeDot={{
                        r: 6,
                      }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>


          {/* MEMBERSHIP CHART */}

          <div className="chart-card">

            <div className="chart-card-header">

              <h3>
                Membership Status
              </h3>

              <p>
                Active and expired
                members
              </p>

            </div>


            <div className="chart-wrapper">

              {stats.activeMembers ==
                null &&
              stats.expiredMembers ==
                null ? (

                <p className="chart-empty">
                  No membership data
                  available.
                </p>

              ) : stats.activeMembers ===
                  0 &&
                stats.expiredMembers ===
                  0 ? (

                <p className="chart-empty">
                  No membership data
                  available.
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <PieChart>

                    <Pie
                      data={
                        membershipChartData
                      }

                      dataKey="value"

                      nameKey="name"

                      cx="50%"

                      cy="50%"

                      innerRadius={65}

                      outerRadius={95}

                      paddingAngle={4}
                    >

                      <Cell
                        fill="#16a34a"
                      />

                      <Cell
                        fill="#dc2626"
                      />

                    </Pie>


                    <Tooltip />


                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          MONTHLY REVENUE TABLE
      ========================= */}

      <section className="revenue-section">

        <div className="section-heading">

          <h2>
            Monthly Revenue
          </h2>

          <p>
            {gymName} monthly
            revenue summary
          </p>

        </div>


        <div className="revenue-card">

          {revenueLoading ? (

            <p className="revenue-message">
              Loading monthly
              revenue...
            </p>

          ) : monthlyRevenue.length ===
            0 ? (

            <p className="revenue-message">
              No revenue records
              found.
            </p>

          ) : (

            <div className="revenue-table-container">

              <table className="revenue-table">

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

                  {monthlyRevenue.map(
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
                          {item.totalRevenue ??
                            0}
                        </td>


                        <td>

                          {item.totalTransactions ??
                            0}

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


      <div className="powered-by">
        Powered by{" "}
        <span>
          Flyit Systems
        </span>
      </div>


      {/* =========================
          DELETE CONFIRMATION
      ========================= */}

      {memberToDelete && (

        <div
          className="dashboard-delete-overlay"

          onClick={
            closeDeleteModal
          }
        >

          <div
            className="dashboard-delete-modal"

            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="dashboard-delete-icon">
              <FiTrash2 />
            </div>


            <h2>
              Delete Member?
            </h2>


            <p>
              Are you sure you want
              to delete{" "}

              <strong>
                {
                  memberToDelete.name
                }
              </strong>

              ?
            </p>


            <p className="dashboard-delete-warning">
              This member will be
              permanently removed.
            </p>


            {deleteError && (

              <div className="dashboard-delete-error">
                {deleteError}
              </div>

            )}


            <div className="dashboard-delete-actions">

              <button
                type="button"

                className="dashboard-delete-cancel"

                onClick={
                  closeDeleteModal
                }

                disabled={
                  deletingMember
                }
              >
                Cancel
              </button>


              <button
                type="button"

                className="dashboard-delete-confirm"

                onClick={
                  handleDeleteMember
                }

                disabled={
                  deletingMember
                }
              >

                {deletingMember
                  ? "Deleting..."
                  : "Delete"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};


export default Dashboard;