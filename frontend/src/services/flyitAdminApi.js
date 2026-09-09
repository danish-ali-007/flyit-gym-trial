import axios from "axios";


// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// FLYIT ADMIN AXIOS INSTANCE
// =====================================================

const flyitAdminApi =
  axios.create({
    baseURL:
      `${API_BASE_URL}/flyit-admin`,
  });


// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

flyitAdminApi.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem(
        "flyitAdminToken"
      );


    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;
    }


    return config;
  },

  (error) => {
    return Promise.reject(
      error
    );
  }
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

flyitAdminApi.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {

    const status =
      error.response?.status;


    const requestUrl =
      error.config?.url ||
      "";


    // Login public hai.
    // Wrong credentials par 401 aaye to
    // redirect loop nahi karna.
    const isLoginRequest =
      requestUrl.includes(
        "/login"
      );


    if (
      status === 401 &&
      !isLoginRequest
    ) {

      localStorage.removeItem(
        "flyitAdminToken"
      );


      localStorage.removeItem(
        "flyitAdmin"
      );


      if (
        !window.location.pathname
          .startsWith(
            "/flyit-admin"
          ) ||
        window.location.pathname ===
          "/flyit-admin/dashboard"
      ) {

        window.location.replace(
          "/flyit-admin"
        );
      }
    }


    return Promise.reject(
      error
    );
  }
);


export default flyitAdminApi;