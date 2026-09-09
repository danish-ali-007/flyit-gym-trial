const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const activateUpcomingRenewals =
  require("./utils/activateUpcomingRenewals");


// =====================================================
// ROUTES
// =====================================================

const adminRoutes =
  require("./routes/adminRoutes");

const memberRoutes =
  require("./routes/memberRoutes");

const paymentRoutes =
  require("./routes/paymentRoutes");

const dashboardRoutes =
  require("./routes/dashboardRoutes");

const importRoutes =
  require("./routes/importRoutes");

const reportRoutes =
  require("./routes/reportRoutes");

const flyitAdminRoutes =
  require("./routes/flyitAdminRoutes");

const trialRoutes =
  require("./routes/trialRoutes");


dotenv.config();

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// =====================================================
// DEFAULT ADMIN CREATE
// =====================================================

const createDefaultAdmin = async () => {
  try {

    const adminEmail =
      process.env.DEFAULT_ADMIN_EMAIL;

    const adminPassword =
      process.env.DEFAULT_ADMIN_PASSWORD;

    const adminName =
      process.env.DEFAULT_ADMIN_NAME;


    if (
      !adminEmail ||
      !adminPassword ||
      !adminName
    ) {

      console.log(
        "Default admin env variables missing"
      );

      return;
    }


    const existingAdmin =
      await Admin.findOne({
        email:
          adminEmail
            .toLowerCase()
            .trim(),
      });


    if (existingAdmin) {

      console.log(
        "Default Admin already exists"
      );

      return;
    }


    await Admin.create({
      name:
        adminName,

      email:
        adminEmail
          .toLowerCase()
          .trim(),

      password:
        adminPassword,
    });


    console.log(
      "Default Admin created successfully"
    );

  } catch (error) {

    console.error(
      "Error in default admin setup:",
      error.message
    );
  }
};


// =====================================================
// ROOT ROUTE
// =====================================================

app.get(
  "/",
  (req, res) => {

    return res.status(200).json({
      success: true,

      message:
        "Gym Management API Running",
    });
  }
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (req, res) => {

    return res.status(200).json({
      success: true,

      message:
        "Gym Backend is running",

      timestamp:
        new Date().toISOString(),
    });
  }
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/admin",
  adminRoutes
);


app.use(
  "/api/members",
  memberRoutes
);


app.use(
  "/api/payments",
  paymentRoutes
);


app.use(
  "/api/dashboard",
  dashboardRoutes
);


app.use(
  "/api/import",
  importRoutes
);


app.use(
  "/api/reports",
  reportRoutes
);


// =====================================================
// FLYIT ADMIN ROUTES
// =====================================================

app.use(
  "/api/flyit-admin",
  flyitAdminRoutes
);


// =====================================================
// PASSWORDLESS TRIAL ROUTES
// =====================================================

app.use(
  "/api/trial",
  trialRoutes
);


// =====================================================
// 404 ROUTE
// =====================================================

app.use(
  (req, res) => {

    return res.status(404).json({
      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "Server Error:",
      error
    );


    if (
      error.name ===
      "MulterError"
    ) {

      return res.status(400).json({
        success: false,

        message:
          error.message,
      });
    }


    return res.status(
      error.status || 500
    ).json({
      success: false,

      message:
        error.message ||
        "Internal server error",
    });
  }
);


// =====================================================
// PORT
// =====================================================

const PORT =
  process.env.PORT || 5000;


// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
  try {

    await connectDB();

    await createDefaultAdmin();


    // ================================================
    // ACTIVATE DUE UPCOMING RENEWALS ON SERVER START
    // ================================================

    await activateUpcomingRenewals();


    // ================================================
    // CHECK UPCOMING RENEWALS EVERY 1 HOUR
    // ================================================

    setInterval(
      async () => {

        await activateUpcomingRenewals();

      },
      60 * 60 * 1000
    );


    app.listen(
      PORT,
      () => {

        console.log(
          `Server running on port ${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};


startServer();