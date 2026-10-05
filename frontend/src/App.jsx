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

// One <nav> for every screen size. On a phone it is fixed to the bottom of
// the screen, within reach of a thumb; from the "sm" breakpoint up it sits
// under the header like ordinary tabs.
// (The header must not use backdrop-blur or a transform: those make a parent
// the reference box for "fixed" children, which would pin this bar to the
// header instead of the screen.)
function TabBar({ activeTab, onSelect }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)] sm:static sm:border-b sm:border-t-0 sm:pb-0">
      <div className="mx-auto flex max-w-3xl sm:gap-1 sm:px-4">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex-1 border-t-2 px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:bg-slate-800 sm:flex-none sm:border-b-2 sm:border-t-0 ${
                isActive
                  ? "border-lapis-400 text-lapis-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

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
    // pb-24 leaves room for the fixed bottom tab bar on phones.
    <div className="min-h-screen pb-24 sm:pb-10">
      <header className="sticky top-0 z-10 bg-slate-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between border-b border-slate-800 px-4 py-3 sm:border-b-0">
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="text-lapis-400">Lapis</span>Tracker
          </h1>
          {user && (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <span>
                <span className="hidden sm:inline">Signed in as </span>
                <strong className="font-medium text-slate-200">{user.username}</strong>
              </span>
              <button className="btn-ghost" onClick={() => dispatch(logout())}>
                Log out
              </button>
            </p>
          )}
        </div>
        {user && <TabBar activeTab={activeTab} onSelect={setActiveTab} />}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">{renderContent()}</main>
    </div>
  );

  function renderContent() {
    if (!token) {
      return <AuthPage />;
    }
    if (!user) {
      return status === "failed" ? (
        <div className="card" role="alert">
          <p>Could not load your account: {error}</p>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={() => dispatch(fetchCurrentUser())}>
              Retry
            </button>
            <button className="btn-ghost" onClick={() => dispatch(logout())}>
              Log out
            </button>
          </div>
        </div>
      ) : (
        <p className="muted-text">Loading…</p>
      );
    }
    const ActiveTab = TABS.find((tab) => tab.id === activeTab).component;
    return (
      <Suspense fallback={<p className="muted-text">Loading…</p>}>
        <ActiveTab />
      </Suspense>
    );
  }
}
