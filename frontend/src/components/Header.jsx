import {
  FiLogOut,
  FiUser,
} from "react-icons/fi";

import {
  useNavigate,
} from "react-router-dom";

import "./Header.css";


const Header = () => {

  const navigate =
    useNavigate();


  // =========================
  // NORMAL ADMIN
  // =========================

  const admin = JSON.parse(
    localStorage.getItem("admin") ||
      "{}"
  );


  // =========================
  // TRIAL DATA
  // =========================

  const isTrial =
    localStorage.getItem("isTrial") ===
    "true";


  const trialGym = JSON.parse(
    localStorage.getItem("trialGym") ||
      "{}"
  );


  // =========================
  // DISPLAY VALUES
  // =========================

  const gymName =
    isTrial
      ? trialGym.gymName ||
        "Trial Gym"
      : "Olympics Gym";


  const displayName =
    isTrial
      ? trialGym.ownerName ||
        "Gym Owner"
      : admin.name ||
        "Admin";


  const roleText =
    isTrial
      ? "Trial Access"
      : "Owner / Administrator";


  // =========================
  // OPEN PROFILE
  // =========================

  const handleProfileClick = () => {

    // Trial users ka normal
    // admin profile nahi hota.
    if (isTrial) {
      return;
    }

    navigate("/profile");
  };


  // =========================
  // LOGOUT
  // NORMAL ADMIN ONLY
  // =========================

  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "admin"
    );

    localStorage.removeItem(
      "trialGym"
    );

    localStorage.removeItem(
      "isTrial"
    );


    window.location.replace(
      "/login"
    );
  };


  return (
    <header className="header">

      <div className="header-left">

        <div>

          <h2>
            {gymName}
          </h2>

          <p>
            Management Dashboard
          </p>

        </div>

      </div>


      <div className="header-right">


        {/* =========================
            PROFILE / TRIAL OWNER
        ========================= */}

        <button
          type="button"
          className="header-profile-button"
          onClick={
            handleProfileClick
          }
          title={
            isTrial
              ? "Trial Gym"
              : "Open Profile"
          }
          aria-label={
            isTrial
              ? "Trial gym owner"
              : "Open owner profile"
          }
          style={{
            cursor:
              isTrial
                ? "default"
                : "pointer",
          }}
        >

          <div className="admin-avatar">
            <FiUser />
          </div>


          <div className="admin-info">

            <span className="admin-name">
              {displayName}
            </span>

            <span className="admin-role">
              {roleText}
            </span>

          </div>

        </button>


        {/* =========================
            LOGOUT
            NORMAL ADMIN ONLY
        ========================= */}

        {!isTrial && (
          <button
            type="button"
            className="logout-btn"
            onClick={
              handleLogout
            }
          >
            <FiLogOut />

            <span>
              Logout
            </span>

          </button>
        )}

      </div>

    </header>
  );
};


export default Header;