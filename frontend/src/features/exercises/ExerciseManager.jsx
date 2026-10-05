import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addExercise,
  fetchExercises,
  removeExercise,
  selectAllExercises,
  selectExerciseSaveError,
  selectExercisesStatus,
  updateExercise,
} from "./exercisesSlice";

// Must match Exercise.Category in backend/tracker/models.py.
const CATEGORIES = ["push", "pull", "legs", "core", "cardio", "other"];

function CategorySelect({ value, onChange }) {
  return (
    <select
      className="input capitalize"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Category"
    >
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

// One row of the list. Shows the exercise, or an inline form while editing.
function ExerciseRow({ exercise }) {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [category, setCategory] = useState(exercise.category);

  function startEditing() {
    setName(exercise.name);
    setCategory(exercise.category);
    setIsEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const result = await dispatch(
      updateExercise({ id: exercise.id, changes: { name: name.trim(), category } })
    );
    // Stay in edit mode if the server rejected the change (e.g. duplicate name).
    if (updateExercise.fulfilled.match(result)) {
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_8rem_auto_auto]">
          <input
            className="input col-span-2 sm:col-span-1"
            type="text"
            aria-label="Exercise name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
          <div className="col-span-2 sm:col-span-1">
            <CategorySelect value={category} onChange={setCategory} />
          </div>
          <button type="submit" className="btn-primary">
            Save
          </button>
          <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <strong className="break-words font-medium">{exercise.name}</strong>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize text-slate-300">
          {exercise.category}
        </span>
      </span>
      <span className="flex shrink-0 gap-1">
        <button className="btn-ghost" onClick={startEditing}>
          Edit
        </button>
        <button className="btn-danger" onClick={() => dispatch(removeExercise(exercise.id))}>
          Delete
        </button>
      </span>
    </li>
  );
}

export default function ExerciseManager() {
  const dispatch = useDispatch();
  const exercises = useSelector(selectAllExercises);
  const status = useSelector(selectExercisesStatus);
  const saveError = useSelector(selectExerciseSaveError);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchExercises());
    }
  }, [status, dispatch]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await dispatch(addExercise({ name: name.trim(), category }));
    if (addExercise.fulfilled.match(result)) {
      setName("");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Exercises</h2>

      <form onSubmit={handleAdd} className="card mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_8rem_auto]">
        <input
          className="input col-span-2 sm:col-span-1"
          type="text"
          placeholder="New exercise name"
          aria-label="New exercise name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
        <CategorySelect value={category} onChange={setCategory} />
        <button type="submit" className="btn-primary">
          Add exercise
        </button>
      </form>

      {saveError && (
        <p role="alert" className="error-text">
          {saveError}
        </p>
      )}

      {status === "loading" && <p className="muted-text mt-4">Loading…</p>}
      {status === "failed" && <p className="error-text">Could not load exercises.</p>}
      {status === "succeeded" && exercises.length === 0 && (
        <p className="muted-text mt-4">No exercises yet. Add your first one above.</p>
      )}

      {exercises.length > 0 && (
        <ul className="card mt-4 divide-y divide-slate-800 py-1">
          {exercises.map((exercise) => (
            <ExerciseRow key={exercise.id} exercise={exercise} />
          ))}
        </ul>
      )}
    </div>
  );
}
