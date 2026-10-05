import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { formatDate, todayISO } from "../../utils/dates";
import {
  addMacroLog,
  fetchMacros,
  removeMacroLog,
  selectAllMacros,
  selectMacrosStatus,
} from "./macrosSlice";

const emptyForm = () => ({
  date: todayISO(),
  calories: "",
  protein_g: "",
  carbs_g: "",
  fat_g: "",
  notes: "",
});

// The three gram fields share everything except their name.
const GRAM_FIELDS = [
  { field: "protein_g", label: "Protein" },
  { field: "carbs_g", label: "Carbs" },
  { field: "fat_g", label: "Fat" },
];

function MacroStat({ label, value }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-slate-400">{label}</span>{" "}
      {/* Number() drops the trailing zero of "170.0". */}
      <span className="font-medium tabular-nums">{Number(value)} g</span>
    </span>
  );
}

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
    setForm(emptyForm());
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Daily Macros</h2>

      <form onSubmit={handleSubmit} className="card mt-4 grid grid-cols-6 gap-3">
        <div className="col-span-3 sm:col-span-2">
          <label className="label" htmlFor="macro-date">
            Date
          </label>
          <input
            id="macro-date"
            className="input"
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            required
          />
        </div>
        <div className="col-span-3 sm:col-span-1">
          <label className="label" htmlFor="macro-calories">
            Calories
          </label>
          <input
            id="macro-calories"
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="kcal"
            value={form.calories}
            onChange={(e) => updateField("calories", e.target.value)}
            required
          />
        </div>
        {GRAM_FIELDS.map(({ field, label }) => (
          <div key={field} className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor={`macro-${field}`}>
              {label}
            </label>
            <input
              id={`macro-${field}`}
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="g"
              value={form[field]}
              onChange={(e) => updateField(field, e.target.value)}
            />
          </div>
        ))}
        <div className="col-span-6 sm:col-span-4">
          <label className="label" htmlFor="macro-notes">
            Notes
          </label>
          <input
            id="macro-notes"
            className="input"
            type="text"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary col-span-6 sm:col-span-2 sm:self-end">
          Log macros
        </button>
      </form>

      {status === "loading" && <p className="muted-text mt-4">Loading…</p>}
      {status === "failed" && <p className="error-text">Could not load macro logs.</p>}
      {status === "succeeded" && macros.length === 0 && (
        <p className="muted-text mt-4">No macros logged yet.</p>
      )}

      {macros.length > 0 && (
        <ul className="card mt-4 divide-y divide-slate-800 py-1">
          {macros.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <strong className="font-semibold">
                    <time dateTime={m.date}>{formatDate(m.date)}</time>
                  </strong>
                  <span className="tabular-nums">
                    <span className="text-lg font-semibold">{m.calories}</span>{" "}
                    <span className="text-slate-400">kcal</span>
                  </span>
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm">
                  <MacroStat label="P" value={m.protein_g} />
                  <MacroStat label="C" value={m.carbs_g} />
                  <MacroStat label="F" value={m.fat_g} />
                </p>
                {m.notes && <p className="muted-text mt-0.5 break-words">{m.notes}</p>}
              </div>
              <button className="btn-danger shrink-0" onClick={() => dispatch(removeMacroLog(m.id))}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
