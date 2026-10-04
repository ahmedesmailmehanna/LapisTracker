import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";

export const fetchExerciseProgress = createAsyncThunk(
  "progress/fetchExercise",
  async ({ exerciseId, days }) => api.getExerciseProgress(exerciseId, days)
);

export const fetchMacroTrend = createAsyncThunk("progress/fetchMacros", async ({ days }) =>
  api.getMacroTrend(days)
);

const emptySeries = { points: [], status: "idle" }; // idle | loading | succeeded | failed

const progressSlice = createSlice({
  name: "progress",
  initialState: {
    days: 90, // selected range; null means "all time"
    exerciseId: null, // selected exercise
    exercise: emptySeries,
    macros: emptySeries,
  },
  reducers: {
    rangeChanged: (state, action) => {
      state.days = action.payload;
    },
    exerciseSelected: (state, action) => {
      state.exerciseId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // A response can arrive after the user has already picked a different
    // exercise or range. Each handler therefore checks that the request it
    // belongs to (action.meta.arg) still matches the current selection and
    // ignores the response otherwise.
    const isCurrentExerciseRequest = (state, action) =>
      action.meta.arg.exerciseId === state.exerciseId && action.meta.arg.days === state.days;
    const isCurrentMacroRequest = (state, action) => action.meta.arg.days === state.days;

    builder
      .addCase(fetchExerciseProgress.pending, (state, action) => {
        if (isCurrentExerciseRequest(state, action)) state.exercise.status = "loading";
      })
      .addCase(fetchExerciseProgress.fulfilled, (state, action) => {
        if (isCurrentExerciseRequest(state, action)) {
          state.exercise = { points: action.payload, status: "succeeded" };
        }
      })
      .addCase(fetchExerciseProgress.rejected, (state, action) => {
        if (isCurrentExerciseRequest(state, action)) {
          state.exercise = { points: [], status: "failed" };
        }
      })
      .addCase(fetchMacroTrend.pending, (state, action) => {
        if (isCurrentMacroRequest(state, action)) state.macros.status = "loading";
      })
      .addCase(fetchMacroTrend.fulfilled, (state, action) => {
        if (isCurrentMacroRequest(state, action)) {
          state.macros = { points: action.payload, status: "succeeded" };
        }
      })
      .addCase(fetchMacroTrend.rejected, (state, action) => {
        if (isCurrentMacroRequest(state, action)) {
          state.macros = { points: [], status: "failed" };
        }
      });
  },
});

export const { rangeChanged, exerciseSelected } = progressSlice.actions;
export default progressSlice.reducer;

export const selectProgressDays = (state) => state.progress.days;
export const selectProgressExerciseId = (state) => state.progress.exerciseId;
export const selectExerciseProgressStatus = (state) => state.progress.exercise.status;
export const selectMacroTrendStatus = (state) => state.progress.macros.status;

// --- Derived data for the charts -------------------------------------------
// The store keeps the API response as-is. DRF sends decimals as strings
// ("100.00") and dates as "YYYY-MM-DD", but a chart needs numbers. These
// memoized selectors do the conversion, and only recompute when the
// underlying points change (createSelector caches the last result).

const toTime = (isoDate) => new Date(`${isoDate}T00:00:00`).getTime();

export const selectExerciseChartData = createSelector(
  (state) => state.progress.exercise.points,
  (points) =>
    points.map((point) => ({
      date: point.date,
      time: toTime(point.date),
      max_weight_kg: Number(point.max_weight_kg),
    }))
);

export const selectMacroChartData = createSelector(
  (state) => state.progress.macros.points,
  (points) =>
    points.map((point) => ({
      date: point.date,
      time: toTime(point.date),
      calories: point.calories,
      protein_g: Number(point.protein_g),
      carbs_g: Number(point.carbs_g),
      fat_g: Number(point.fat_g),
    }))
);
