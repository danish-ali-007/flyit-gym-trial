import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import "./DashboardLayout.css";


/* =====================================================
   SCROLL MEMORY

   - Dashboard / Members / Plans / Payments / Reports
     ka scroll separately remember hoga.

   - Query params bhi route ka part rahenge.

   - Same page ke andar filter / payment / data refresh
     se layout height change hui to previous scroll
     position maintain hogi.

   - F5 / browser refresh par memory reset hogi.
===================================================== */

const scrollMemory = new Map();


const getRouteKey = (location) => {
  return `${location.pathname}${location.search}`;
};


const getCurrentBrowserRouteKey = () => {
  return `${window.location.pathname}${window.location.search}`;
};


const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const location = useLocation();

  const contentRef = useRef(null);

  const activeRouteRef = useRef(
    getRouteKey(location)
  );

  const restoringScrollRef =
    useRef(false);

  const userScrollingRef =
    useRef(false);

  const userScrollTimerRef =
    useRef(null);

  const restoreTimerRef =
    useRef(null);

  const stabilizationTimerRef =
    useRef(null);

  const resizeRestoreTimerRef =
    useRef(null);

  const dashboardMinHeightTimerRef =
    useRef(null);


  const openSidebar = () => {
    setSidebarOpen(true);
  };


  const closeSidebar = () => {
    setSidebarOpen(false);
  };


  /* =====================================================
     USER SCROLL DETECTION

     Important:
     Browser/layout ke automatic scroll shift aur
     actual user scroll ko alag rakhne ke liye.
  ===================================================== */

  useEffect(() => {
    const markUserScrolling = () => {
      userScrollingRef.current = true;


      if (userScrollTimerRef.current) {
        clearTimeout(
          userScrollTimerRef.current
        );
      }


      userScrollTimerRef.current =
        window.setTimeout(() => {
          userScrollingRef.current =
            false;
        }, 300);
    };


    const handleKeyDown = (event) => {
      const scrollKeys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ];


      if (
        scrollKeys.includes(event.key)
      ) {
        markUserScrolling();
      }
    };


    window.addEventListener(
      "wheel",
      markUserScrolling,
      {
        passive: true,
      }
    );


    window.addEventListener(
      "touchstart",
      markUserScrolling,
      {
        passive: true,
      }
    );


    window.addEventListener(
      "touchmove",
      markUserScrolling,
      {
        passive: true,
      }
    );


    window.addEventListener(
      "pointerdown",
      markUserScrolling,
      {
        passive: true,
      }
    );


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      window.removeEventListener(
        "wheel",
        markUserScrolling
      );

      window.removeEventListener(
        "touchstart",
        markUserScrolling
      );

      window.removeEventListener(
        "touchmove",
        markUserScrolling
      );

      window.removeEventListener(
        "pointerdown",
        markUserScrolling
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );


      if (
        userScrollTimerRef.current
      ) {
        clearTimeout(
          userScrollTimerRef.current
        );
      }
    };

  }, []);


  /* =====================================================
     SAVE ACTUAL USER SCROLL
  ===================================================== */

  useEffect(() => {
    const handleScroll = () => {
      if (
        restoringScrollRef.current
      ) {
        return;
      }


      const browserRoute =
        getCurrentBrowserRouteKey();


      if (
        browserRoute !==
        activeRouteRef.current
      ) {
        return;
      }


      /*
        Layout/data change ki wajah se browser
        khud position change kare to saved scroll
        overwrite nahi karenge.

        Sirf actual user scrolling save hogi.
      */

      if (
        !userScrollingRef.current
      ) {
        return;
      }


      scrollMemory.set(
        activeRouteRef.current,
        window.scrollY
      );


      /*
        Momentum scrolling ke liye timer
        extend karte rahenge.
      */

      if (
        userScrollTimerRef.current
      ) {
        clearTimeout(
          userScrollTimerRef.current
        );
      }


      userScrollTimerRef.current =
        window.setTimeout(() => {
          userScrollingRef.current =
            false;
        }, 300);
    };


    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );


    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };

  }, []);


  /* =====================================================
     RESTORE WHEN ROUTE CHANGES
  ===================================================== */

  useLayoutEffect(() => {
    const routeKey =
      getRouteKey(location);


    activeRouteRef.current =
      routeKey;


    const savedScroll =
      scrollMemory.get(routeKey);


    restoringScrollRef.current =
      true;


    /* ==================================================
       DASHBOARD ONLY
    ================================================== */

    if (
      location.pathname === "/dashboard" &&
      typeof savedScroll === "number"
    ) {
      const contentElement =
        contentRef.current;

      if (contentElement) {
        const previousMinHeight =
          contentElement.style.minHeight;

        const requiredHeight =
          savedScroll + window.innerHeight;

        const currentHeight =
          contentElement.getBoundingClientRect().height;

        if (currentHeight < requiredHeight) {
          contentElement.style.minHeight =
            `${requiredHeight}px`;
        }

        window.scrollTo({
          top: savedScroll,
          left: 0,
          behavior: "auto",
        });

        requestAnimationFrame(() => {
          window.scrollTo({
            top: savedScroll,
            left: 0,
            behavior: "auto",
          });

          requestAnimationFrame(() => {
            restoringScrollRef.current =
              false;
          });
        });

        if (
          dashboardMinHeightTimerRef.current
        ) {
          clearTimeout(
            dashboardMinHeightTimerRef.current
          );
        }

        dashboardMinHeightTimerRef.current =
          window.setTimeout(() => {
            const beforeRemoving =
              window.scrollY;

            contentElement.style.minHeight =
              previousMinHeight;

            requestAnimationFrame(() => {
              const documentHeight =
                Math.max(
                  document.body.scrollHeight,
                  document.documentElement
                    .scrollHeight
                );

              const maxPossibleScroll =
                Math.max(
                  0,
                  documentHeight -
                    window.innerHeight
                );

              window.scrollTo({
                top: Math.min(
                  beforeRemoving,
                  maxPossibleScroll
                ),
                left: 0,
                behavior: "auto",
              });
            });

            dashboardMinHeightTimerRef.current =
              null;
          }, 900);
      }

      return () => {
        if (
          dashboardMinHeightTimerRef.current
        ) {
          clearTimeout(
            dashboardMinHeightTimerRef.current
          );

          dashboardMinHeightTimerRef.current =
            null;
        }
      };
    }


    /* ==================================================
       FIRST VISIT
    ================================================== */

    if (
      typeof savedScroll !== "number"
    ) {
      window.scrollTo(
        0,
        0
      );


      scrollMemory.set(
        routeKey,
        0
      );


      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoringScrollRef.current =
            false;
        });
      });


      return;
    }


    /* ==================================================
       WAIT UNTIL PAGE HAS ENOUGH HEIGHT
    ================================================== */

    let attempts = 0;

    const maxAttempts = 80;


    const restoreWhenReady = () => {
      attempts += 1;


      const documentHeight =
        Math.max(
          document.body.scrollHeight,
          document.documentElement
            .scrollHeight
        );


      const maxPossibleScroll =
        Math.max(
          0,
          documentHeight -
            window.innerHeight
        );


      if (
        maxPossibleScroll >=
        savedScroll
      ) {
        window.scrollTo({
          top: savedScroll,
          left: 0,
          behavior: "auto",
        });


        /* =============================================
           SHORT STABILIZATION

           Async table/cards/chart loading ke time
           position ko kuch baar enforce karenge.
        ============================================= */

        let stabilizationCount = 0;

        const maxStabilizationCount = 10;


        const stabilize = () => {
          stabilizationCount += 1;


          window.scrollTo({
            top: savedScroll,
            left: 0,
            behavior: "auto",
          });


          if (
            stabilizationCount <
            maxStabilizationCount
          ) {
            stabilizationTimerRef.current =
              window.setTimeout(
                stabilize,
                80
              );

            return;
          }


          restoringScrollRef.current =
            false;
        };


        stabilizationTimerRef.current =
          window.setTimeout(
            stabilize,
            80
          );


        return;
      }


      if (
        attempts <
        maxAttempts
      ) {
        restoreTimerRef.current =
          window.setTimeout(
            restoreWhenReady,
            50
          );

        return;
      }


      window.scrollTo({
        top: Math.min(
          savedScroll,
          maxPossibleScroll
        ),
        left: 0,
        behavior: "auto",
      });


      restoringScrollRef.current =
        false;
    };


    restoreWhenReady();


    return () => {
      if (
        restoreTimerRef.current
      ) {
        clearTimeout(
          restoreTimerRef.current
        );

        restoreTimerRef.current =
          null;
      }


      if (
        stabilizationTimerRef.current
      ) {
        clearTimeout(
          stabilizationTimerRef.current
        );

        stabilizationTimerRef.current =
          null;
      }
    };

  }, [
    location.pathname,
    location.search,
  ]);


  /* =====================================================
     SAME PAGE DATA / LAYOUT CHANGE

     Members filter result
     Payment record
     Plans update
     Reports data/filter

     se content height badli to saved scroll
     dobara maintain hoga.
  ===================================================== */

  useEffect(() => {
    const contentElement =
      contentRef.current;


    if (
      !contentElement ||
      typeof ResizeObserver ===
        "undefined"
    ) {
      return;
    }


    const restoreSavedPosition = () => {
      const routeKey =
        activeRouteRef.current;


      const savedScroll =
        scrollMemory.get(routeKey);


      if (
        typeof savedScroll !== "number"
      ) {
        return;
      }


      if (
        restoringScrollRef.current
      ) {
        return;
      }


      if (
        userScrollingRef.current
      ) {
        return;
      }


      const documentHeight =
        Math.max(
          document.body.scrollHeight,
          document.documentElement
            .scrollHeight
        );


      const maxPossibleScroll =
        Math.max(
          0,
          documentHeight -
            window.innerHeight
        );


      const targetScroll =
        Math.min(
          savedScroll,
          maxPossibleScroll
        );


      /*
        Tiny 1-2px browser rounding ke liye
        unnecessary scroll nahi karenge.
      */

      if (
        Math.abs(
          window.scrollY -
            targetScroll
        ) <= 2
      ) {
        return;
      }


      restoringScrollRef.current =
        true;


      window.scrollTo({
        top: targetScroll,
        left: 0,
        behavior: "auto",
      });


      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoringScrollRef.current =
            false;
        });
      });
    };


    const observer =
      new ResizeObserver(() => {

        /*
          Button/filter click ke immediately
          baad pointer/touch user interaction
          active ho sakta hai.

          Thoda delay karke final layout par
          position restore karenge.
        */

        if (
          resizeRestoreTimerRef.current
        ) {
          clearTimeout(
            resizeRestoreTimerRef.current
          );
        }


        resizeRestoreTimerRef.current =
          window.setTimeout(() => {
            restoreSavedPosition();
          }, 350);

      });


    observer.observe(
      contentElement
    );


    return () => {
      observer.disconnect();


      if (
        resizeRestoreTimerRef.current
      ) {
        clearTimeout(
          resizeRestoreTimerRef.current
        );

        resizeRestoreTimerRef.current =
          null;
      }
    };

  }, []);


  return (
    <div className="dashboard-layout">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />


      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}


      <div className="dashboard-main">

        <Header
          onMenuClick={openSidebar}
        />


        <main
          ref={contentRef}
          className="dashboard-content"
        >
          <Outlet />
        </main>

      </div>

    </div>
  );
};


export default DashboardLayout;