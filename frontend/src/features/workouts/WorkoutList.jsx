import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchExercises, selectAllExercises } from "../exercises/exercisesSlice";
import { addSet, removeSet } from "../sets/setsSlice";
import {
  addWorkout,
  fetchWorkouts,
  removeWorkout,
  selectAllWorkouts,
  selectWorkoutsStatus,
} from "./workoutsSlice";

const WORKOUT_TYPES = ["strength", "cardio", "hiit", "mobility", "other"];

function AddSetForm({ workoutId }) {
  const dispatch = useDispatch();
  const exercises = useSelector(selectAllExercises);
  const [exerciseId, setExerciseId] = useState("");
  const [reps, setReps] = useState("");
  const [weightKg, setWeightKg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!exerciseId || !reps) return;
    dispatch(
      addSet({
        workout: workoutId,
        exercise: Number(exerciseId),
        reps: Number(reps),
        weight_kg: weightKg || 0,
      })
    );
    setReps("");
    setWeightKg("");
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 6 }}>
      <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} required>
        <option value="">Exercise…</option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        required
        style={{ width: 70 }}
      />
      <input
        type="number"
        step="0.5"
        placeholder="Weight (kg)"
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
        style={{ width: 100 }}
      />
      <button type="submit">Add set</button>
    </form>
  );
}

export default function WorkoutList() {
  const dispatch = useDispatch();
  const workouts = useSelector(selectAllWorkouts);
  const status = useSelector(selectWorkoutsStatus);
  const [date, setDate] = useState("");
  const [workoutType, setWorkoutType] = useState("strength");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchWorkouts());
    }
    dispatch(fetchExercises());
  }, [status, dispatch]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;
    dispatch(addWorkout({ date, workout_type: workoutType, notes }));
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
        <select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)}>
          {WORKOUT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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

      <ul style={{ listStyle: "none", padding: 0 }}>
        {workouts.map((w) => (
          <li key={w.id} style={{ marginBottom: 16, borderBottom: "1px solid #ddd", paddingBottom: 8 }}>
            <strong>{w.date}</strong> — {w.workout_type} — {w.notes || "no notes"}
            <button onClick={() => dispatch(removeWorkout(w.id))} style={{ marginLeft: 8 }}>
              Delete workout
            </button>

            <ul>
              {(w.sets || []).map((s) => (
                <li key={s.id}>
                  {s.exercise_name}: {s.reps} reps @ {s.weight_kg}kg
                  <button onClick={() => dispatch(removeSet(s.id))} style={{ marginLeft: 6 }}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <AddSetForm workoutId={w.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
