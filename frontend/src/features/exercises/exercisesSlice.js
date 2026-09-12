import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";

export const fetchExercises = createAsyncThunk("exercises/fetchAll", async () => {
  const data = await api.listExercises();
  return data.results ?? data;
});

export const addExercise = createAsyncThunk("exercises/add", async (exercise) => {
  return api.createExercise(exercise);
});

const exercisesSlice = createSlice({
  name: "exercises",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExercises.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchExercises.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchExercises.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addExercise.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export default exercisesSlice.reducer;

export const selectAllExercises = (state) => state.exercises.items;
export const selectExercisesStatus = (state) => state.exercises.status;
