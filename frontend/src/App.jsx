import React from "react";

import WorkoutList from "./features/workouts/WorkoutList";

export default function App() {
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>LapisTracker</h1>
      <WorkoutList />
    </div>
  );
}
