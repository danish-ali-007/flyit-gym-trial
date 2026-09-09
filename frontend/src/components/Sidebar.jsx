import { NavLink } from "react-router-dom";

import {
  FiHome,
  FiUsers,
  FiCreditCard,
  FiBarChart2,
  FiLayers,
  FiUser,
} from "react-icons/fi";

import "./Sidebar.css";


const Sidebar = () => {

  // =========================
  // TRIAL MODE
  // =========================

  const isTrial =
    localStorage.getItem("isTrial") ===
    "true";


  const trialGym = JSON.parse(
    localStorage.getItem("trialGym") ||
      "{}"
  );


  // Trial me actual client gym name.
  // Normal system me existing Olympics Gym.
  const gymName =
    isTrial
      ? trialGym.gymName ||
        "Trial Gym"
      : "Olympics Gym";


  // Logo initials
  const getGymInitials = (
    name
  ) => {
    if (!name) {
      return "GY";
    }

    const words =
      String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {
      return words[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  };


  const gymInitials =
    getGymInitials(
      gymName
    );


  return (
    <>

      {/* =========================
          DESKTOP SIDEBAR
      ========================= */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-mark">
            {gymInitials}
          </div>


          <div className="logo-text">

            <h2>
              {gymName}
            </h2>

            <p>
              Management System
            </p>

          </div>

        </div>


        <nav className="sidebar-menu">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <FiHome className="sidebar-icon" />

            <span>
              Dashboard
            </span>
          </NavLink>


          <NavLink
            to="/members"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <FiUsers className="sidebar-icon" />

            <span>
              Members
            </span>
          </NavLink>


          <NavLink
            to="/plans"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <FiLayers className="sidebar-icon" />

            <span>
              Plans
            </span>
          </NavLink>


          <NavLink
            to="/payments"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <FiCreditCard className="sidebar-icon" />

            <span>
              Payments
            </span>
          </NavLink>


          <NavLink
            to="/reports"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <FiBarChart2 className="sidebar-icon" />

            <span>
              Reports
            </span>
          </NavLink>

        </nav>


        {/* =========================
            SIDEBAR BOTTOM
        ========================= */}

        <div className="sidebar-bottom">

          {/* Normal admin only */}
          {!isTrial && (
            <NavLink
              to="/profile"
              className={({
                isActive,
              }) =>
                isActive
                  ? "sidebar-link sidebar-profile-link active"
                  : "sidebar-link sidebar-profile-link"
              }
            >
              <FiUser className="sidebar-icon" />

              <span>
                Profile
              </span>
            </NavLink>
          )}


          <div className="sidebar-footer">

            <p>
              Powered by
            </p>

            <span>
              Flyit Systems
            </span>

          </div>

        </div>

      </aside>


      {/* =========================
          MOBILE BOTTOM NAV
      ========================= */}

      <nav className="mobile-bottom-nav">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? "mobile-nav-item active"
              : "mobile-nav-item"
          }
        >
          <FiHome />

          <span>
            Home
          </span>
        </NavLink>


        <NavLink
          to="/members"
          className={({ isActive }) =>
            isActive
              ? "mobile-nav-item active"
              : "mobile-nav-item"
          }
        >
          <FiUsers />

          <span>
            Members
          </span>
        </NavLink>


        <NavLink
          to="/plans"
          className={({ isActive }) =>
            isActive
              ? "mobile-nav-item active"
              : "mobile-nav-item"
          }
        >
          <FiLayers />

          <span>
            Plans
          </span>
        </NavLink>


        <NavLink
          to="/payments"
          className={({ isActive }) =>
            isActive
              ? "mobile-nav-item active"
              : "mobile-nav-item"
          }
        >
          <FiCreditCard />

          <span>
            Payments
          </span>
        </NavLink>


        <NavLink
          to="/reports"
          className={({ isActive }) =>
            isActive
              ? "mobile-nav-item active"
              : "mobile-nav-item"
          }
        >
          <FiBarChart2 />

          <span>
            Reports
          </span>
        </NavLink>

      </nav>

    </>
  );
};


export default Sidebar;