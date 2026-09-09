import {
  lazy,
  Suspense,
} from "react";

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import TrialAccess from "./pages/TrialAccess";

import DashboardLayout from "./Layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";


// =========================
// FLYIT ADMIN
// =========================

import FlyitAdminLogin from "./pages/flyitAdmin/FlyitAdminLogin";
import FlyitAdminDashboard from "./pages/flyitAdmin/FlyitAdminDashboard";


// =========================
// MAIN SIDEBAR PAGES
// =========================

import Dashboard from "./pages/Dashboard";
import Members from "./pages/members";
import Plans from "./pages/Plans";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";


// =========================
// SECONDARY PAGES
// =========================

const AddMember = lazy(() =>
  import("./pages/AddMember")
);

const EditMember = lazy(() =>
  import("./pages/EditMember")
);

const MemberDetails = lazy(() =>
  import("./pages/MemberDetails")
);

const Profile = lazy(() =>
  import("./pages/Profile")
);


// =========================
// LOADER
// =========================

const AppLoader = () => {
  return (
    <div
      style={{
        padding: "30px",
        color: "#6b7280",
        fontSize: "14px",
      }}
    >
      Loading...
    </div>
  );
};


const App = () => {

  // =========================
  // NORMAL GYM / TRIAL TOKEN
  // =========================

  const token =
    localStorage.getItem(
      "token"
    );


  // =========================
  // FLYIT ADMIN TOKEN
  // =========================

  const flyitAdminToken =
    localStorage.getItem(
      "flyitAdminToken"
    );


  return (
    <Routes>


      {/* =========================
          ROOT
      ========================= */}

      <Route
        path="/"
        element={
          <Navigate
            to={
              token
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />


      {/* =========================
          NORMAL LOGIN
      ========================= */}

      <Route
        path="/login"
        element={
          token ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Login />
          )
        }
      />


      {/* =========================
          PASSWORDLESS TRIAL ACCESS
      ========================= */}

      <Route
        path="/trial/:trialToken"
        element={
          <TrialAccess />
        }
      />


      {/* =========================
          FLYIT ADMIN LOGIN
      ========================= */}

      <Route
        path="/flyit-admin"
        element={
          flyitAdminToken ? (
            <Navigate
              to="/flyit-admin/dashboard"
              replace
            />
          ) : (
            <FlyitAdminLogin />
          )
        }
      />


      {/* =========================
          FLYIT ADMIN DASHBOARD
      ========================= */}

      <Route
        path="/flyit-admin/dashboard"
        element={
          flyitAdminToken ? (
            <FlyitAdminDashboard />
          ) : (
            <Navigate
              to="/flyit-admin"
              replace
            />
          )
        }
      />


      {/* =========================
          NORMAL / TRIAL GYM
          PROTECTED ROUTES
      ========================= */}

      <Route
        element={
          <ProtectedRoute />
        }
      >

        <Route
          element={
            <DashboardLayout />
          }
        >

          {/* MAIN PAGES */}

          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/members"
            element={
              <Members />
            }
          />

          <Route
            path="/plans"
            element={
              <Plans />
            }
          />

          <Route
            path="/payments"
            element={
              <Payments />
            }
          />

          <Route
            path="/reports"
            element={
              <Reports />
            }
          />


          {/* PROFILE */}

          <Route
            path="/profile"
            element={
              <Suspense
                fallback={
                  <AppLoader />
                }
              >
                <Profile />
              </Suspense>
            }
          />


          {/* SECONDARY LAZY PAGES */}

          <Route
            path="/members/add"
            element={
              <Suspense
                fallback={
                  <AppLoader />
                }
              >
                <AddMember />
              </Suspense>
            }
          />


          <Route
            path="/members/edit/:id"
            element={
              <Suspense
                fallback={
                  <AppLoader />
                }
              >
                <EditMember />
              </Suspense>
            }
          />


          <Route
            path="/members/view/:id"
            element={
              <Suspense
                fallback={
                  <AppLoader />
                }
              >
                <MemberDetails />
              </Suspense>
            }
          />

        </Route>

      </Route>


      {/* =========================
          FALLBACK
      ========================= */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              token
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  );
};


export default App;