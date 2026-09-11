import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../services/api";
import ImportMembers from "../components/ImportMembers";

import "./Members.css";


// ====================================================
// SIMPLE MEMORY CACHE
// Component unmount hone ke baad bhi data rahega.
// Dashboard -> Members -> Plans -> Members par
// previous data immediately show hoga.
// ====================================================

const membersCache = new Map();


let membersMemoryGymKey = null;


const getMembersGymKey = () => {

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


// ====================================================
// MEMBERS PAGE NAVIGATION MEMORY
// SPA navigation par preserve rahega.
// Browser refresh / F5 par module reload hone se reset.
// ====================================================

const membersPageMemory = {
  initialized: false,
  searchTerm: "",
  statusFilter: "All",
  planFilter: "All",
  currentPage: 1,
  scrollY: 0,
};


const MEMBERS_PER_PAGE = 100;


const createCacheKey = (
  page,
  status,
  plan,
  search
) => {
  return [
    getMembersGymKey(),
    page,
    status || "All",
    plan || "All",
    (search || "")
      .trim()
      .toLowerCase(),
  ].join("|");
};


const Members = () => {

  // ====================================================
  // CURRENT GYM
  // ====================================================

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


  const currentGymMemoryKey =
    getMembersGymKey();


  if (
    membersMemoryGymKey !==
    currentGymMemoryKey
  ) {

    membersMemoryGymKey =
      currentGymMemoryKey;


    membersPageMemory.initialized =
      false;

    membersPageMemory.searchTerm =
      "";

    membersPageMemory.statusFilter =
      "All";

    membersPageMemory.planFilter =
      "All";

    membersPageMemory.currentPage =
      1;

    membersPageMemory.scrollY =
      0;
  }


  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  // ====================================================
  // STATUS FROM URL
  // ====================================================

  const statusFromUrl =
    searchParams.get("status");

  const validStatuses = [
    "All",
    "Active",
    "Expired",
    "Inactive",
  ];

  const initialStatus =
    validStatuses.includes(
      statusFromUrl
    )
      ? statusFromUrl
      : membersPageMemory.initialized
      ? membersPageMemory.statusFilter
      : "All";


  // ====================================================
  // INITIAL CACHE
  // ====================================================

  const hasStatusFromUrl =
    validStatuses.includes(
      statusFromUrl
    );


  const initialPage =
    hasStatusFromUrl
      ? 1
      : membersPageMemory.initialized
      ? membersPageMemory.currentPage
      : 1;


  const initialPlan =
    hasStatusFromUrl
      ? "All"
      : membersPageMemory.initialized
      ? membersPageMemory.planFilter
      : "All";


  const initialSearch =
    hasStatusFromUrl
      ? ""
      : membersPageMemory.initialized
      ? membersPageMemory.searchTerm
      : "";


  const initialCacheKey =
    createCacheKey(
      initialPage,
      initialStatus,
      initialPlan,
      initialSearch
    );

  const initialCachedData =
    membersCache.get(
      initialCacheKey
    );


  // ====================================================
  // STATES
  // ====================================================

  const [
    members,
    setMembers,
  ] = useState(
    initialCachedData?.members ||
      []
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
    selectedMember,
    setSelectedMember,
  ] = useState(null);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const [
    showImportModal,
    setShowImportModal,
  ] = useState(false);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState(
    initialSearch
  );

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    initialStatus
  );

  const [
    planFilter,
    setPlanFilter,
  ] = useState(
    initialPlan
  );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(
    initialCachedData
      ?.currentPage ||
      initialPage
  );

  const [
    totalPages,
    setTotalPages,
  ] = useState(
    initialCachedData
      ?.totalPages ||
      1
  );

  const [
    totalMembers,
    setTotalMembers,
  ] = useState(
    initialCachedData
      ?.totalMembers ||
      0
  );


  /*
    Request ID prevents an older API
    response from overwriting a newer
    search/filter request.
  */

  const latestRequestId =
    useRef(0);


  // ====================================================
  // URL STATUS CHANGE
  // Dashboard Active / Expired card support
  // ====================================================

  useEffect(() => {
    const status =
      searchParams.get("status");

    if (
      status &&
      validStatuses.includes(
        status
      )
    ) {
      setStatusFilter(
        status
      );

      setCurrentPage(1);

      if (status === "All") {
        setPlanFilter("All");
        setSearchTerm("");
      }
    }

    // IMPORTANT:
    // URL me status na ho to current/memory filters
    // preserve rahenge.
    // Isse View/Edit se Back karne par filter reset nahi hoga.
    // Dashboard Total Members already ?status=All bhejta hai.

  }, [searchParams]);


  // ====================================================
  // SAVE MEMBERS FILTER / PAGE STATE
  // ====================================================

  useEffect(() => {
    membersPageMemory.initialized = true;
    membersPageMemory.searchTerm = searchTerm;
    membersPageMemory.statusFilter = statusFilter;
    membersPageMemory.planFilter = planFilter;
    membersPageMemory.currentPage = currentPage;
  }, [
    searchTerm,
    statusFilter,
    planFilter,
    currentPage,
  ]);


  // ====================================================
  // MEMBERS SCROLL MEMORY
  // User scroll ko continuously save karte hain.
  // Route unmount ke waqt window.scrollY read nahi karte,
  // kyunki next page render hote waqt value 0 clamp ho sakti hai.
  // ====================================================

  const restoringScrollRef =
    useRef(false);


  useEffect(() => {
    const handleScroll = () => {
      if (restoringScrollRef.current) {
        return;
      }

      membersPageMemory.scrollY =
        window.scrollY;
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);


  // ====================================================
  // RESTORE MEMBERS SCROLL
  // Async data ki wajah se page height late banti hai,
  // isliye required height milne tak limited retry.
  // ====================================================

  useLayoutEffect(() => {
    if (!dataReady) {
      return;
    }

    const savedScroll =
      membersPageMemory.scrollY || 0;

    if (savedScroll <= 0) {
      restoringScrollRef.current = false;
      return;
    }

    restoringScrollRef.current = true;

    let cancelled = false;
    let attempts = 0;
    let timer = null;

    const restoreScroll = () => {
      if (cancelled) {
        return;
      }

      attempts += 1;

      const maxScroll =
        Math.max(
          0,
          document.documentElement.scrollHeight -
            window.innerHeight
        );

      if (maxScroll >= savedScroll) {
        window.scrollTo(
          0,
          savedScroll
        );

        restoringScrollRef.current = false;
        return;
      }

      if (attempts < 40) {
        timer = setTimeout(
          restoreScroll,
          50
        );
      } else {
        window.scrollTo(
          0,
          Math.min(
            savedScroll,
            maxScroll
          )
        );

        restoringScrollRef.current = false;
      }
    };

    requestAnimationFrame(
      restoreScroll
    );

    return () => {
      cancelled = true;
      restoringScrollRef.current = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [dataReady, members.length]);


  // ====================================================
  // APPLY CACHE
  // ====================================================

  const applyCachedData = (
    cached
  ) => {
    if (!cached) {
      return false;
    }

    setMembers(
      cached.members || []
    );

    setCurrentPage(
      cached.currentPage || 1
    );

    setTotalPages(
      cached.totalPages || 1
    );

    setTotalMembers(
      cached.totalMembers || 0
    );

    setDataReady(true);

    return true;
  };


  // ====================================================
  // FETCH MEMBERS
  // Backend filters BEFORE pagination
  // ====================================================

  const fetchMembers = async (
    page = 1,
    status = statusFilter,
    plan = planFilter,
    search = searchTerm,
    options = {}
  ) => {
    const {
      useCache = true,
      forceRefresh = false,
    } = options;

    const cacheKey =
      createCacheKey(
        page,
        status,
        plan,
        search
      );


    // --------------------------------
    // Show cached result immediately
    // --------------------------------

    if (
      useCache &&
      !forceRefresh
    ) {
      const cached =
        membersCache.get(
          cacheKey
        );

      if (cached) {
        applyCachedData(
          cached
        );
      }
    }


    const requestId =
      ++latestRequestId.current;


    try {
      setRequestLoading(true);


      const params =
        new URLSearchParams();


      params.set(
        "page",
        String(page)
      );


      params.set(
        "limit",
        String(
          MEMBERS_PER_PAGE
        )
      );


      // =========================
      // STATUS
      // =========================

      if (
        status &&
        status !== "All"
      ) {
        params.set(
          "membershipStatus",
          status
        );
      }


      // =========================
      // PLAN
      // =========================

      if (
        plan &&
        plan !== "All"
      ) {
        params.set(
          "planName",
          plan
        );
      }


      // =========================
      // SEARCH
      // =========================

      if (
        search &&
        search.trim()
      ) {
        params.set(
          "query",
          search.trim()
        );
      }


      const response =
        await api.get(
          `/members?${params.toString()}`
        );


      /*
        Agar user ne meanwhile doosra
        filter/search select kar diya,
        purana response ignore hoga.
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


      const newCurrentPage =
        response.data
          .pagination
          ?.currentPage ||
        page;


      const newTotalPages =
        response.data
          .pagination
          ?.totalPages ||
        1;


      const newTotalMembers =
        response.data
          .pagination
          ?.totalMembers ||
        0;


      // =========================
      // UPDATE UI
      // =========================

      setMembers(
        newMembers
      );

      setCurrentPage(
        newCurrentPage
      );

      setTotalPages(
        newTotalPages
      );

      setTotalMembers(
        newTotalMembers
      );

      setDataReady(true);


      // =========================
      // UPDATE CACHE
      // =========================

      membersCache.set(
        cacheKey,
        {
          members:
            newMembers,

          currentPage:
            newCurrentPage,

          totalPages:
            newTotalPages,

          totalMembers:
            newTotalMembers,
        }
      );

    } catch (error) {

      console.error(
        "Members Fetch Error:",
        error
      );


      /*
        Existing/cached members ko
        error ke case me clear nahi
        karenge.

        Agar first request hi fail hui,
        tab empty state allow hogi.
      */

      if (
        requestId ===
          latestRequestId.current &&
        !dataReady &&
        members.length === 0
      ) {
        setDataReady(true);
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


  // ====================================================
  // INITIAL + FILTER + SEARCH FETCH
  // ====================================================

  useEffect(() => {
    const cacheKey =
      createCacheKey(
        currentPage,
        statusFilter,
        planFilter,
        searchTerm
      );


    const cached =
      membersCache.get(
        cacheKey
      );


    /*
      Filter/search result cache me
      hai to immediately display.
    */

    if (cached) {
      applyCachedData(
        cached
      );
    }


    /*
      Search debounce
    */

    const timer =
      setTimeout(() => {

        fetchMembers(
          currentPage,
          statusFilter,
          planFilter,
          searchTerm,
          {
            useCache: true,
          }
        );

      }, 300);


    return () => {
      clearTimeout(timer);
    };

  }, [
    statusFilter,
    planFilter,
    searchTerm,
  ]);


  // ====================================================
  // ADD MEMBER
  // ====================================================

  const handleAddMember = () => {
    navigate(
      "/members/add"
    );
  };


  // ====================================================
  // IMPORT
  // ====================================================

  const handleImportOpen = () => {
    setShowImportModal(
      true
    );
  };


  const handleImportClose = () => {
    setShowImportModal(
      false
    );
  };


  const handleImportSuccess =
    async () => {

      /*
        Import ke baad old cache stale
        ho sakta hai, isliye clear.
      */

      membersCache.clear();


      await fetchMembers(
        currentPage,
        statusFilter,
        planFilter,
        searchTerm,
        {
          useCache: false,
          forceRefresh: true,
        }
      );
    };


  // ====================================================
  // STATUS FILTER
  // ====================================================

  const handleStatusChange = (
    e
  ) => {
    const value =
      e.target.value;


    setStatusFilter(
      value
    );


    setCurrentPage(1);


    if (value === "All") {

      const newParams =
        new URLSearchParams(
          searchParams
        );


      newParams.delete(
        "status"
      );


      setSearchParams(
        newParams
      );

    } else {

      const newParams =
        new URLSearchParams(
          searchParams
        );


      newParams.set(
        "status",
        value
      );


      setSearchParams(
        newParams
      );
    }
  };


  // ====================================================
  // PLAN FILTER
  // ====================================================

  const handlePlanChange = (
    e
  ) => {
    setPlanFilter(
      e.target.value
    );

    setCurrentPage(1);
  };


  // ====================================================
  // SEARCH
  // ====================================================

  const handleSearchChange = (
    e
  ) => {
    setSearchTerm(
      e.target.value
    );

    setCurrentPage(1);
  };


  // ====================================================
  // DELETE
  // ====================================================

  const handleDeleteClick = (
    member
  ) => {
    setDeleteError("");

    setSelectedMember(
      member
    );

    setShowDeleteModal(
      true
    );
  };


  const handleCancelDelete = () => {
    if (deleteLoading) {
      return;
    }


    setSelectedMember(
      null
    );

    setDeleteError("");

    setShowDeleteModal(
      false
    );
  };


  const handleConfirmDelete =
    async () => {
      if (
        !selectedMember?._id
      ) {
        return;
      }


      try {
        setDeleteLoading(
          true
        );

        setDeleteError("");


        await api.delete(
          `/members/${selectedMember._id}`
        );


        setSelectedMember(
          null
        );

        setShowDeleteModal(
          false
        );


        /*
          Delete ke baad cache stale hai.
        */

        membersCache.clear();


        const shouldGoPreviousPage =
          members.length === 1 &&
          currentPage > 1;


        const nextPage =
          shouldGoPreviousPage
            ? currentPage - 1
            : currentPage;


        await fetchMembers(
          nextPage,
          statusFilter,
          planFilter,
          searchTerm,
          {
            useCache: false,
            forceRefresh: true,
          }
        );

      } catch (error) {

        console.error(
          "Delete Member Error:",
          error
        );


        setDeleteError(
          error.response
            ?.data
            ?.message ||
            "Unable to delete member."
        );

      } finally {

        setDeleteLoading(
          false
        );
      }
    };


  // ====================================================
  // TITLE
  // ====================================================

  const filteredTitle =
    statusFilter === "All"
      ? "All Members"
      : `${statusFilter} Members`;


  // ====================================================
  // PREVIOUS PAGE
  // ====================================================

  const handlePreviousPage =
    async () => {
      if (
        currentPage <= 1 ||
        requestLoading
      ) {
        return;
      }


      const nextPage =
        currentPage - 1;


      /*
        Cached page available hai to
        button click ke saath turant show.
      */

      const cacheKey =
        createCacheKey(
          nextPage,
          statusFilter,
          planFilter,
          searchTerm
        );


      const cached =
        membersCache.get(
          cacheKey
        );


      if (cached) {
        applyCachedData(
          cached
        );
      }


      await fetchMembers(
        nextPage,
        statusFilter,
        planFilter,
        searchTerm,
        {
          useCache: true,
        }
      );
    };


  // ====================================================
  // NEXT PAGE
  // ====================================================

  const handleNextPage =
    async () => {
      if (
        currentPage >=
          totalPages ||
        requestLoading
      ) {
        return;
      }


      const nextPage =
        currentPage + 1;


      const cacheKey =
        createCacheKey(
          nextPage,
          statusFilter,
          planFilter,
          searchTerm
        );


      const cached =
        membersCache.get(
          cacheKey
        );


      if (cached) {
        applyCachedData(
          cached
        );
      }


      await fetchMembers(
        nextPage,
        statusFilter,
        planFilter,
        searchTerm,
        {
          useCache: true,
        }
      );
    };


  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="members-page">


      {/* ================= HEADER ================= */}

      <div className="members-header">

        <div>

          <h1>
            {filteredTitle}
          </h1>

          <p>
            Manage {gymName} members
          </p>

        </div>


        <div className="members-header-actions">

          <button
            type="button"
            className="import-member-btn"
            onClick={
              handleImportOpen
            }
          >
            Import Excel
          </button>


          <button
            type="button"
            className="add-member-btn"
            onClick={
              handleAddMember
            }
          >
            + Add Member
          </button>

        </div>

      </div>


      {/* ================= COUNT ================= */}

      <div className="members-count-info">

        <span>

          {statusFilter === "All" &&
          planFilter === "All" &&
          !searchTerm.trim()
            ? "Total Registered:"
            : "Matching Members:"}

        </span>


        <strong>
          {totalMembers}
        </strong>

      </div>


      {/* ================= FILTERS ================= */}

      <div className="members-filters">

        <input
          type="text"
          className="member-search"
          placeholder="Search by name, phone or ID..."
          value={
            searchTerm
          }
          onChange={
            handleSearchChange
          }
        />


        <select
          className="member-filter-select"
          value={
            statusFilter
          }
          onChange={
            handleStatusChange
          }
        >

          <option value="All">
            All Status
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


        <select
          className="member-filter-select"
          value={
            planFilter
          }
          onChange={
            handlePlanChange
          }
        >

          <option value="All">
            All Plans
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


      {/*
        IMPORTANT:
        Yahan intentionally koi
        "Loading members..." UI nahi hai.

        First request ke waqt page shell
        immediately visible rahega.

        dataReady false ho to fake
        "No members" bhi nahi dikhayenge.
      */}


      {/* ================= EMPTY ================= */}

      {dataReady &&
        members.length === 0 && (

          <p className="members-empty">
            No matching members found.
          </p>

        )}


      {/* ==================================================
          DESKTOP TABLE
      ================================================== */}

      {members.length > 0 && (

        <div className="desktop-members-view">

          <div className="members-table-container">

            <table className="members-table">

              <thead>

                <tr>

                  <th>ID</th>

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
                    Total Fee
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

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
                        {member.phone ||
                          "-"}
                      </td>


                      <td>
                        {member.planName ||
                          "-"}
                      </td>


                      <td>
                        ₹
                        {
                          member.totalAmount ??
                          0
                        }
                      </td>


                      <td>

                        <span
                          className={
                            member.membershipStatus ===
                            "Active"
                              ? "status active-status"

                              : member.membershipStatus ===
                                "Expired"

                              ? "status expired-status"

                              : "status inactive-status"
                          }
                        >

                          {member.membershipStatus ||
                            "-"}

                        </span>

                      </td>


                      <td>

                        <div className="member-actions">

                          <button
                            type="button"
                            className="action-btn"
                            onClick={() =>
                              navigate(
                                `/members/view/${member._id}`,
                                {
                                  state: {
                                    member,
                                  },
                                }
                              )
                            }
                          >
                            View
                          </button>


                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              navigate(
                                `/members/edit/${member._id}`
                              )
                            }
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              handleDeleteClick(
                                member
                              )
                            }
                          >
                            Delete
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

      )}


      {/* ==================================================
          MOBILE CARDS
      ================================================== */}

      {members.length > 0 && (

        <div className="mobile-members-view">

          {members.map(
            (member) => (

              <article
                className="mobile-member-card"
                key={
                  member._id
                }
              >

                <div className="mobile-member-card-top">

                  <div className="mobile-member-avatar">

                    {member.name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "M"}

                  </div>


                  <div className="mobile-member-main">

                    <div className="mobile-member-name-row">

                      <h3>
                        {member.name ||
                          "-"}
                      </h3>


                      <span
                        className={
                          member.membershipStatus ===
                          "Active"
                            ? "status active-status"

                            : member.membershipStatus ===
                              "Expired"

                            ? "status expired-status"

                            : "status inactive-status"
                        }
                      >

                        {member.membershipStatus ||
                          "-"}

                      </span>

                    </div>


                    <p>
                      {member._id}
                    </p>


                    <p>
                      {member.phone ||
                        "-"}
                    </p>

                  </div>

                </div>


                <div className="mobile-member-info-grid">

                  <div>

                    <span>
                      Plan
                    </span>

                    <strong>
                      {member.planName ||
                        "-"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Total Fee
                    </span>

                    <strong>
                      ₹
                      {
                        member.totalAmount ??
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
                        member.paidAmount ??
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
                        member.pendingAmount ??
                        0
                      }
                    </strong>

                  </div>

                </div>


                <div className="mobile-member-card-actions">

                  <button
                    type="button"
                    className="action-btn"
                    onClick={() =>
                      navigate(
                        `/members/view/${member._id}`,
                        {
                          state: {
                            member,
                          },
                        }
                      )
                    }
                  >
                    View
                  </button>


                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() =>
                      navigate(
                        `/members/edit/${member._id}`
                      )
                    }
                  >
                    Edit
                  </button>


                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() =>
                      handleDeleteClick(
                        member
                      )
                    }
                  >
                    Delete
                  </button>

                </div>

              </article>

            )
          )}

        </div>

      )}


      {/* ==================================================
          PAGINATION
      ================================================== */}

      {dataReady &&
        totalPages > 1 && (

          <div className="members-pagination">

            <button
              type="button"
              className="pagination-btn"
              onClick={
                handlePreviousPage
              }
              disabled={
                currentPage <= 1 ||
                requestLoading
              }
            >
              Previous
            </button>


            <div className="pagination-info">

              <span>
                Page
              </span>

              <strong>
                {currentPage}
              </strong>

              <span>
                of
              </span>

              <strong>
                {totalPages}
              </strong>

            </div>


            <button
              type="button"
              className="pagination-btn"
              onClick={
                handleNextPage
              }
              disabled={
                currentPage >=
                  totalPages ||
                requestLoading
              }
            >
              Next
            </button>

          </div>

        )}

        <div className="page-powered-by">
      Powered by <span>Flyit Systems</span>
    </div>


      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      {showDeleteModal &&
        selectedMember && (

          <div className="delete-modal-overlay">

            <div className="delete-modal">

              <h2>
                Delete Member?
              </h2>


              <p>
                Are you sure you want to
                delete{" "}

                <strong>
                  {selectedMember.name}
                </strong>

                ?
              </p>


              <p>
                This will also remove
                payment records linked
                to this member.
              </p>


              {deleteError && (

                <p className="delete-error-message">
                  {deleteError}
                </p>

              )}


              <div className="delete-modal-actions">

                <button
                  type="button"
                  className="delete-cancel-btn"
                  onClick={
                    handleCancelDelete
                  }
                  disabled={
                    deleteLoading
                  }
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="delete-confirm-btn"
                  onClick={
                    handleConfirmDelete
                  }
                  disabled={
                    deleteLoading
                  }
                >

                  {deleteLoading
                    ? "Deleting..."
                    : "Delete"}

                </button>

              </div>

            </div>

          </div>

        )}


      {/* ==================================================
          IMPORT MODAL
      ================================================== */}

      <ImportMembers
        isOpen={
          showImportModal
        }
        onClose={
          handleImportClose
        }
        onImportSuccess={
          handleImportSuccess
        }
      />

    </div>
  );
};


export default Members;