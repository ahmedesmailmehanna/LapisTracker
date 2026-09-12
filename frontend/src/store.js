import { configureStore } from "@reduxjs/toolkit";

import exercisesReducer from "./features/exercises/exercisesSlice";
import macrosReducer from "./features/macros/macrosSlice";
import setsReducer from "./features/sets/setsSlice";
import workoutsReducer from "./features/workouts/workoutsSlice";

export const store = configureStore({
  reducer: {
    workouts: workoutsReducer,
    exercises: exercisesReducer,
    sets: setsReducer,
    macros: macrosReducer,
  },
});
