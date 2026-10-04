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
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Category">
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
      <li style={{ marginBottom: 6 }}>
        <form onSubmit={handleSave}>
          <input
            type="text"
            aria-label="Exercise name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
          <CategorySelect value={category} onChange={setCategory} />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li style={{ marginBottom: 6 }}>
      <strong>{exercise.name}</strong> — {exercise.category}
      <button onClick={startEditing} style={{ marginLeft: 8 }}>
        Edit
      </button>
      <button onClick={() => dispatch(removeExercise(exercise.id))} style={{ marginLeft: 4 }}>
        Delete
      </button>
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
      <h2>Exercises</h2>

      <form onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New exercise name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
        <CategorySelect value={category} onChange={setCategory} />
        <button type="submit">Add exercise</button>
      </form>

      {saveError && (
        <p role="alert" style={{ color: "#b00020" }}>
          {saveError}
        </p>
      )}

      {status === "loading" && <p>Loading…</p>}
      {status === "failed" && <p>Could not load exercises.</p>}
      {status === "succeeded" && exercises.length === 0 && (
        <p>No exercises yet. Add your first one above.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {exercises.map((exercise) => (
          <ExerciseRow key={exercise.id} exercise={exercise} />
        ))}
      </ul>
    </div>
  );
}
