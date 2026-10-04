import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api, tokenStorage } from "../../api/client";

// Register and login both return { token, user }. The token is saved to
// localStorage inside the thunk because reducers must stay free of side
// effects.

export const register = createAsyncThunk("auth/register", async (credentials) => {
  const data = await api.register(credentials);
  tokenStorage.set(data.token);
  return data;
});

export const login = createAsyncThunk("auth/login", async (credentials) => {
  const data = await api.login(credentials);
  tokenStorage.set(data.token);
  return data;
});

// Runs once on page load when a saved token exists, to turn that token back
// into a user (and to find out whether the token is still valid).
export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async () => {
  return api.getCurrentUser();
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api.logout(); // deletes the token on the server
  } catch {
    // Even if the server is unreachable, still forget the token locally.
  }
  tokenStorage.clear();
});

const authSlice = createSlice({
  name: "auth",
  // A function, not an object: store.js resets the whole Redux state on
  // logout, and this must re-read localStorage (now empty) at that moment.
  initialState: () => ({
    token: tokenStorage.get(),
    user: null,
    status: "idle", // idle | loading | failed
    error: null,
  }),
  reducers: {
    // Dispatched when the API answers 401 for a saved token (see store.js).
    // The state reset itself happens in the root reducer.
    sessionExpired: () => {},
    clearAuthError: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const startLoading = (state) => {
      state.status = "loading";
      state.error = null;
    };
    const signedIn = (state, action) => {
      state.status = "idle";
      state.token = action.payload.token;
      state.user = action.payload.user;
    };
    const failed = (state, action) => {
      state.status = "failed";
      state.error = action.error.message;
    };

    builder
      .addCase(register.pending, startLoading)
      .addCase(register.fulfilled, signedIn)
      .addCase(register.rejected, failed)
      .addCase(login.pending, startLoading)
      .addCase(login.fulfilled, signedIn)
      .addCase(login.rejected, failed)
      .addCase(fetchCurrentUser.pending, startLoading)
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, failed);
  },
});

export const { sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

export const selectToken = (state) => state.auth.token;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
