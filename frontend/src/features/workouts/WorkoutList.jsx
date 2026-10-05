import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { formatDate, todayISO } from "../../utils/dates";
import {
  fetchExercises,
  selectAllExercises,
  selectExercisesStatus,
} from "../exercises/exercisesSlice";
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

  if (exercises.length === 0) {
    return <p className="muted-text mt-3">Add an exercise in the Exercises tab to log sets.</p>;
  }

  return (
    // Phone: exercise on its own row, then reps / weight / button.
    // Wider screens: everything on one row.
    <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-[1fr_5rem_7rem_auto]">
      <select
        className="input col-span-3 sm:col-span-1"
        aria-label="Exercise"
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
        required
      >
        <option value="">Exercise…</option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
      <input
        className="input"
        type="number"
        inputMode="numeric"
        min="1"
        placeholder="Reps"
        aria-label="Reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        required
      />
      <input
        className="input"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.5"
        placeholder="kg"
        aria-label="Weight in kilograms"
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
      />
      <button type="submit" className="btn-primary">
        Add set
      </button>
    </form>
  );
}

function WorkoutCard({ workout }) {
  const dispatch = useDispatch();
  const sets = workout.sets || [];

  return (
    <li className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <strong className="font-semibold">
              <time dateTime={workout.date}>{formatDate(workout.date)}</time>
            </strong>
            <span className="rounded-full bg-lapis-600/20 px-2 py-0.5 text-xs font-medium capitalize text-lapis-300">
              {workout.workout_type}
            </span>
          </p>
          {workout.notes && <p className="muted-text mt-1 break-words">{workout.notes}</p>}
        </div>
        <button className="btn-danger shrink-0" onClick={() => dispatch(removeWorkout(workout.id))}>
          Delete workout
        </button>
      </div>

      {sets.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-800 border-t border-slate-800">
          {sets.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span>
                {s.exercise_name}: {s.reps} reps{" "}
                {/* Number() drops the trailing zeros of "92.50". */}
                <span className="text-slate-400">@ {Number(s.weight_kg)} kg</span>
              </span>
              <button className="btn-ghost" onClick={() => dispatch(removeSet(s.id))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddSetForm workoutId={workout.id} />
    </li>
  );
}

export default function WorkoutList() {
  const dispatch = useDispatch();
  const workouts = useSelector(selectAllWorkouts);
  const status = useSelector(selectWorkoutsStatus);
  const exercisesStatus = useSelector(selectExercisesStatus);
  const [date, setDate] = useState(todayISO);
  const [workoutType, setWorkoutType] = useState("strength");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchWorkouts());
    }
  }, [status, dispatch]);

  // The add-set dropdown needs the exercise list.
  useEffect(() => {
    if (exercisesStatus === "idle") {
      dispatch(fetchExercises());
    }
  }, [exercisesStatus, dispatch]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;
    dispatch(addWorkout({ date, workout_type: workoutType, notes }));
    setNotes("");
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Workouts</h2>

      <form onSubmit={handleSubmit} className="card mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[auto_auto_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="workout-date">
            Date
          </label>
          <input
            id="workout-date"
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="workout-type">
            Type
          </label>
          <select
            id="workout-type"
            className="input capitalize"
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value)}
          >
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label" htmlFor="workout-notes">
            Notes
          </label>
          <input
            id="workout-notes"
            className="input"
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary col-span-2 sm:col-span-1">
          Log workout
        </button>
      </form>

      {status === "loading" && <p className="muted-text mt-4">Loading…</p>}
      {status === "failed" && <p className="error-text">Could not load workouts.</p>}
      {status === "succeeded" && workouts.length === 0 && (
        <p className="muted-text mt-4">No workouts yet. Log your first one above.</p>
      )}

      <ul className="mt-4 space-y-3">
        {workouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </ul>
    </div>
  );
}
