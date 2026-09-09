import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";


export default function TrialAccess() {
  const {
    trialToken,
  } = useParams();

  const navigate =
    useNavigate();


  const [
    message,
    setMessage,
  ] = useState(
    "Verifying trial access..."
  );


  useEffect(() => {
    const accessTrial =
      async () => {
        try {
          const response =
            await api.post(
              "/trial/access",
              {
                trialToken,
              }
            );


          const {
            token,
            gym,
          } =
            response.data.data;


          // =========================
          // SAVE TRIAL SESSION
          // =========================

          localStorage.setItem(
            "token",
            token
          );


          localStorage.setItem(
            "trialGym",
            JSON.stringify(
              gym
            )
          );


          localStorage.setItem(
            "isTrial",
            "true"
          );


          // Normal admin ka stale data
          // trial me nahi chahiye
          localStorage.removeItem(
            "admin"
          );


          // =========================
          // OPEN DASHBOARD
          // =========================

          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );

        } catch (error) {

          const data =
            error.response?.data;


          // Failed/expired trial par
          // stale session remove
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "trialGym"
          );

          localStorage.removeItem(
            "isTrial"
          );


          if (
            data?.trialExpired
          ) {
            setMessage(
              "Your trial has expired. Please contact Flyit Systems to continue."
            );

            return;
          }


          if (
            data?.trialDisabled
          ) {
            setMessage(
              "This trial has been disabled. Please contact Flyit Systems."
            );

            return;
          }


          setMessage(
            data?.message ||
              "Invalid or unavailable trial link."
          );
        }
      };


    if (trialToken) {
      accessTrial();
    } else {
      setMessage(
        "Invalid trial link."
      );
    }

  }, [
    trialToken,
    navigate,
  ]);


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">

        <div className="mb-5">

          <h1 className="text-2xl font-bold text-white">
            Flyit Systems
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Gym Management Trial
          </p>

        </div>


        <div className="rounded-xl bg-white/5 px-4 py-5">

          <p className="text-sm leading-6 text-slate-200">
            {message}
          </p>

        </div>

      </div>

    </div>
  );
}