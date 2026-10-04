import React, { useEffect } from "react";
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
import MacroLog from "./features/macros/MacroLog";
import WorkoutList from "./features/workouts/WorkoutList";

export default function App() {
  const dispatch = useDispatch();
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
    return (
      <>
        <p>
          Signed in as <strong>{user.username}</strong>{" "}
          <button onClick={() => dispatch(logout())}>Log out</button>
        </p>
        <WorkoutList />
        <hr style={{ margin: "32px 0" }} />
        <MacroLog />
      </>
    );
  }
}
