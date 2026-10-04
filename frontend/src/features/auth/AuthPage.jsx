import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearAuthError,
  login,
  register,
  selectAuthError,
  selectAuthStatus,
} from "./authSlice";

const fieldStyle = { display: "block", marginBottom: 8, padding: 6, width: "100%" };

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
    <div style={{ maxWidth: 320 }}>
      <h2>{isRegister ? "Create an account" : "Log in"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={fieldStyle}
        />
        {isRegister && (
          <input
            type="email"
            placeholder="Email (optional)"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
          />
        )}
        <input
          type="password"
          placeholder="Password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={fieldStyle}
        />
        <button type="submit" disabled={status === "loading"}>
          {isRegister ? "Register" : "Log in"}
        </button>
      </form>

      {status === "failed" && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      <p>
        {isRegister ? "Already have an account?" : "No account yet?"}{" "}
        <button type="button" onClick={switchMode}>
          {isRegister ? "Log in" : "Register"}
        </button>
      </p>
    </div>
  );
}
