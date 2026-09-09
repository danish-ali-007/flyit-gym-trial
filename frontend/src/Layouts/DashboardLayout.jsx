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


// =====================================================
// SIMPLE SCROLL MEMORY
// =====================================================

const scrollMemory =
  new Map();


const getRouteKey =
  (location) => {

    return `${location.pathname}${location.search}`;
  };


// =====================================================
// COMPONENT
// =====================================================

const DashboardLayout =
  () => {

    const [
      sidebarOpen,
      setSidebarOpen,
    ] = useState(false);


    const location =
      useLocation();


    const currentRouteRef =
      useRef(
        getRouteKey(
          location
        )
      );


    const scrollFrameRef =
      useRef(null);


    // =====================================================
    // SIDEBAR
    // =====================================================

    const openSidebar =
      () => {

        setSidebarOpen(
          true
        );
      };


    const closeSidebar =
      () => {

        setSidebarOpen(
          false
        );
      };


    // =====================================================
    // SAVE SCROLL
    //
    // Sirf actual scroll event par save.
    // touchstart / pointerdown tracking nahi.
    // =====================================================

    useEffect(() => {

      let ticking =
        false;


      const handleScroll =
        () => {

          if (ticking) {
            return;
          }


          ticking =
            true;


          scrollFrameRef.current =
            requestAnimationFrame(
              () => {

                scrollMemory.set(
                  currentRouteRef.current,
                  window.scrollY
                );


                ticking =
                  false;
              }
            );
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


        if (
          scrollFrameRef.current
        ) {

          cancelAnimationFrame(
            scrollFrameRef.current
          );
        }
      };

    }, []);


    // =====================================================
    // ROUTE CHANGE
    //
    // Lightweight restore:
    // no 80 retries
    // no stabilization loop
    // no ResizeObserver
    // =====================================================

    useLayoutEffect(() => {

      const routeKey =
        getRouteKey(
          location
        );


      currentRouteRef.current =
        routeKey;


      const savedScroll =
        scrollMemory.get(
          routeKey
        );


      // =================================================
      // FIRST VISIT
      // =================================================

      if (
        typeof savedScroll !==
        "number"
      ) {

        scrollMemory.set(
          routeKey,
          0
        );


        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });


        return;
      }


      // =================================================
      // RESTORE SAVED POSITION
      // =================================================

      let frame1;
      let frame2;
      let timer;


      frame1 =
        requestAnimationFrame(
          () => {

            frame2 =
              requestAnimationFrame(
                () => {

                  const maxScroll =
                    Math.max(
                      0,

                      document.documentElement
                        .scrollHeight -
                        window.innerHeight
                    );


                  window.scrollTo({
                    top:
                      Math.min(
                        savedScroll,
                        maxScroll
                      ),

                    left: 0,

                    behavior:
                      "auto",
                  });


                  // =========================================
                  // ONE lightweight retry
                  //
                  // Async page content thoda late render hua
                  // to sirf ek baar position correct karenge.
                  // =========================================

                  timer =
                    window.setTimeout(
                      () => {

                        const updatedMaxScroll =
                          Math.max(
                            0,

                            document.documentElement
                              .scrollHeight -
                              window.innerHeight
                          );


                        const target =
                          Math.min(
                            savedScroll,
                            updatedMaxScroll
                          );


                        if (
                          Math.abs(
                            window.scrollY -
                              target
                          ) >
                          4
                        ) {

                          window.scrollTo({
                            top:
                              target,

                            left:
                              0,

                            behavior:
                              "auto",
                          });
                        }

                      },
                      120
                    );
                }
              );
          }
        );


      return () => {

        if (frame1) {
          cancelAnimationFrame(
            frame1
          );
        }


        if (frame2) {
          cancelAnimationFrame(
            frame2
          );
        }


        if (timer) {
          clearTimeout(
            timer
          );
        }
      };

    }, [
      location.pathname,
      location.search,
    ]);


    // =====================================================
    // UI
    // =====================================================

    return (
      <div className="dashboard-layout">

        <Sidebar
          isOpen={
            sidebarOpen
          }
          onClose={
            closeSidebar
          }
        />


        {sidebarOpen && (

          <div
            className="sidebar-overlay"
            onClick={
              closeSidebar
            }
          />

        )}


        <div className="dashboard-main">

          <Header
            onMenuClick={
              openSidebar
            }
          />


          <main className="dashboard-content">

            <Outlet />

          </main>

        </div>

      </div>
    );
  };


export default DashboardLayout;