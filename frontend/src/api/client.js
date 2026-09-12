const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status} on ${path}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  listWorkouts: () => request("/workouts/"),
  createWorkout: (data) =>
    request("/workouts/", { method: "POST", body: JSON.stringify(data) }),
  deleteWorkout: (id) => request(`/workouts/${id}/`, { method: "DELETE" }),

  listExercises: () => request("/exercises/"),
  createExercise: (data) =>
    request("/exercises/", { method: "POST", body: JSON.stringify(data) }),

  listSets: () => request("/sets/"),
  createSet: (data) => request("/sets/", { method: "POST", body: JSON.stringify(data) }),
  deleteSet: (id) => request(`/sets/${id}/`, { method: "DELETE" }),

  listMacros: () => request("/macros/"),
  createMacro: (data) =>
    request("/macros/", { method: "POST", body: JSON.stringify(data) }),
  deleteMacro: (id) => request(`/macros/${id}/`, { method: "DELETE" }),
};
