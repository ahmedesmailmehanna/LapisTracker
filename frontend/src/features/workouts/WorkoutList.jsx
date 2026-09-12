import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addWorkout,
  fetchWorkouts,
  removeWorkout,
  selectAllWorkouts,
  selectWorkoutsStatus,
} from "./workoutsSlice";

export default function WorkoutList() {
  const dispatch = useDispatch();
  const workouts = useSelector(selectAllWorkouts);
  const status = useSelector(selectWorkoutsStatus);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchWorkouts());
    }
  }, [status, dispatch]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;
    dispatch(addWorkout({ date, notes }));
    setDate("");
    setNotes("");
  }

  return (
    <div>
      <h2>Workouts</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit">Log workout</button>
      </form>

      {status === "loading" && <p>Loading…</p>}
      {status === "failed" && <p>Could not load workouts.</p>}

      <ul>
        {workouts.map((w) => (
          <li key={w.id}>
            {w.date} — {w.notes || "no notes"}
            <button onClick={() => dispatch(removeWorkout(w.id))}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
