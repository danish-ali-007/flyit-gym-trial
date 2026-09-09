import axios from "axios";


// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
  baseURL: API_BASE_URL,
});


// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");


    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }


    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {

    const status =
      error.response?.status;


    const requestUrl =
      error.config?.url || "";


    // =================================================
    // CHANGE PASSWORD
    // Wrong current password bhi 401 return karta hai.
    // Is case me logout nahi karna.
    // =================================================

    const isChangePasswordRequest =
      requestUrl.includes(
        "/admin/change-password"
      );


    // =================================================
    // FORGOT PASSWORD PUBLIC ROUTES
    // Wrong PIN / recovery code me 401 aa sakta hai.
    // Isme logout nahi karna.
    // =================================================

    const isForgotPasswordRequest =
      requestUrl.includes(
        "/admin/security/verify-pin"
      ) ||
      requestUrl.includes(
        "/admin/security/verify-recovery"
      ) ||
      requestUrl.includes(
        "/admin/reset-password"
      );


    // =================================================
    // TRIAL ACCESS
    // Trial access public endpoint hai.
    // Invalid/expired trial par normal login redirect
    // yahan se force nahi karenge.
    // TrialAccess.jsx khud message handle karega.
    // =================================================

    const isTrialAccessRequest =
      requestUrl.includes(
        "/trial/access"
      );


    const shouldLogout =
      status === 401 &&
      !isChangePasswordRequest &&
      !isForgotPasswordRequest &&
      !isTrialAccessRequest;


    if (shouldLogout) {

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


      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.replace(
          "/login"
        );
      }
    }


    return Promise.reject(error);
  }
);


export default api;