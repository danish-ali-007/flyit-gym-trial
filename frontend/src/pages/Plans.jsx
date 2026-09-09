import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FiCalendar,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiMessageCircle,
} from "react-icons/fi";

import api from "../services/api";
import "./Plans.css";


// ====================================================
// MEMBERSHIP PAGE CACHE
// ====================================================

const plansCache = new Map();

let plansMemoryGymKey = null;


const getPlansGymContext = () => {

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


    return {
      gymKey: `trial:${
        trialGym._id ||
        trialGym.gymId ||
        trialGym.trialToken ||
        "unknown"
      }`,

      gymName:
        trialGym.gymName ||
        "Trial Gym",
    };
  }


  const admin =
    JSON.parse(
      localStorage.getItem(
        "admin"
      ) || "{}"
    );


  return {
    gymKey: `admin:${
      admin.gymId ||
      admin._id ||
      "olympics-gym"
    }`,

    gymName: "Olympics Gym",
  };
};


const getPlansGymKey = () => {
  return getPlansGymContext().gymKey;
};


// ====================================================
// MEMBERSHIP PAGE MEMORY
// Route change ke baad filters preserve rahenge.
// Browser refresh / F5 par reset ho jayega.
// ====================================================

const plansPageMemory = {
  initialized: false,
  year: null,
  month: null,
  view: "joining",
  planDuration: "All",
};


const createPlansCacheKey = (
  year,
  month,
  view,
  planDuration
) => {
  return [
    getPlansGymKey(),
    year,
    month,
    view,
    planDuration,
  ].join("|");
};


const Plans = () => {

  const {
    gymKey: currentGymKey,
    gymName,
  } = getPlansGymContext();


  if (
    plansMemoryGymKey !==
    currentGymKey
  ) {

    plansMemoryGymKey =
      currentGymKey;

    plansPageMemory.initialized =
      false;

    plansPageMemory.year =
      null;

    plansPageMemory.month =
      null;

    plansPageMemory.view =
      "joining";

    plansPageMemory.planDuration =
      "All";
  }


  const currentDate = new Date();


  // ====================================================
  // INITIAL VALUES
  // Agar page pehle open hua tha to previous filters use.
  // Otherwise current defaults.
  // ====================================================

  const initialYear =
    plansPageMemory.initialized &&
    plansPageMemory.year
      ? plansPageMemory.year
      : currentDate.getFullYear();


  const initialMonth =
    plansPageMemory.initialized &&
    plansPageMemory.month
      ? plansPageMemory.month
      : currentDate.getMonth() + 1;


  const initialView =
    plansPageMemory.initialized
      ? plansPageMemory.view
      : "joining";


  const initialPlan =
    plansPageMemory.initialized
      ? plansPageMemory.planDuration
      : "All";


  const initialCacheKey =
    createPlansCacheKey(
      initialYear,
      initialMonth,
      initialView,
      initialPlan
    );


  const initialCachedData =
    plansCache.get(
      initialCacheKey
    );


  const [year, setYear] = useState(
    initialYear
  );


  const [month, setMonth] = useState(
    initialMonth
  );


  const [view, setView] =
    useState(initialView);


  const [
    planDuration,
    setPlanDuration,
  ] = useState(initialPlan);


  const [
    members,
    setMembers,
  ] = useState(
    initialCachedData?.members ||
      []
  );


  const [
    summary,
    setSummary,
  ] = useState(
    initialCachedData?.summary || {
      totalMembers: 0,

      planSummary: {
        1: 0,
        3: 0,
        6: 0,
        12: 0,
      },
    }
  );


  const [
    filters,
    setFilters,
  ] = useState(
    initialCachedData?.filters ||
      null
  );


  const [
    dataReady,
    setDataReady,
  ] = useState(
    Boolean(initialCachedData)
  );


  const [
    requestLoading,
    setRequestLoading,
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /*
    Prevent old requests from
    overwriting newer filter results.
  */

  const latestRequestId =
    useRef(0);


  // ====================================================
  // SAVE CURRENT FILTERS IN MEMORY
  // ====================================================

  useEffect(() => {
    plansPageMemory.initialized = true;
    plansPageMemory.year = year;
    plansPageMemory.month = month;
    plansPageMemory.view = view;
    plansPageMemory.planDuration =
      planDuration;
  }, [
    year,
    month,
    view,
    planDuration,
  ]);


  /* =========================
     MONTH NAMES
  ========================= */

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


  /* =========================
     APPLY CACHE
  ========================= */

  const applyCachedData = (
    cached
  ) => {
    if (!cached) {
      return false;
    }


    setMembers(
      cached.members || []
    );


    setSummary(
      cached.summary || {
        totalMembers: 0,

        planSummary: {
          1: 0,
          3: 0,
          6: 0,
          12: 0,
        },
      }
    );


    setFilters(
      cached.filters ||
        null
    );


    setDataReady(true);

    setErrorMessage("");


    return true;
  };


  /* =========================
     FETCH MEMBERSHIPS
  ========================= */

  const fetchMemberships =
    async (
      selectedYear = year,
      selectedMonth = month,
      selectedView = view,
      selectedPlan =
        planDuration
    ) => {

      const cacheKey =
        createPlansCacheKey(
          selectedYear,
          selectedMonth,
          selectedView,
          selectedPlan
        );


      const cached =
        plansCache.get(
          cacheKey
        );


      /*
        If cached result exists,
        display immediately.
      */

      if (cached) {
        applyCachedData(
          cached
        );
      }


      const requestId =
        ++latestRequestId.current;


      try {
        setRequestLoading(
          true
        );

        setErrorMessage("");


        const response =
          await api.get(
            "/dashboard/membership-calendar",
            {
              params: {
                year:
                  selectedYear,

                month:
                  selectedMonth,

                view:
                  selectedView,

                planDuration:
                  selectedPlan,
              },
            }
          );


        /*
          Ignore old response if user
          changed filters meanwhile.
        */

        if (
          requestId !==
          latestRequestId.current
        ) {
          return;
        }


        const newMembers =
          response.data.data ||
            [];


        const newSummary =
          response.data.summary || {
            totalMembers: 0,

            planSummary: {
              1: 0,
              3: 0,
              6: 0,
              12: 0,
            },
          };


        const newFilters =
          response.data.filters ||
            null;


        setMembers(
          newMembers
        );


        setSummary(
          newSummary
        );


        setFilters(
          newFilters
        );


        setDataReady(true);

        setErrorMessage("");


        /*
          Store fresh result.
        */

        plansCache.set(
          cacheKey,
          {
            members:
              newMembers,

            summary:
              newSummary,

            filters:
              newFilters,
          }
        );

      } catch (error) {

        console.error(
          "Membership Calendar Error:",
          error
        );


        /*
          Existing cached/current
          members ko error pe clear
          nahi karna.

          First load fail hua tab error
          display hoga.
        */

        if (
          requestId ===
            latestRequestId.current
        ) {

          if (
            !cached &&
            members.length === 0
          ) {
            setErrorMessage(
              error.response?.data
                ?.message ||
                "Unable to load memberships."
            );

            setDataReady(true);
          }
        }

      } finally {

        if (
          requestId ===
          latestRequestId.current
        ) {
          setRequestLoading(
            false
          );
        }
      }
    };


  /* =========================
     FETCH ON FILTER CHANGE
  ========================= */

  useEffect(() => {

    const cacheKey =
      createPlansCacheKey(
        year,
        month,
        view,
        planDuration
      );


    const cached =
      plansCache.get(
        cacheKey
      );


    if (cached) {
      applyCachedData(
        cached
      );
    }


    fetchMemberships(
      year,
      month,
      view,
      planDuration
    );

  }, [
    year,
    month,
    view,
    planDuration,
  ]);


  /* =========================
     FORMAT DATE
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
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }
    );
  };


  /* =========================
     WHATSAPP RENEWAL REMINDER
  ========================= */

  const handleWhatsAppReminder = (
    member
  ) => {
    try {

      // =========================
      // PHONE
      // =========================

      let cleanPhone =
        String(
          member.phone || ""
        ).replace(
          /\D/g,
          ""
        );


      if (
        cleanPhone.length === 10
      ) {
        cleanPhone =
          `91${cleanPhone}`;
      }


      if (!cleanPhone) {
        return;
      }


      // =========================
      // MEMBER ID
      // =========================

      const memberId =
        member._id || "N/A";


      // =========================
      // EXPIRY DATE
      // =========================

      const expiryDateObj =
        new Date(
          member.expiryDate
        );


      if (
        Number.isNaN(
          expiryDateObj.getTime()
        )
      ) {
        return;
      }


      const formattedExpiryDate =
        expiryDateObj.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone:
              "Asia/Kolkata",
          }
        );


      // =========================
      // TODAY IN INDIA
      // =========================

      const todayString =
        new Date().toLocaleDateString(
          "en-CA",
          {
            timeZone:
              "Asia/Kolkata",
          }
        );


      const expiryString =
        expiryDateObj.toLocaleDateString(
          "en-CA",
          {
            timeZone:
              "Asia/Kolkata",
          }
        );


      let message = "";


      // =========================
      // EXPIRES TODAY
      // =========================

      if (
        expiryString ===
        todayString
      ) {

        message =
          `Hello *${member.name}*,\n\n` +
          `Member ID: *${memberId}*\n\n` +
          `Your *${member.planName}* membership at *${gymName}* expires today, *${formattedExpiryDate}*.\n\n` +
          `Please renew your membership to continue your training without interruption.\n\n` +
          `Thank you,\n` +
          `*${gymName}*`;
      }


      // =========================
      // ALREADY EXPIRED
      // =========================

      else {

        const today =
          new Date(
            `${todayString}T00:00:00`
          );


        const expiry =
          new Date(
            `${expiryString}T00:00:00`
          );


        const diffTime =
          today.getTime() -
          expiry.getTime();


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
          `Your *${member.planName}* membership at *${gymName}* expired on *${formattedExpiryDate}* (${daysAgo} ${dayText} ago).\n\n` +
          `Please renew your membership to continue your training.\n\n` +
          `Thank you,\n` +
          `*${gymName}*`;
      }


      // =========================
      // WHATSAPP URL
      // =========================

      const whatsappUrl =
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          message
        )}`;


      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );

    } catch (error) {

      console.error(
        "WhatsApp Reminder Error:",
        error
      );
    }
  };


  return (
    <div className="memberships-page">


      {/* =========================
          HEADER
      ========================= */}

      <div className="memberships-header">

        <div>

          <h1>
            Memberships
          </h1>

          <p>
            Analyze joining and expiry
            memberships by month
          </p>

        </div>

      </div>


      {/* =========================
          FILTERS
      ========================= */}

      <div className="membership-filters-card">


        {/* YEAR */}

        <div className="membership-filter-group">

          <label>
            Year
          </label>

          <select
            value={year}
            onChange={(e) =>
              setYear(
                Number(
                  e.target.value
                )
              )
            }
          >

            {(
              filters?.availableYears?.length
                ? filters.availableYears
                : [
                    currentDate.getFullYear() -
                      1,

                    currentDate.getFullYear(),

                    currentDate.getFullYear() +
                      1,
                  ]
            ).map((item) => (

              <option
                value={item}
                key={item}
              >
                {item}
              </option>

            ))}

          </select>

        </div>


        {/* MONTH */}

        <div className="membership-filter-group">

          <label>
            Month
          </label>

          <select
            value={month}
            onChange={(e) =>
              setMonth(
                Number(
                  e.target.value
                )
              )
            }
          >

            {monthNames.map(
              (
                monthName,
                index
              ) => (

                <option
                  value={
                    index + 1
                  }
                  key={
                    monthName
                  }
                >
                  {monthName}
                </option>

              )
            )}

          </select>

        </div>


        {/* PLAN */}

        <div className="membership-filter-group">

          <label>
            Plan
          </label>

          <select
            value={
              planDuration
            }
            onChange={(e) =>
              setPlanDuration(
                e.target.value
              )
            }
          >

            <option value="All">
              All Plans
            </option>

            <option value="1">
              1 Month Plan
            </option>

            <option value="3">
              3 Month Plan
            </option>

            <option value="6">
              6 Month Plan
            </option>

            <option value="12">
              1 Year Plan
            </option>

          </select>

        </div>

      </div>


      {/* =========================
          JOINING / EXPIRY
      ========================= */}

      <div className="membership-view-toggle">

        <button
          type="button"
          className={
            view === "joining"
              ? "membership-toggle-btn active"
              : "membership-toggle-btn"
          }
          onClick={() =>
            setView("joining")
          }
        >
          Joining
        </button>


        <button
          type="button"
          className={
            view === "expiry"
              ? "membership-toggle-btn active"
              : "membership-toggle-btn"
          }
          onClick={() =>
            setView("expiry")
          }
        >
          Expiry
        </button>

      </div>


      {/* =========================
          SUMMARY
      ========================= */}

      <div className="membership-summary-grid">


        {/* TOTAL */}

        <div className="membership-summary-card">

          <div className="membership-summary-icon">
            <FiUsers />
          </div>

          <div>

            <span>
              Total Members
            </span>

            <strong>
              {
                summary.totalMembers
              }
            </strong>

          </div>

        </div>


        {/* 1 MONTH */}

        <div className="membership-summary-card">

          <div className="membership-summary-icon">
            <FiCalendar />
          </div>

          <div>

            <span>
              1 Month
            </span>

            <strong>
              {
                summary.planSummary?.[
                  1
                ] || 0
              }
            </strong>

          </div>

        </div>


        {/* 3 MONTH */}

        <div className="membership-summary-card">

          <div className="membership-summary-icon">
            <FiCalendar />
          </div>

          <div>

            <span>
              3 Months
            </span>

            <strong>
              {
                summary.planSummary?.[
                  3
                ] || 0
              }
            </strong>

          </div>

        </div>


        {/* 6 MONTH */}

        <div className="membership-summary-card">

          <div className="membership-summary-icon">
            <FiUserCheck />
          </div>

          <div>

            <span>
              6 Months
            </span>

            <strong>
              {
                summary.planSummary?.[
                  6
                ] || 0
              }
            </strong>

          </div>

        </div>


        {/* 1 YEAR */}

        <div className="membership-summary-card">

          <div className="membership-summary-icon">
            <FiClock />
          </div>

          <div>

            <span>
              1 Year
            </span>

            <strong>
              {
                summary.planSummary?.[
                  12
                ] || 0
              }
            </strong>

          </div>

        </div>

      </div>


      {/* =========================
          SELECTED MONTH HEADING
      ========================= */}

      <div className="membership-list-heading">

        <div>

          <h2>
            {filters?.monthName ||
              monthNames[
                month - 1
              ]}{" "}
            {year}
          </h2>

          <p>
            {view === "joining"
              ? "Members joining in selected month"
              : "Members expiring in selected month"}
          </p>

        </div>


        <span className="membership-count-badge">
          {members.length}
        </span>

      </div>


      {/*
        Intentionally no
        "Loading memberships..."
        block here.

        Existing data remains visible
        while request runs.
      */}


      {/* =========================
          ERROR
      ========================= */}

      {dataReady &&
        errorMessage &&
        members.length === 0 && (

          <div className="membership-error">
            {errorMessage}
          </div>

        )}


      {/* =========================
          EMPTY
      ========================= */}

      {dataReady &&
        !errorMessage &&
        members.length === 0 && (

          <div className="membership-empty">

            <h3>
              No Members Found
            </h3>

            <p>
              No membership records
              match the selected
              filters.
            </p>

          </div>

        )}


      {/* =========================
          DESKTOP TABLE
      ========================= */}

      {members.length > 0 && (

        <div className="membership-desktop-view">

          <div className="membership-table-container">

            <table className="membership-table">

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
                    {view ===
                    "joining"
                      ? "Joining"
                      : "Expiry"}
                  </th>

                  <th>
                    Status
                  </th>

                  {view ===
                    "expiry" && (
                    <th>
                      Reminder
                    </th>
                  )}

                </tr>

              </thead>


              <tbody>

                {members.map(
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
                        {member.planName}
                      </td>

                      <td>

                        {formatDate(
                          view ===
                            "joining"
                            ? member.joiningDate
                            : member.expiryDate
                        )}

                      </td>


                      <td>

                        <span
                          className={
                            member.membershipStatus ===
                            "Active"
                              ? "membership-status active"
                              : member.membershipStatus ===
                                "Inactive"
                              ? "membership-status inactive"
                              : "membership-status expired"
                          }
                        >
                          {
                            member.membershipStatus
                          }
                        </span>

                      </td>


                      {view ===
                        "expiry" && (

                        <td>

                          <button
                            type="button"
                            className="membership-whatsapp-btn"
                            onClick={() =>
                              handleWhatsAppReminder(
                                member
                              )
                            }
                            title="Send renewal reminder"
                            aria-label="Send renewal reminder"
                          >
                            <FiMessageCircle />
                          </button>

                        </td>

                      )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =========================
          MOBILE CARDS
      ========================= */}

      {members.length > 0 && (

        <div className="membership-mobile-view">

          {members.map(
            (member) => (

              <div
                className="membership-mobile-card"
                key={member._id}
              >


                {/* CARD TOP */}

                <div className="membership-mobile-top">

                  <div className="membership-mobile-avatar">

                    {member.name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "M"}

                  </div>


                  <div className="membership-mobile-main">

                    <div className="membership-mobile-name-row">

                      <h3>
                        {
                          member.name
                        }
                      </h3>


                      <span
                        className={
                          member.membershipStatus ===
                          "Active"
                            ? "membership-status active"
                            : member.membershipStatus ===
                              "Inactive"
                            ? "membership-status inactive"
                            : "membership-status expired"
                        }
                      >
                        {
                          member.membershipStatus
                        }
                      </span>

                    </div>


                    <p>
                      {member._id}
                    </p>

                    <p>
                      {member.phone}
                    </p>

                  </div>

                </div>


                {/* CARD DETAILS */}

                <div className="membership-mobile-grid">

                  <div>

                    <span>
                      Plan
                    </span>

                    <strong>
                      {
                        member.planName
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Duration
                    </span>

                    <strong>
                      {
                        member.planDurationMonths
                      }{" "}
                      {Number(
                        member.planDurationMonths
                      ) === 1
                        ? "Month"
                        : "Months"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      {view ===
                      "joining"
                        ? "Joining"
                        : "Expiry"}
                    </span>

                    <strong>

                      {formatDate(
                        view ===
                          "joining"
                          ? member.joiningDate
                          : member.expiryDate
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Pending
                    </span>

                    <strong>
                      ₹
                      {
                        member.pendingAmount ??
                          0
                      }
                    </strong>

                  </div>

                </div>


                {/* EXPIRY REMINDER */}

                {view ===
                  "expiry" && (

                  <div className="membership-mobile-actions">

                    <button
                      type="button"
                      className="membership-whatsapp-btn"
                      onClick={() =>
                        handleWhatsAppReminder(
                          member
                        )
                      }
                      title="Send renewal reminder"
                      aria-label="Send renewal reminder"
                    >
                      <FiMessageCircle />
                    </button>

                  </div>

                )}

              </div>

            )
          )}

        </div>

      )}


      <div className="page-powered-by">
        Powered by <span>Flyit Systems</span>
      </div>

    </div>
  );
};


export default Plans;