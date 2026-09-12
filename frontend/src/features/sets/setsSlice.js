import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";
import { fetchWorkouts } from "../workouts/workoutsSlice";

// Sets are nested inside each workout's `sets` field (see WorkoutSerializer),
// so after adding/removing a set we simply re-fetch workouts to pick up the
// updated nested list rather than duplicating that state here.

export const addSet = createAsyncThunk("sets/add", async (setEntry, { dispatch }) => {
  const created = await api.createSet(setEntry);
  await dispatch(fetchWorkouts());
  return created;
});

export const removeSet = createAsyncThunk("sets/remove", async (id, { dispatch }) => {
  await api.deleteSet(id);
  await dispatch(fetchWorkouts());
  return id;
});

const setsSlice = createSlice({
  name: "sets",
  initialState: { status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addSet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(removeSet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default setsSlice.reducer;
