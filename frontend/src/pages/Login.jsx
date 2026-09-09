import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";
import "./Login.css";


const Login = () => {
  const navigate = useNavigate();


  // =====================================================
  // LOGIN
  // =====================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  const [
    forgotOpen,
    setForgotOpen,
  ] = useState(false);

  const [
    recoveryMode,
    setRecoveryMode,
  ] = useState("pin");

  const [
    securityPin,
    setSecurityPin,
  ] = useState("");

  const [
    recoveryCode,
    setRecoveryCode,
  ] = useState("");

  const [
    resetToken,
    setResetToken,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    recoveryLoading,
    setRecoveryLoading,
  ] = useState(false);

  const [
    recoveryError,
    setRecoveryError,
  ] = useState("");

  const [
    recoveryMessage,
    setRecoveryMessage,
  ] = useState("");


  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const response =
        await api.post(
          "/admin/login",
          {
            email:
              email.trim(),

            password,
          }
        );

      const adminData =
        response.data?.data;

      if (!adminData?.token) {
        throw new Error(
          "Token not received from server"
        );
      }

      localStorage.setItem(
        "token",
        adminData.token
      );

      localStorage.setItem(
        "admin",
        JSON.stringify({
          id:
            adminData._id,

          name:
            adminData.name,

          email:
            adminData.email,

          phone:
            adminData.phone || "",
        })
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        "Login Error:",
        error
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "admin"
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to login. Please try again."
      );

    } finally {

      setLoading(false);
    }
  };


  // =====================================================
  // OPEN FORGOT PASSWORD
  // =====================================================

  const handleOpenForgotPassword = () => {

    setForgotOpen(true);

    setRecoveryMode("pin");

    setSecurityPin("");

    setRecoveryCode("");

    setResetToken("");

    setNewPassword("");

    setConfirmPassword("");

    setRecoveryError("");

    setRecoveryMessage("");
  };


  // =====================================================
  // CLOSE FORGOT PASSWORD
  // =====================================================

  const handleCloseForgotPassword = () => {

    setForgotOpen(false);

    setRecoveryMode("pin");

    setSecurityPin("");

    setRecoveryCode("");

    setResetToken("");

    setNewPassword("");

    setConfirmPassword("");

    setRecoveryError("");

    setRecoveryMessage("");
  };


  // =====================================================
  // VERIFY SECURITY PIN
  // =====================================================

  const handleVerifySecurityPin =
    async (e) => {

      e.preventDefault();

      setRecoveryError("");
      setRecoveryMessage("");


      if (!email.trim()) {

        setRecoveryError(
          "Please enter your login email."
        );

        return;
      }


      if (
        securityPin.length !== 6
      ) {

        setRecoveryError(
          "Security PIN must be 6 digits."
        );

        return;
      }


      try {

        setRecoveryLoading(true);


        const response =
          await api.post(
            "/admin/security/verify-pin",
            {
              email:
                email.trim(),

              securityPin,
            }
          );


        const token =
          response.data?.data
            ?.resetToken;


        if (!token) {

          throw new Error(
            "Reset token not received"
          );
        }


        setResetToken(token);

        setRecoveryMessage(
          "Security PIN verified. Set your new password."
        );

      } catch (error) {

        console.error(
          "Verify Security PIN Error:",
          error
        );


        setRecoveryError(
          error.response?.data?.message ||
            "Unable to verify Security PIN."
        );

      } finally {

        setRecoveryLoading(false);
      }
    };


  // =====================================================
  // VERIFY RECOVERY CODE
  // =====================================================

  const handleVerifyRecoveryCode =
    async (e) => {

      e.preventDefault();

      setRecoveryError("");
      setRecoveryMessage("");


      if (!email.trim()) {

        setRecoveryError(
          "Please enter your login email."
        );

        return;
      }


      if (!recoveryCode.trim()) {

        setRecoveryError(
          "Please enter your recovery code."
        );

        return;
      }


      try {

        setRecoveryLoading(true);


        const response =
          await api.post(
            "/admin/security/verify-recovery",
            {
              email:
                email.trim(),

              recoveryCode:
                recoveryCode
                  .trim()
                  .toUpperCase(),
            }
          );


        const token =
          response.data?.data
            ?.resetToken;


        if (!token) {

          throw new Error(
            "Reset token not received"
          );
        }


        setResetToken(token);

        setRecoveryMessage(
          "Recovery code verified. Set your new password."
        );

      } catch (error) {

        console.error(
          "Verify Recovery Code Error:",
          error
        );


        setRecoveryError(
          error.response?.data?.message ||
            "Unable to verify recovery code."
        );

      } finally {

        setRecoveryLoading(false);
      }
    };


  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword =
    async (e) => {

      e.preventDefault();

      setRecoveryError("");
      setRecoveryMessage("");


      if (
        newPassword !==
        confirmPassword
      ) {

        setRecoveryError(
          "New password and confirm password do not match."
        );

        return;
      }


      if (
        newPassword.length < 8
      ) {

        setRecoveryError(
          "Password must be at least 8 characters."
        );

        return;
      }


      try {

        setRecoveryLoading(true);


        const response =
          await api.post(
            "/admin/reset-password",
            {
              resetToken,

              newPassword,

              confirmPassword,
            }
          );


        setRecoveryMessage(
          response.data?.message ||
            "Password reset successfully."
        );


        setPassword("");

        setSecurityPin("");

        setRecoveryCode("");

        setResetToken("");

        setNewPassword("");

        setConfirmPassword("");


        window.setTimeout(
          () => {
            handleCloseForgotPassword();
          },
          1500
        );

      } catch (error) {

        console.error(
          "Reset Password Error:",
          error
        );


        setRecoveryError(
          error.response?.data?.message ||
            "Unable to reset password."
        );

      } finally {

        setRecoveryLoading(false);
      }
    };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="login-page">

      <div className="login-container">

        {/* =============================================
            BRAND
        ============================================= */}

        <div className="login-brand">

          <h1>
            OLYMPICS
            <span>
              GYM
            </span>
          </h1>


          <h2>
            Build Your Strength.
          </h2>


          <p>
            Manage your gym, members
            and memberships from one
            powerful dashboard.
          </p>

        </div>


        {/* =============================================
            LOGIN BOX
        ============================================= */}

        <div className="login-box">

          <div className="login-heading">

            <h2>
              Welcome Back
            </h2>


            <p>
              Sign in to your admin
              account
            </p>

          </div>


          <form
            onSubmit={handleLogin}
          >

            {/* EMAIL */}

            <div className="form-group">

              <label>
                Email Address
              </label>


              <input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                autoComplete="email"
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label>
                Password
              </label>


              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="current-password"
                required
              />

            </div>


            {/* FORGOT PASSWORD */}

            <button
              type="button"
              className="forgot-password-btn"
              onClick={
                handleOpenForgotPassword
              }
            >
              Forgot Password?
            </button>


            {/* LOGIN ERROR */}

            {errorMessage && (

              <p className="login-error">
                {errorMessage}
              </p>

            )}


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading
                ? "Logging in..."
                : "Login"}

            </button>

          </form>


          <p className="login-footer">
            Olympics Gym Management System
          </p>

        </div>

      </div>


      {/* =================================================
          FORGOT PASSWORD MODAL
      ================================================= */}

      {forgotOpen && (

        <div className="forgot-overlay">

          <div className="forgot-modal">


            {/* ===========================================
                MODAL HEADER
            =========================================== */}

            <div className="forgot-header">

              <div>

                <h2>
                  Reset Password
                </h2>

                <p>
                  Verify your identity to
                  reset the admin password.
                </p>

              </div>


              <button
                type="button"
                className="forgot-close-btn"
                onClick={
                  handleCloseForgotPassword
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* ===========================================
                VERIFICATION STEP
            =========================================== */}

            {!resetToken && (

              <>

                {/* LOGIN EMAIL INPUT */}

                <div className="form-group">

                  <label>
                    Login Email
                  </label>


                  <input
                    type="email"
                    placeholder="Enter admin email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    autoComplete="email"
                    required
                  />

                </div>


                {/* PIN / RECOVERY CODE TABS */}

                <div className="forgot-mode-switch">

                  <button
                    type="button"
                    className={
                      recoveryMode ===
                      "pin"
                        ? "active"
                        : ""
                    }
                    onClick={() => {

                      setRecoveryMode(
                        "pin"
                      );

                      setRecoveryError("");

                      setRecoveryMessage("");

                    }}
                  >
                    Security PIN
                  </button>


                  <button
                    type="button"
                    className={
                      recoveryMode ===
                      "recovery"
                        ? "active"
                        : ""
                    }
                    onClick={() => {

                      setRecoveryMode(
                        "recovery"
                      );

                      setRecoveryError("");

                      setRecoveryMessage("");

                    }}
                  >
                    Recovery Code
                  </button>

                </div>


                {/* =======================================
                    SECURITY PIN
                ======================================= */}

                {recoveryMode ===
                "pin" ? (

                  <form
                    onSubmit={
                      handleVerifySecurityPin
                    }
                  >

                    <div className="form-group">

                      <label>
                        Security PIN
                      </label>


                      <input
                        type="password"
                        inputMode="numeric"
                        placeholder="Enter 6-digit PIN"
                        maxLength={6}
                        value={
                          securityPin
                        }
                        onChange={(e) => {

                          const value =
                            e.target.value;


                          if (
                            /^\d*$/.test(
                              value
                            )
                          ) {

                            setSecurityPin(
                              value
                            );

                          }
                        }}
                        required
                      />

                    </div>


                    <button
                      type="submit"
                      className="login-button"
                      disabled={
                        recoveryLoading
                      }
                    >

                      {recoveryLoading
                        ? "Verifying..."
                        : "Verify PIN"}

                    </button>

                  </form>

                ) : (

                  /* =====================================
                     RECOVERY CODE
                  ===================================== */

                  <form
                    onSubmit={
                      handleVerifyRecoveryCode
                    }
                  >

                    <div className="form-group">

                      <label>
                        Recovery Code
                      </label>


                      <input
                        type="text"
                        placeholder="OGYM-XXXX-XXXX-XXXX"
                        value={
                          recoveryCode
                        }
                        onChange={(e) =>
                          setRecoveryCode(
                            e.target.value
                          )
                        }
                        autoComplete="off"
                        required
                      />

                    </div>


                    <button
                      type="submit"
                      className="login-button"
                      disabled={
                        recoveryLoading
                      }
                    >

                      {recoveryLoading
                        ? "Verifying..."
                        : "Verify Recovery Code"}

                    </button>

                  </form>

                )}

              </>

            )}


            {/* ===========================================
                NEW PASSWORD STEP
            =========================================== */}

            {resetToken && (

              <form
                onSubmit={
                  handleResetPassword
                }
              >

                <div className="form-group">

                  <label>
                    New Password
                  </label>


                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={
                      newPassword
                    }
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Confirm Password
                  </label>


                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />

                </div>


                <button
                  type="submit"
                  className="login-button"
                  disabled={
                    recoveryLoading
                  }
                >

                  {recoveryLoading
                    ? "Resetting..."
                    : "Reset Password"}

                </button>

              </form>

            )}


            {/* ===========================================
                ERROR / SUCCESS
            =========================================== */}

            {recoveryError && (

              <p className="login-error forgot-message">
                {recoveryError}
              </p>

            )}


            {recoveryMessage && (

              <p className="forgot-success">
                {recoveryMessage}
              </p>

            )}

          </div>

        </div>

      )}

    </div>
  );
};


export default Login;