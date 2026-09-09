import {
  useEffect,
  useState,
} from "react";

import {
  FiUser,
  FiPhone,
  FiMail,
  FiLock,
  FiShield,
  FiKey,
  FiSave,
  FiEye,
  FiEyeOff,
  FiCopy,
} from "react-icons/fi";

import api from "../services/api";
import "./Profile.css";


const Profile = () => {

  // =====================================================
  // PROFILE
  // =====================================================

  const [profile, setProfile] =
    useState({
      name: "",
      email: "",
      phone: "",
      securityPinConfigured: false,
      recoveryCodeConfigured: false,
    });


  const [profileLoading, setProfileLoading] =
    useState(true);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");


  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });


  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");


  // =====================================================
  // SECURITY PIN
  // =====================================================

  const [pinForm, setPinForm] =
    useState({
      currentPassword: "",
      securityPin: "",
      confirmSecurityPin: "",
    });


  const [pinLoading, setPinLoading] =
    useState(false);

  const [pinMessage, setPinMessage] =
    useState("");

  const [pinError, setPinError] =
    useState("");

  const [recoveryCode, setRecoveryCode] =
    useState("");


  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  // =====================================================
  // FETCH PROFILE
  // =====================================================

  const fetchProfile = async () => {
    try {

      setProfileLoading(true);
      setProfileError("");


      const response =
        await api.get(
          "/admin/profile"
        );


      const data =
        response.data?.data;


      if (!data) {
        throw new Error(
          "Profile data not received"
        );
      }


      setProfile({
        name:
          data.name || "",

        email:
          data.email || "",

        phone:
          data.phone || "",

        securityPinConfigured:
          Boolean(
            data.securityPinConfigured
          ),

        recoveryCodeConfigured:
          Boolean(
            data.recoveryCodeConfigured
          ),
      });

    } catch (error) {

      console.error(
        "Profile Load Error:",
        error
      );


      setProfileError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load profile."
      );

    } finally {

      setProfileLoading(false);
    }
  };


  useEffect(() => {
    fetchProfile();
  }, []);


  // =====================================================
  // PROFILE INPUT CHANGE
  // =====================================================

  const handleProfileChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const handleProfileSave =
    async (e) => {

      e.preventDefault();

      setProfileMessage("");
      setProfileError("");


      try {

        setProfileSaving(true);


        const response =
          await api.put(
            "/admin/profile",
            {
              name:
                profile.name.trim(),

              phone:
                profile.phone.trim(),
            }
          );


        const updated =
          response.data?.data;


        if (updated) {

          setProfile(
            (previous) => ({
              ...previous,

              name:
                updated.name,

              email:
                updated.email,

              phone:
                updated.phone || "",
            })
          );


          // Update Header/localStorage name
          const storedAdmin =
            JSON.parse(
              localStorage.getItem(
                "admin"
              ) || "{}"
            );


          localStorage.setItem(
            "admin",
            JSON.stringify({
              ...storedAdmin,

              name:
                updated.name,

              email:
                updated.email,

              phone:
                updated.phone || "",
            })
          );
        }


        setProfileMessage(
          response.data?.message ||
            "Profile updated successfully"
        );

      } catch (error) {

        console.error(
          "Profile Update Error:",
          error
        );


        setProfileError(
          error.response?.data?.message ||
            "Unable to update profile."
        );

      } finally {

        setProfileSaving(false);
      }
    };


  // =====================================================
  // PASSWORD INPUT
  // =====================================================

  const handlePasswordChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    setPasswordForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handlePasswordSubmit =
    async (e) => {

      e.preventDefault();

      setPasswordMessage("");
      setPasswordError("");


      if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
      ) {
        setPasswordError(
          "New password and confirm password do not match"
        );

        return;
      }


      try {

        setPasswordLoading(true);


        const response =
          await api.put(
            "/admin/change-password",
            passwordForm
          );


        setPasswordMessage(
          response.data?.message ||
            "Password changed successfully"
        );


        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });


        /*
          Backend password successfully changed.
          Current JWT technically remains valid with
          present backend implementation.

          We do not automatically logout here so
          owner can finish Security PIN setup etc.
        */

      } catch (error) {

        console.error(
          "Change Password Error:",
          error
        );


        setPasswordError(
          error.response?.data?.message ||
            "Unable to change password."
        );

      } finally {

        setPasswordLoading(false);
      }
    };


  // =====================================================
  // PIN INPUT
  // =====================================================

  const handlePinChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    // PIN fields allow digits only
    if (
      (
        name === "securityPin" ||
        name === "confirmSecurityPin"
      ) &&
      !/^\d*$/.test(value)
    ) {
      return;
    }


    setPinForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  // =====================================================
  // SET / CHANGE SECURITY PIN
  // =====================================================

  const handlePinSubmit =
    async (e) => {

      e.preventDefault();

      setPinMessage("");
      setPinError("");
      setRecoveryCode("");


      if (
        pinForm.securityPin.length !==
        6
      ) {
        setPinError(
          "Security PIN must be exactly 6 digits"
        );

        return;
      }


      if (
        pinForm.securityPin !==
        pinForm.confirmSecurityPin
      ) {
        setPinError(
          "Security PIN and confirm PIN do not match"
        );

        return;
      }


      try {

        setPinLoading(true);


        const response =
          await api.post(
            "/admin/security/setup",
            pinForm
          );


        const generatedCode =
          response.data?.data
            ?.recoveryCode || "";


        setRecoveryCode(
          generatedCode
        );


        setPinMessage(
          response.data?.message ||
            "Security PIN configured successfully"
        );


        setPinForm({
          currentPassword: "",
          securityPin: "",
          confirmSecurityPin: "",
        });


        setProfile(
          (previous) => ({
            ...previous,

            securityPinConfigured:
              true,

            recoveryCodeConfigured:
              Boolean(
                generatedCode
              ),
          })
        );

      } catch (error) {

        console.error(
          "Security PIN Error:",
          error
        );


        setPinError(
          error.response?.data?.message ||
            "Unable to configure Security PIN."
        );

      } finally {

        setPinLoading(false);
      }
    };


  // =====================================================
  // COPY RECOVERY CODE
  // =====================================================

  const handleCopyRecoveryCode =
    async () => {

      if (!recoveryCode) {
        return;
      }


      try {

        await navigator.clipboard.writeText(
          recoveryCode
        );

        setPinMessage(
          "Recovery code copied. Keep it somewhere safe."
        );

      } catch (error) {

        console.error(
          "Copy Recovery Code Error:",
          error
        );

        setPinError(
          "Unable to copy recovery code."
        );
      }
    };


  // =====================================================
  // LOADING
  // =====================================================

  if (profileLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }


  return (
    <div className="profile-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="profile-page-header">

        <div className="profile-title-icon">
          <FiUser />
        </div>

        <div>
          <h1>
            Owner Profile
          </h1>

          <p>
            Manage your account and
            security settings
          </p>
        </div>

      </div>


      {/* =================================================
          PROFILE INFORMATION
      ================================================= */}

      <section className="profile-section">

        <div className="profile-section-heading">

          <div>
            <h2>
              Profile Information
            </h2>

            <p>
              Update owner details
            </p>
          </div>

        </div>


        <form
          onSubmit={
            handleProfileSave
          }
        >

          <div className="profile-form-grid">

            <div className="profile-field">

              <label>
                Owner Name
              </label>

              <div className="profile-input-wrapper">

                <FiUser />

                <input
                  type="text"
                  name="name"
                  value={
                    profile.name
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Owner name"
                  required
                />

              </div>

            </div>


            <div className="profile-field">

              <label>
                Phone Number
              </label>

              <div className="profile-input-wrapper">

                <FiPhone />

                <input
                  type="tel"
                  name="phone"
                  value={
                    profile.phone
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="10-digit phone number"
                  maxLength={10}
                />

              </div>

            </div>


            <div className="profile-field profile-field-full">

              <label>
                Login Email
              </label>

              <div className="profile-input-wrapper profile-readonly">

                <FiMail />

                <input
                  type="email"
                  value={
                    profile.email
                  }
                  readOnly
                />

              </div>

              <small>
                Login email cannot be
                changed from profile.
              </small>

            </div>

          </div>


          {profileError && (
            <div className="profile-message error">
              {profileError}
            </div>
          )}


          {profileMessage && (
            <div className="profile-message success">
              {profileMessage}
            </div>
          )}


          <button
            type="submit"
            className="profile-primary-btn"
            disabled={
              profileSaving
            }
          >
            <FiSave />

            {profileSaving
              ? "Saving..."
              : "Save Profile"}
          </button>

        </form>

      </section>


      {/* =================================================
          CHANGE PASSWORD
      ================================================= */}

      <section className="profile-section">

        <div className="profile-section-heading">

          <div className="profile-section-icon">
            <FiLock />
          </div>

          <div>
            <h2>
              Change Password
            </h2>

            <p>
              Update your login password
            </p>
          </div>

        </div>


        <form
          onSubmit={
            handlePasswordSubmit
          }
        >

          <div className="profile-form-grid">


            {/* CURRENT PASSWORD */}

            <div className="profile-field profile-field-full">

              <label>
                Current Password
              </label>

              <div className="profile-input-wrapper">

                <FiLock />

                <input
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  name="currentPassword"
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={
                    handlePasswordChange
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="profile-eye-btn"
                  onClick={() =>
                    setShowCurrentPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showCurrentPassword
                    ? <FiEyeOff />
                    : <FiEye />}
                </button>

              </div>

            </div>


            {/* NEW PASSWORD */}

            <div className="profile-field">

              <label>
                New Password
              </label>

              <div className="profile-input-wrapper">

                <FiLock />

                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  name="newPassword"
                  value={
                    passwordForm.newPassword
                  }
                  onChange={
                    handlePasswordChange
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="profile-eye-btn"
                  onClick={() =>
                    setShowNewPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showNewPassword
                    ? <FiEyeOff />
                    : <FiEye />}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="profile-field">

              <label>
                Confirm New Password
              </label>

              <div className="profile-input-wrapper">

                <FiLock />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={
                    handlePasswordChange
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="profile-eye-btn"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showConfirmPassword
                    ? <FiEyeOff />
                    : <FiEye />}
                </button>

              </div>

            </div>

          </div>


          {passwordError && (
            <div className="profile-message error">
              {passwordError}
            </div>
          )}


          {passwordMessage && (
            <div className="profile-message success">
              {passwordMessage}
            </div>
          )}


          <button
            type="submit"
            className="profile-primary-btn"
            disabled={
              passwordLoading
            }
          >
            <FiLock />

            {passwordLoading
              ? "Changing..."
              : "Change Password"}
          </button>

        </form>

      </section>


      {/* =================================================
          SECURITY & RECOVERY
      ================================================= */}

      <section className="profile-section">

        <div className="profile-section-heading">

          <div className="profile-section-icon">
            <FiShield />
          </div>

          <div>
            <h2>
              Security & Recovery
            </h2>

            <p>
              Configure password recovery
            </p>
          </div>

        </div>


        <div className="security-status">

          <div>
            <span>
              Security PIN
            </span>

            <strong>
              {profile.securityPinConfigured
                ? "Configured"
                : "Not Configured"}
            </strong>
          </div>


          <div>
            <span>
              Recovery Code
            </span>

            <strong>
              {profile.recoveryCodeConfigured
                ? "Configured"
                : "Not Configured"}
            </strong>
          </div>

        </div>


        <form
          onSubmit={
            handlePinSubmit
          }
        >

          <div className="profile-form-grid">


            <div className="profile-field profile-field-full">

              <label>
                Current Login Password
              </label>

              <div className="profile-input-wrapper">

                <FiLock />

                <input
                  type="password"
                  name="currentPassword"
                  value={
                    pinForm.currentPassword
                  }
                  onChange={
                    handlePinChange
                  }
                  autoComplete="current-password"
                  required
                />

              </div>

            </div>


            <div className="profile-field">

              <label>
                Security PIN
              </label>

              <div className="profile-input-wrapper">

                <FiKey />

                <input
                  type="password"
                  inputMode="numeric"
                  name="securityPin"
                  value={
                    pinForm.securityPin
                  }
                  onChange={
                    handlePinChange
                  }
                  placeholder="6-digit PIN"
                  maxLength={6}
                  required
                />

              </div>

            </div>


            <div className="profile-field">

              <label>
                Confirm Security PIN
              </label>

              <div className="profile-input-wrapper">

                <FiKey />

                <input
                  type="password"
                  inputMode="numeric"
                  name="confirmSecurityPin"
                  value={
                    pinForm.confirmSecurityPin
                  }
                  onChange={
                    handlePinChange
                  }
                  placeholder="Re-enter PIN"
                  maxLength={6}
                  required
                />

              </div>

            </div>

          </div>


          {pinError && (
            <div className="profile-message error">
              {pinError}
            </div>
          )}


          {pinMessage && (
            <div className="profile-message success">
              {pinMessage}
            </div>
          )}


          {/* RECOVERY CODE ONLY SHOWN
              IMMEDIATELY AFTER GENERATION */}

          {recoveryCode && (

            <div className="recovery-code-box">

              <div>

                <span>
                  Your Recovery Code
                </span>

                <strong>
                  {recoveryCode}
                </strong>

              </div>


              <button
                type="button"
                onClick={
                  handleCopyRecoveryCode
                }
              >
                <FiCopy />
                Copy
              </button>


              <p>
                Save this code somewhere
                safe. It will not be shown
                again after leaving this
                page.
              </p>

            </div>

          )}


          <button
            type="submit"
            className="profile-primary-btn"
            disabled={
              pinLoading
            }
          >
            <FiShield />

            {pinLoading
              ? "Saving..."
              : profile.securityPinConfigured
              ? "Change Security PIN"
              : "Set Security PIN"}
          </button>

        </form>

      </section>


      <div className="page-powered-by">
        Powered by{" "}
        <span>
          Flyit Systems
        </span>
      </div>

    </div>
  );
};


export default Profile;