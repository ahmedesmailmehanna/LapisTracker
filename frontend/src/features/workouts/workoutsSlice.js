import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";

export const fetchWorkouts = createAsyncThunk("workouts/fetchAll", async () => {
  const data = await api.listWorkouts();
  // DRF pagination wraps results in { results: [...] }
  return data.results ?? data;
});

export const addWorkout = createAsyncThunk("workouts/add", async (workout) => {
  return api.createWorkout(workout);
});

export const removeWorkout = createAsyncThunk("workouts/remove", async (id) => {
  await api.deleteWorkout(id);
  return id;
});

const workoutsSlice = createSlice({
  name: "workouts",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkouts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addWorkout.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(removeWorkout.fulfilled, (state, action) => {
        state.items = state.items.filter((w) => w.id !== action.payload);
      });
  },
});

export default workoutsSlice.reducer;

export const selectAllWorkouts = (state) => state.workouts.items;
export const selectWorkoutsStatus = (state) => state.workouts.status;
