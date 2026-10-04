import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";
import { fetchWorkouts } from "../workouts/workoutsSlice";

export const fetchExercises = createAsyncThunk("exercises/fetchAll", async () => {
  return api.listExercises();
});

export const addExercise = createAsyncThunk("exercises/add", async (exercise) => {
  return api.createExercise(exercise);
});

export const updateExercise = createAsyncThunk(
  "exercises/update",
  async ({ id, changes }, { dispatch }) => {
    const updated = await api.updateExercise(id, changes);
    // Each logged set carries its exercise's name (see SetEntrySerializer),
    // so reload workouts to show the new name there too.
    dispatch(fetchWorkouts());
    return updated;
  }
);

export const removeExercise = createAsyncThunk("exercises/remove", async (id) => {
  await api.deleteExercise(id);
  return id;
});

const byName = (a, b) => a.name.localeCompare(b.name);

const exercisesSlice = createSlice({
  name: "exercises",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed  (loading the list)
    error: null,
    // Error from the last add / update / delete, e.g. "name already exists"
    // or "exercise is used in logged sets". Shown next to the form.
    saveError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const clearSaveError = (state) => {
      state.saveError = null;
    };
    const setSaveError = (state, action) => {
      state.saveError = action.error.message;
    };

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

      .addCase(addExercise.pending, clearSaveError)
      .addCase(addExercise.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.items.sort(byName);
      })
      .addCase(addExercise.rejected, setSaveError)

      .addCase(updateExercise.pending, clearSaveError)
      .addCase(updateExercise.fulfilled, (state, action) => {
        const index = state.items.findIndex((ex) => ex.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.items.sort(byName);
      })
      .addCase(updateExercise.rejected, setSaveError)

      .addCase(removeExercise.pending, clearSaveError)
      .addCase(removeExercise.fulfilled, (state, action) => {
        state.items = state.items.filter((ex) => ex.id !== action.payload);
      })
      .addCase(removeExercise.rejected, setSaveError);
  },
});

export default exercisesSlice.reducer;

export const selectAllExercises = (state) => state.exercises.items;
export const selectExercisesStatus = (state) => state.exercises.status;
export const selectExerciseSaveError = (state) => state.exercises.saveError;
