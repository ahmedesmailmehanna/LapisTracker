import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearAuthError,
  login,
  register,
  selectAuthError,
  selectAuthStatus,
} from "./authSlice";

// One component for both screens: the forms only differ by the email field
// and by which thunk is dispatched.
export default function AuthPage() {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const [mode, setMode] = useState("login"); // login | register
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isRegister = mode === "register";

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    dispatch(clearAuthError());
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (isRegister) {
      dispatch(register({ username, email, password }));
    } else {
      dispatch(login({ username, password }));
    }
  }

  return (
    <div className="card mx-auto mt-8 max-w-sm p-6">
      <h2 className="text-xl font-semibold">{isRegister ? "Create an account" : "Log in"}</h2>
      <p className="muted-text mt-1">
        {isRegister ? "Start tracking your training." : "Welcome back."}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div>
          <label className="label" htmlFor="auth-username">
            Username
          </label>
          <input
            id="auth-username"
            className="input"
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        {isRegister && (
          <div>
            <label className="label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="input"
              type="email"
              placeholder="Email (optional)"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            className="input"
            type="password"
            placeholder="Password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={status === "loading"}>
          {isRegister ? "Register" : "Log in"}
        </button>
      </form>

      {status === "failed" && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}

      <p className="muted-text mt-5 text-center">
        {isRegister ? "Already have an account?" : "No account yet?"}{" "}
        <button
          type="button"
          onClick={switchMode}
          className="font-medium text-lapis-300 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
        >
          {isRegister ? "Log in" : "Register"}
        </button>
      </p>
    </div>
  );
}
