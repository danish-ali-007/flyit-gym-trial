import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiLogOut,
  FiMessageCircle,
  FiPlus,
  FiPower,
  FiRefreshCw,
  FiSearch,
  FiSlash,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import flyitAdminApi from "../../services/flyitAdminApi";


const FRONTEND_BASE =
  window.location.origin;


// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "-";
  }

  return parsed.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};


// =====================================================
// REMAINING TRIAL TIME
// =====================================================

const getRemainingInfo = (
  trialEnd
) => {
  if (!trialEnd) {
    return {
      text: "Expired",
      type: "expired",
    };
  }


  const now =
    new Date();

  const end =
    new Date(
      trialEnd
    );


  const difference =
    end.getTime() -
    now.getTime();


  if (difference <= 0) {
    return {
      text: "Expired",
      type: "expired",
    };
  }


  const totalHours =
    Math.ceil(
      difference /
        (
          1000 *
          60 *
          60
        )
    );


  if (totalHours <= 24) {
    return {
      text:
        `${totalHours}h left`,

      type:
        "soon",
    };
  }


  const days =
    Math.ceil(
      totalHours / 24
    );


  return {
    text:
      `${days} day${
        days === 1
          ? ""
          : "s"
      } left`,

    type:
      "normal",
  };
};


// =====================================================
// COMPONENT
// =====================================================

const FlyitAdminDashboard = () => {

  const flyitAdmin =
    JSON.parse(
      localStorage.getItem(
        "flyitAdmin"
      ) || "{}"
    );


  const [
    gyms,
    setGyms,
  ] = useState([]);


  const [
    summary,
    setSummary,
  ] = useState({
    totalTrials: 0,
    activeTrials: 0,
    expiredTrials: 0,
    disabledTrials: 0,
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");


  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);


  const [
    showExtendModal,
    setShowExtendModal,
  ] = useState(false);


  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);


  const [
    selectedGym,
    setSelectedGym,
  ] = useState(null);


  const [
    extendDays,
    setExtendDays,
  ] = useState(3);


  const [
    creating,
    setCreating,
  ] = useState(false);


  const [
    createdTrial,
    setCreatedTrial,
  ] = useState(null);


  const [
    form,
    setForm,
  ] = useState({
    gymName: "",
    ownerName: "",
    phone: "",
    trialDays: 3,
  });


  // =====================================================
  // FETCH TRIALS
  // silent = true means no full page loading flash
  // =====================================================

  const fetchTrials =
    async (
      silent = false
    ) => {

      try {

        if (!silent) {
          setLoading(true);
        }


        setError("");


        const response =
          await flyitAdminApi.get(
            "/trials"
          );


        setGyms(
          response.data?.data ||
            []
        );


        setSummary(
          response.data?.summary ||
            {
              totalTrials: 0,
              activeTrials: 0,
              expiredTrials: 0,
              disabledTrials: 0,
            }
        );

      } catch (error) {

        console.error(
          "Fetch Trials Error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            "Unable to load trials."
        );

      } finally {

        if (!silent) {
          setLoading(false);
        }
      }
    };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    const token =
      localStorage.getItem(
        "flyitAdminToken"
      );


    if (!token) {

      window.location.replace(
        "/flyit-admin"
      );

      return;
    }


    fetchTrials();

  }, []);


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleFormChange =
    (event) => {

      const {
        name,
        value,
      } =
        event.target;


      setForm(
        (previous) => ({
          ...previous,

          [name]:
            value,
        })
      );
    };


  // =====================================================
  // CREATE TRIAL
  // =====================================================

  const handleCreateTrial =
    async (event) => {

      event.preventDefault();


      setError("");
      setSuccessMessage("");
      setCreatedTrial(null);


      if (
        !form.gymName.trim() ||
        !form.ownerName.trim() ||
        !form.phone.trim()
      ) {

        setError(
          "Gym name, owner name and phone are required."
        );

        return;
      }


      const trialDays =
        Number(
          form.trialDays
        );


      if (
        Number.isNaN(
          trialDays
        ) ||
        trialDays < 1 ||
        trialDays > 30
      ) {

        setError(
          "Trial days must be between 1 and 30."
        );

        return;
      }


      try {

        setCreating(true);


        const response =
          await flyitAdminApi.post(
            "/trials",
            {
              gymName:
                form.gymName
                  .trim(),

              ownerName:
                form.ownerName
                  .trim(),

              phone:
                form.phone
                  .trim(),

              trialDays,
            }
          );


        const newGym =
          response.data?.data;


        setCreatedTrial(
          newGym
        );


        setForm({
          gymName: "",
          ownerName: "",
          phone: "",
          trialDays: 3,
        });


        setShowCreateModal(
          false
        );


        setSuccessMessage(
          "Trial gym created successfully."
        );


        await fetchTrials(
          true
        );

      } catch (error) {

        console.error(
          "Create Trial Error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            "Unable to create trial."
        );

      } finally {

        setCreating(false);
      }
    };


  // =====================================================
  // COPY LINK
  // =====================================================

  const copyTrialLink =
    async (gym) => {

      if (!gym?.trialToken) {

        setError(
          "Trial link is not available."
        );

        return;
      }


      const link =
        `${FRONTEND_BASE}/trial/${gym.trialToken}`;


      try {

        await navigator.clipboard
          .writeText(
            link
          );


        setSuccessMessage(
          `${gym.gymName} trial link copied.`
        );


        setError("");

      } catch (error) {

        console.error(
          "Copy Error:",
          error
        );


        setError(
          "Unable to copy trial link."
        );
      }
    };


  // =====================================================
  // OPEN TRIAL
  // =====================================================

  const openTrial =
    (gym) => {

      if (!gym?.trialToken) {

        setError(
          "Trial link is not available."
        );

        return;
      }


      window.open(
        `${FRONTEND_BASE}/trial/${gym.trialToken}`,
        "_blank",
        "noopener,noreferrer"
      );
    };


  // =====================================================
  // WHATSAPP
  // =====================================================

  const shareOnWhatsApp =
    (gym) => {

      if (!gym?.trialToken) {

        setError(
          "Trial link is not available."
        );

        return;
      }


      const cleanPhone =
        String(
          gym.phone || ""
        ).replace(
          /\D/g,
          ""
        );


      const whatsappPhone =
        cleanPhone.length === 10
          ? `91${cleanPhone}`
          : cleanPhone;


      const link =
        `${FRONTEND_BASE}/trial/${gym.trialToken}`;


      const message =
        `Hello ${gym.ownerName},\n\n` +
        `Your Flyit Systems Gym Management trial is ready.\n\n` +
        `Gym: ${gym.gymName}\n` +
        `Trial Link: ${link}\n` +
        `Valid Until: ${formatDate(
          gym.trialEnd
        )}\n\n` +
        `Open the link to access your dashboard directly.\n\n` +
        `- Flyit Systems`;


      const url =
        `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
          message
        )}`;


      window.location.href =
        url;
    };


  // =====================================================
  // EXTEND TRIAL
  // =====================================================

  const extendTrial =
    async (
      gym,
      days
    ) => {

      const safeDays =
        Number(days);


      if (
        Number.isNaN(
          safeDays
        ) ||
        safeDays < 1 ||
        safeDays > 30
      ) {

        setError(
          "Extension must be between 1 and 30 days."
        );

        return;
      }


      try {

        setActionLoading(
          `extend-${gym._id}`
        );


        setError("");
        setSuccessMessage("");


        await flyitAdminApi.put(
          `/trials/${gym._id}/extend`,
          {
            days:
              safeDays,
          }
        );


        setSuccessMessage(
          `${gym.gymName} trial extended by ${safeDays} days.`
        );


        setShowExtendModal(
          false
        );


        setSelectedGym(
          null
        );


        setExtendDays(
          3
        );


        await fetchTrials(
          true
        );

      } catch (error) {

        console.error(
          "Extend Trial Error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            "Unable to extend trial."
        );

      } finally {

        setActionLoading("");
      }
    };


  // =====================================================
  // DISABLE TRIAL
  // =====================================================

  const disableTrial =
    async (gym) => {

      try {

        setActionLoading(
          `disable-${gym._id}`
        );


        setError("");
        setSuccessMessage("");


        await flyitAdminApi.put(
          `/trials/${gym._id}/disable`
        );


        setSuccessMessage(
          `${gym.gymName} disabled.`
        );


        await fetchTrials(
          true
        );

      } catch (error) {

        console.error(
          "Disable Trial Error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            "Unable to disable trial."
        );

      } finally {

        setActionLoading("");
      }
    };


  // =====================================================
  // ENABLE TRIAL
  // =====================================================

  const enableTrial =
    async (gym) => {

      try {

        setActionLoading(
          `enable-${gym._id}`
        );


        setError("");
        setSuccessMessage("");


        await flyitAdminApi.put(
          `/trials/${gym._id}/enable`
        );


        setSuccessMessage(
          `${gym.gymName} enabled.`
        );


        await fetchTrials(
          true
        );

      } catch (error) {

        console.error(
          "Enable Trial Error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            "Unable to enable trial."
        );

      } finally {

        setActionLoading("");
      }
    };


  // =====================================================
  // DELETE TRIAL
  // =====================================================

  const deleteTrial =
    async (gym) => {

      if (!gym?._id) {
        return;
      }


      try {

        setActionLoading(
          `delete-${gym._id}`
        );


        setError("");
        setSuccessMessage("");


        await flyitAdminApi.delete(
          `/trials/${gym._id}`
        );


        setShowDeleteModal(
          false
        );


        setSelectedGym(
          null
        );


        setSuccessMessage(
          `${gym.gymName} and all trial data deleted permanently.`
        );


        await fetchTrials(
          true
        );

      } catch (error) {

        console.error(
          "Delete Trial Error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            "Unable to delete trial."
        );

      } finally {

        setActionLoading("");
      }
    };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "flyitAdminToken"
    );


    localStorage.removeItem(
      "flyitAdmin"
    );


    window.location.replace(
      "/flyit-admin"
    );
  };


  // =====================================================
  // FILTER
  // =====================================================

  const filteredGyms =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return gyms.filter(
        (gym) => {

          const matchesSearch =
            !query ||
            [
              gym.gymName,
              gym.ownerName,
              gym.phone,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      query
                    )
              );


          const matchesFilter =
            activeFilter ===
              "all" ||
            gym.status ===
              activeFilter;


          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );

    }, [
      gyms,
      search,
      activeFilter,
    ]);


  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">

          <div>

            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-600">
              Flyit Systems
            </p>


            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Trial Control Center
            </h1>


            <p className="mt-1.5 text-sm text-slate-500">
              Manage trials, clients and access links.
            </p>

          </div>


          <div className="flex flex-wrap items-center gap-2">

            <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                FS
              </div>


              <div>

                <p className="text-xs font-semibold text-slate-800">
                  {flyitAdmin.name ||
                    "Flyit Admin"}
                </p>

                <p className="text-[10px] text-slate-500">
                  Super Admin
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                setShowCreateModal(
                  true
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <FiPlus />

              New Trial
            </button>


            <button
              type="button"
              onClick={
                handleLogout
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <FiLogOut />

              Logout
            </button>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">


        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (

          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}


            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <FiX />
            </button>

          </div>

        )}


        {successMessage && (

          <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            {successMessage}


            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
            >
              <FiX />
            </button>

          </div>

        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <SummaryCard
            title="Total Trials"
            value={
              summary.totalTrials
            }
            icon={
              <FiActivity />
            }
            iconClass="bg-blue-50 text-blue-600"
          />


          <SummaryCard
            title="Active"
            value={
              summary.activeTrials
            }
            icon={
              <FiCheckCircle />
            }
            iconClass="bg-emerald-50 text-emerald-600"
          />


          <SummaryCard
            title="Expired"
            value={
              summary.expiredTrials
            }
            icon={
              <FiXCircle />
            }
            iconClass="bg-red-50 text-red-600"
          />


          <SummaryCard
            title="Disabled"
            value={
              summary.disabledTrials
            }
            icon={
              <FiSlash />
            }
            iconClass="bg-slate-100 text-slate-600"
          />

        </section>


        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <section className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />


            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search gym, owner or phone..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>


          <div className="flex gap-1 overflow-x-auto">

            {[
              ["all", "All"],
              ["trial", "Active"],
              ["expired", "Expired"],
              ["disabled", "Disabled"],
            ].map(
              ([
                key,
                label,
              ]) => (

                <button
                  key={
                    key
                  }
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      key
                    )
                  }
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    activeFilter ===
                    key
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>

              )
            )}

          </div>

        </section>


        {/* =================================================
            TRIAL LIST
        ================================================= */}

        {loading ? (

          <div className="rounded-xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
            Loading trials...
          </div>

        ) : filteredGyms.length ===
        0 ? (

          <div className="rounded-xl border border-slate-200 bg-white py-20 text-center">

            <p className="font-medium text-slate-600">
              No trials found.
            </p>

          </div>

        ) : (

          <section className="space-y-3">

            {filteredGyms.map(
              (gym) => {

                const remaining =
                  getRemainingInfo(
                    gym.trialEnd
                  );


                return (
                  <article
                    key={
                      gym._id
                    }
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >

                    <div className="p-4 sm:p-5">


                      {/* TOP */}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-600">

                            {String(
                              gym.gymName ||
                                "G"
                            )
                              .charAt(0)
                              .toUpperCase()}

                          </div>


                          <div>

                            <h2 className="text-base font-bold text-slate-900">
                              {gym.gymName}
                            </h2>


                            <p className="mt-1 text-xs text-slate-500">
                              {gym.ownerName}
                              {" • "}
                              {gym.phone}
                            </p>

                          </div>

                        </div>


                        <div className="flex items-center gap-2">

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              gym.status ===
                              "trial"
                                ? "bg-emerald-50 text-emerald-700"
                                : gym.status ===
                                  "expired"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {gym.status ===
                            "trial"
                              ? "ACTIVE"
                              : String(
                                  gym.status
                                ).toUpperCase()}
                          </span>


                          <span
                            className={`flex items-center gap-1 text-[11px] ${
                              remaining.type ===
                              "soon"
                                ? "text-amber-600"
                                : remaining.type ===
                                  "expired"
                                ? "text-red-600"
                                : "text-slate-500"
                            }`}
                          >
                            <FiClock />

                            {remaining.text}
                          </span>

                        </div>

                      </div>


                      {/* META */}

                      <div className="mt-4 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">

                        <Meta
                          title="Trial Start"
                          value={
                            formatDate(
                              gym.trialStart
                            )
                          }
                        />


                        <Meta
                          title="Trial End"
                          value={
                            formatDate(
                              gym.trialEnd
                            )
                          }
                        />


                        <Meta
                          title="Gym ID"
                          value={
                            gym._id
                          }
                          mono
                        />

                      </div>


                      {/* ACTIONS */}

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">

                        <ActionButton
                          onClick={() =>
                            copyTrialLink(
                              gym
                            )
                          }
                          icon={
                            <FiCopy />
                          }
                          text="Copy Link"
                        />


                        <ActionButton
                          onClick={() =>
                            openTrial(
                              gym
                            )
                          }
                          icon={
                            <FiExternalLink />
                          }
                          text="Open"
                        />


                        <ActionButton
                          onClick={() =>
                            shareOnWhatsApp(
                              gym
                            )
                          }
                          icon={
                            <FiMessageCircle />
                          }
                          text="WhatsApp"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        />


                        <ActionButton
                          onClick={() => {

                            setSelectedGym(
                              gym
                            );


                            setExtendDays(
                              3
                            );


                            setShowExtendModal(
                              true
                            );
                          }}
                          icon={
                            <FiRefreshCw />
                          }
                          text="Extend"
                          className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        />


                        {gym.status ===
                        "disabled" ? (

                          <ActionButton
                            onClick={() =>
                              enableTrial(
                                gym
                              )
                            }
                            icon={
                              <FiPower />
                            }
                            text={
                              actionLoading ===
                              `enable-${gym._id}`
                                ? "Enabling..."
                                : "Enable"
                            }
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          />

                        ) : (

                          <ActionButton
                            onClick={() =>
                              disableTrial(
                                gym
                              )
                            }
                            icon={
                              <FiPower />
                            }
                            text={
                              actionLoading ===
                              `disable-${gym._id}`
                                ? "Disabling..."
                                : "Disable"
                            }
                            className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          />

                        )}


                        <ActionButton
                          onClick={() => {

                            setSelectedGym(
                              gym
                            );


                            setShowDeleteModal(
                              true
                            );
                          }}
                          icon={
                            <FiTrash2 />
                          }
                          text="Delete"
                          className="col-span-2 border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 sm:col-span-1"
                        />

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </section>

        )}

      </main>


      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {showCreateModal && (

        <ModalOverlay
          onClose={() =>
            setShowCreateModal(
              false
            )
          }
        >

          <form
            onSubmit={
              handleCreateTrial
            }
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <ModalHeader
              title="Create Gym Trial"
              subtitle="Generate a passwordless client trial."
              onClose={() =>
                setShowCreateModal(
                  false
                )
              }
            />


            <div className="grid gap-4 p-5 sm:grid-cols-2">

              <FormField
                label="Gym Name"
                name="gymName"
                value={
                  form.gymName
                }
                onChange={
                  handleFormChange
                }
                placeholder="Muscle Factory Gym"
                className="sm:col-span-2"
              />


              <FormField
                label="Owner Name"
                name="ownerName"
                value={
                  form.ownerName
                }
                onChange={
                  handleFormChange
                }
                placeholder="Rahul Sharma"
              />


              <FormField
                label="Phone"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleFormChange
                }
                placeholder="9876543210"
              />


              <div className="sm:col-span-2">

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Trial Duration
                </label>


                <div className="grid grid-cols-4 gap-2">

                  {[
                    1,
                    3,
                    7,
                    14,
                  ].map(
                    (days) => (

                      <button
                        key={
                          days
                        }
                        type="button"
                        onClick={() =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              trialDays:
                                days,
                            })
                          )
                        }
                        className={`h-10 rounded-lg border text-xs font-bold ${
                          Number(
                            form.trialDays
                          ) ===
                          days
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {days}d
                      </button>

                    )
                  )}

                </div>


                <input
                  type="number"
                  name="trialDays"
                  value={
                    form.trialDays
                  }
                  onChange={
                    handleFormChange
                  }
                  min="1"
                  max="30"
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>


            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">

              <button
                type="button"
                disabled={
                  creating
                }
                onClick={() =>
                  setShowCreateModal(
                    false
                  )
                }
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  creating
                }
                className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating
                  ? "Creating..."
                  : "Create Trial"}
              </button>

            </div>

          </form>

        </ModalOverlay>

      )}


      {/* =================================================
          EXTEND MODAL
      ================================================= */}

      {showExtendModal &&
        selectedGym && (

        <ModalOverlay
          onClose={() => {

            if (
              actionLoading !==
              `extend-${selectedGym._id}`
            ) {

              setShowExtendModal(
                false
              );


              setSelectedGym(
                null
              );
            }
          }}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <ModalHeader
              title={`Extend ${selectedGym.gymName}`}
              subtitle="Choose how many days to add."
              onClose={() => {

                if (
                  actionLoading !==
                  `extend-${selectedGym._id}`
                ) {

                  setShowExtendModal(
                    false
                  );


                  setSelectedGym(
                    null
                  );
                }
              }}
            />


            <div className="p-5">

              <input
                type="number"
                min="1"
                max="30"
                value={
                  extendDays
                }
                onChange={(
                  event
                ) =>
                  setExtendDays(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />


              <div className="mt-3 grid grid-cols-4 gap-2">

                {[
                  1,
                  3,
                  7,
                  14,
                ].map(
                  (days) => (

                    <button
                      key={
                        days
                      }
                      type="button"
                      onClick={() =>
                        setExtendDays(
                          days
                        )
                      }
                      className={`h-9 rounded-lg border text-xs font-semibold ${
                        Number(
                          extendDays
                        ) ===
                        days
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      +{days}d
                    </button>

                  )
                )}

              </div>

            </div>


            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">

              <button
                type="button"
                disabled={
                  actionLoading ===
                  `extend-${selectedGym._id}`
                }
                onClick={() => {

                  setShowExtendModal(
                    false
                  );


                  setSelectedGym(
                    null
                  );
                }}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={
                  actionLoading ===
                  `extend-${selectedGym._id}`
                }
                onClick={() =>
                  extendTrial(
                    selectedGym,
                    extendDays
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {actionLoading ===
                `extend-${selectedGym._id}` ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Extending...
                  </>
                ) : (
                  <>
                    <FiRefreshCw />
                    Extend Trial
                  </>
                )}

              </button>

            </div>

          </div>

        </ModalOverlay>

      )}


      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {showDeleteModal &&
        selectedGym && (

        <ModalOverlay
          onClose={() => {

            if (
              actionLoading !==
              `delete-${selectedGym._id}`
            ) {

              setShowDeleteModal(
                false
              );


              setSelectedGym(
                null
              );
            }
          }}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start gap-4 border-b border-slate-100 p-5">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">
                <FiTrash2 />
              </div>


              <div className="flex-1">

                <h2 className="text-lg font-bold text-slate-900">
                  Delete Trial?
                </h2>


                <p className="mt-1 text-xs leading-5 text-slate-500">
                  This will permanently remove the gym
                  and all data connected to this trial.
                </p>

              </div>


              <button
                type="button"
                disabled={
                  actionLoading ===
                  `delete-${selectedGym._id}`
                }
                onClick={() => {

                  setShowDeleteModal(
                    false
                  );


                  setSelectedGym(
                    null
                  );
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiX />
              </button>

            </div>


            <div className="p-5">

              <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                  Trial to be deleted
                </p>


                <p className="mt-2 font-bold text-slate-900">
                  {selectedGym.gymName}
                </p>


                <p className="mt-1 text-xs text-slate-500">
                  {selectedGym.ownerName}
                  {" • "}
                  {selectedGym.phone}
                </p>

              </div>


              <div className="mt-4 rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold text-slate-700">
                  This will permanently delete:
                </p>


                <div className="mt-3 space-y-2 text-xs text-slate-500">

                  <p>
                    • Gym trial record
                  </p>

                  <p>
                    • All members and demo members
                  </p>

                  <p>
                    • All payment records
                  </p>

                  <p>
                    • Membership renewal records
                  </p>

                  <p>
                    • Linked gym admin data
                  </p>

                </div>

              </div>


              <p className="mt-4 text-xs font-semibold text-red-600">
                This action cannot be undone.
              </p>

            </div>


            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">

              <button
                type="button"
                disabled={
                  actionLoading ===
                  `delete-${selectedGym._id}`
                }
                onClick={() => {

                  setShowDeleteModal(
                    false
                  );


                  setSelectedGym(
                    null
                  );
                }}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={
                  actionLoading ===
                  `delete-${selectedGym._id}`
                }
                onClick={() =>
                  deleteTrial(
                    selectedGym
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {actionLoading ===
                `delete-${selectedGym._id}` ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Permanently Delete
                  </>
                )}

              </button>

            </div>

          </div>

        </ModalOverlay>

      )}


      {/* =================================================
          CREATED TRIAL
      ================================================= */}

      {createdTrial?.trialToken && (

        <div className="fixed bottom-4 left-4 right-4 z-[100] ml-auto max-w-md rounded-xl border border-blue-200 bg-white p-4 shadow-xl sm:left-auto sm:right-5">

          <div className="flex justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Trial Created
              </p>


              <p className="mt-1 text-sm font-semibold text-slate-900">
                {createdTrial.gymName}
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                setCreatedTrial(
                  null
                )
              }
              className="text-slate-400"
            >
              <FiX />
            </button>

          </div>


          <p className="mt-3 break-all rounded-lg bg-slate-50 p-2 font-mono text-[10px] text-slate-500">
            {`${FRONTEND_BASE}/trial/${createdTrial.trialToken}`}
          </p>


          <div className="mt-3 grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() =>
                copyTrialLink(
                  createdTrial
                )
              }
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-bold text-white"
            >
              <FiCopy />

              Copy Link
            </button>


            <button
              type="button"
              onClick={() =>
                shareOnWhatsApp(
                  createdTrial
                )
              }
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700"
            >
              <FiMessageCircle />

              WhatsApp
            </button>

          </div>

        </div>

      )}

    </div>
  );
};


// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  title,
  value,
  icon,
  iconClass,
}) => {

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-lg ${iconClass}`}
      >
        {icon}
      </div>


      <p className="text-xs font-medium text-slate-500">
        {title}
      </p>


      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
};


// =====================================================
// META
// =====================================================

const Meta = ({
  title,
  value,
  mono = false,
}) => {

  return (
    <div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>


      <p
        className={`mt-1 text-xs text-slate-700 ${
          mono
            ? "break-all font-mono text-[10px]"
            : "font-medium"
        }`}
      >
        {value}
      </p>

    </div>
  );
};


// =====================================================
// ACTION BUTTON
// =====================================================

const ActionButton = ({
  icon,
  text,
  onClick,
  className = "",
}) => {

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 ${className}`}
    >
      {icon}

      {text}
    </button>
  );
};


// =====================================================
// MODAL OVERLAY
// =====================================================

const ModalOverlay = ({
  children,
  onClose,
}) => {

  return (
    <div
      onClick={
        onClose
      }
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
    >
      {children}
    </div>
  );
};


// =====================================================
// MODAL HEADER
// =====================================================

const ModalHeader = ({
  title,
  subtitle,
  onClose,
}) => {

  return (
    <div className="flex items-start justify-between border-b border-slate-100 p-5">

      <div>

        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>


        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>

      </div>


      <button
        type="button"
        onClick={
          onClose
        }
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <FiX />
      </button>

    </div>
  );
};


// =====================================================
// FORM FIELD
// =====================================================

const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  className = "",
}) => {

  return (
    <div className={className}>

      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>


      <input
        type="text"
        name={
          name
        }
        value={
          value
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
};


export default FlyitAdminDashboard; 