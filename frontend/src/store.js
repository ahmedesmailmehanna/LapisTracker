import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { setUnauthorizedHandler, tokenStorage } from "./api/client";
import authReducer, { logout, sessionExpired } from "./features/auth/authSlice";
import exercisesReducer from "./features/exercises/exercisesSlice";
import macrosReducer from "./features/macros/macrosSlice";
import progressReducer from "./features/progress/progressSlice";
import setsReducer from "./features/sets/setsSlice";
import workoutsReducer from "./features/workouts/workoutsSlice";

const appReducer = combineReducers({
  auth: authReducer,
  workouts: workoutsReducer,
  exercises: exercisesReducer,
  sets: setsReducer,
  macros: macrosReducer,
  progress: progressReducer,
});

// When the user logs out (or their token stops working), throw away the
// whole state. Passing `undefined` makes every slice return its initial
// state, so the next user never sees the previous user's cached data.
function rootReducer(state, action) {
  if (logout.fulfilled.match(action) || sessionExpired.match(action)) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
}

export const store = configureStore({ reducer: rootReducer });

// The API client calls this when a request with a saved token gets a 401.
setUnauthorizedHandler(() => {
  tokenStorage.clear();
  store.dispatch(sessionExpired());
});
