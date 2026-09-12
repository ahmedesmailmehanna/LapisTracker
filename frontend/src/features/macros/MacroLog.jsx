import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addMacroLog,
  fetchMacros,
  removeMacroLog,
  selectAllMacros,
  selectMacrosStatus,
} from "./macrosSlice";

const emptyForm = { date: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", notes: "" };

export default function MacroLog() {
  const dispatch = useDispatch();
  const macros = useSelector(selectAllMacros);
  const status = useSelector(selectMacrosStatus);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMacros());
    }
  }, [status, dispatch]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.date || !form.calories) return;
    dispatch(
      addMacroLog({
        date: form.date,
        calories: Number(form.calories),
        protein_g: form.protein_g || 0,
        carbs_g: form.carbs_g || 0,
        fat_g: form.fat_g || 0,
        notes: form.notes,
      })
    );
    setForm(emptyForm);
  }

  return (
    <div>
      <h2>Daily Macros</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="date"
          value={form.date}
          onChange={(e) => updateField("date", e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Calories"
          value={form.calories}
          onChange={(e) => updateField("calories", e.target.value)}
          required
        />
        <input
          type="number"
          step="0.1"
          placeholder="Protein (g)"
          value={form.protein_g}
          onChange={(e) => updateField("protein_g", e.target.value)}
        />
        <input
          type="number"
          step="0.1"
          placeholder="Carbs (g)"
          value={form.carbs_g}
          onChange={(e) => updateField("carbs_g", e.target.value)}
        />
        <input
          type="number"
          step="0.1"
          placeholder="Fat (g)"
          value={form.fat_g}
          onChange={(e) => updateField("fat_g", e.target.value)}
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />
        <button type="submit">Log macros</button>
      </form>

      {status === "loading" && <p>Loading…</p>}
      {status === "failed" && <p>Could not load macro logs.</p>}

      <ul>
        {macros.map((m) => (
          <li key={m.id}>
            {m.date} — {m.calories} kcal (P {m.protein_g}g / C {m.carbs_g}g / F {m.fat_g}g)
            <button onClick={() => dispatch(removeMacroLog(m.id))}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
