import React, { Suspense, lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AuthPage from "./features/auth/AuthPage";
import {
  fetchCurrentUser,
  logout,
  selectAuthError,
  selectAuthStatus,
  selectCurrentUser,
  selectToken,
} from "./features/auth/authSlice";
import ExerciseManager from "./features/exercises/ExerciseManager";
import MacroLog from "./features/macros/MacroLog";
import WorkoutList from "./features/workouts/WorkoutList";

// The chart library is by far the largest dependency, so the Progress page
// is split into its own JavaScript file that the browser only downloads
// when the tab is first opened.
const ProgressPage = lazy(() => import("./features/progress/ProgressPage"));

// The app is small enough that a piece of state is all the "routing" it
// needs. If deep links or the back button start to matter, swap this for
// react-router.
const TABS = [
  { id: "workouts", label: "Workouts", component: WorkoutList },
  { id: "exercises", label: "Exercises", component: ExerciseManager },
  { id: "macros", label: "Macros", component: MacroLog },
  { id: "progress", label: "Progress", component: ProgressPage },
];

export default function App() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("workouts");
  const token = useSelector(selectToken);
  const user = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  // A token saved from an earlier visit but no user yet: ask the API who
  // this token belongs to.
  const needsUser = Boolean(token) && !user;
  useEffect(() => {
    if (needsUser && status === "idle") {
      dispatch(fetchCurrentUser());
    }
  }, [needsUser, status, dispatch]);

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>LapisTracker</h1>
      {renderContent()}
    </div>
  );

  function renderContent() {
    if (!token) {
      return <AuthPage />;
    }
    if (!user) {
      return status === "failed" ? (
        <p role="alert">
          Could not load your account: {error}{" "}
          <button onClick={() => dispatch(fetchCurrentUser())}>Retry</button>{" "}
          <button onClick={() => dispatch(logout())}>Log out</button>
        </p>
      ) : (
        <p>Loading…</p>
      );
    }
    const ActiveTab = TABS.find((tab) => tab.id === activeTab).component;
    return (
      <>
        <p>
          Signed in as <strong>{user.username}</strong>{" "}
          <button onClick={() => dispatch(logout())}>Log out</button>
        </p>
        <nav style={{ marginBottom: 16 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={tab.id === activeTab ? "page" : undefined}
              style={{ marginRight: 8, fontWeight: tab.id === activeTab ? "bold" : "normal" }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <Suspense fallback={<p>Loading…</p>}>
          <ActiveTab />
        </Suspense>
      </>
    );
  }
}
