import React from "react";

import MacroLog from "./features/macros/MacroLog";
import WorkoutList from "./features/workouts/WorkoutList";

export default function App() {
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>LapisTracker</h1>
      <WorkoutList />
      <hr style={{ margin: "32px 0" }} />
      <MacroLog />
    </div>
  );
}
