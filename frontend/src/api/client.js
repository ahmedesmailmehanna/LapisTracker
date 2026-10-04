const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// --- Token storage ---------------------------------------------------------
// The API token is kept in localStorage so a page refresh does not log the
// user out. Trade-off: JavaScript can read localStorage, so an XSS bug could
// leak the token. The alternative is an httpOnly cookie, which then needs
// CSRF protection instead.
const TOKEN_KEY = "lapistracker_token";

export const tokenStorage = {
  get: () => window.localStorage.getItem(TOKEN_KEY),
  set: (token) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

// --- Errors ----------------------------------------------------------------
export class ApiError extends Error {
  constructor(status, data) {
    super(describeError(status, data));
    this.status = status;
    this.data = data;
  }
}

// DRF returns validation errors as { field: ["message", ...] } and other
// errors as { detail: "message" }. Flatten either shape into one sentence.
function describeError(status, data) {
  if (data && typeof data === "object") {
    const messages = Object.values(data).flat().filter((m) => typeof m === "string");
    if (messages.length > 0) return messages.join(" ");
  }
  return `Request failed (${status}).`;
}

// --- 401 handling ----------------------------------------------------------
// The store registers a callback here (see store.js) so that an expired or
// deleted token logs the user out. A callback avoids this file importing the
// store, which would be a circular import.
let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// --- Request helper --------------------------------------------------------
async function request(path, options = {}) {
  const token = tokenStorage.get();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      onUnauthorized();
    }
    throw new ApiError(response.status, data);
  }
  return data;
}

const post = (path, data) => request(path, { method: "POST", body: JSON.stringify(data) });
const del = (path) => request(path, { method: "DELETE" });

export const api = {
  register: (credentials) => post("/auth/register/", credentials),
  login: (credentials) => post("/auth/login/", credentials),
  logout: () => post("/auth/logout/"),
  getCurrentUser: () => request("/auth/me/"),

  listWorkouts: () => request("/workouts/"),
  createWorkout: (data) => post("/workouts/", data),
  deleteWorkout: (id) => del(`/workouts/${id}/`),

  listExercises: () => request("/exercises/"),
  createExercise: (data) => post("/exercises/", data),

  listSets: () => request("/sets/"),
  createSet: (data) => post("/sets/", data),
  deleteSet: (id) => del(`/sets/${id}/`),

  listMacros: () => request("/macros/"),
  createMacro: (data) => post("/macros/", data),
  deleteMacro: (id) => del(`/macros/${id}/`),
};
