import {
  useState,
} from "react";

import {
  FiLock,
  FiMail,
  FiArrowRight,
} from "react-icons/fi";

import flyitAdminApi from "../../services/flyitAdminApi";


const FlyitAdminLogin = () => {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");


      if (
        !email.trim() ||
        !password
      ) {
        setError(
          "Email and password are required."
        );

        return;
      }


      try {
        setLoading(true);


        const response =
          await flyitAdminApi.post(
            "/login",
            {
              email:
                email
                  .trim()
                  .toLowerCase(),

              password,
            }
          );


        const data =
          response.data?.data;


        if (!data?.token) {
          throw new Error(
            "Login token not received."
          );
        }


        // =========================================
        // SAVE FLYIT ADMIN SESSION
        // =========================================

        localStorage.setItem(
          "flyitAdminToken",
          data.token
        );


        localStorage.setItem(
          "flyitAdmin",
          JSON.stringify({
            _id:
              data._id,

            name:
              data.name,

            email:
              data.email,

            role:
              data.role,
          })
        );


        // App.jsx ko fresh localStorage
        // read karwana hai.
        window.location.replace(
          "/flyit-admin/dashboard"
        );

      } catch (error) {

        console.error(
          "Flyit Admin Login Error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to login."
        );

      } finally {

        setLoading(false);
      }
    };


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080A0F] px-4 py-10 text-white">


      {/* =========================================
          BACKGROUND
      ========================================= */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-[-160px] top-[-160px] h-[430px] w-[430px] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="absolute bottom-[-180px] right-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:38px_38px]" />

      </div>


      {/* =========================================
          LOGIN CARD
      ========================================= */}

      <div className="relative w-full max-w-[430px]">


        {/* BRAND */}

        <div className="mb-7 text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-sm font-black shadow-[0_15px_40px_rgba(37,99,235,0.25)]">
            FS
          </div>


          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-400">
            Flyit Systems
          </p>


          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Admin Control
          </h1>


          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage gym trials and client access.
          </p>

        </div>


        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-2xl border border-white/[0.08] bg-[#11141B]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-7"
        >


          {/* ERROR */}

          {error && (

            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-xs leading-5 text-red-300">
              {error}
            </div>

          )}


          {/* EMAIL */}

          <div className="mb-4">

            <label
              htmlFor="flyit-email"
              className="mb-1.5 block text-[11px] font-semibold text-slate-400"
            >
              Email Address
            </label>


            <div className="relative">

              <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-600" />


              <input
                id="flyit-email"
                type="email"
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="admin@flyitsystems.com"
                autoComplete="email"
                disabled={
                  loading
                }
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#090D14] pl-10 pr-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/[0.05] disabled:opacity-60"
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="mb-6">

            <label
              htmlFor="flyit-password"
              className="mb-1.5 block text-[11px] font-semibold text-slate-400"
            >
              Password
            </label>


            <div className="relative">

              <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-600" />


              <input
                id="flyit-password"
                type="password"
                value={
                  password
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={
                  loading
                }
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#090D14] pl-10 pr-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/[0.05] disabled:opacity-60"
              />

            </div>

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={
              loading
            }
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign In
                <FiArrowRight />
              </>
            )}

          </button>


          <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">

            <p className="text-[10px] leading-5 text-slate-600">
              Internal Flyit Systems access only.
            </p>

          </div>

        </form>


        <p className="mt-5 text-center text-[10px] text-slate-700">
          Gym Management Trial Platform
        </p>

      </div>

    </div>
  );
};


export default FlyitAdminLogin;