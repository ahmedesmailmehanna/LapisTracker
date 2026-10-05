import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchExercises,
  selectAllExercises,
  selectExercisesStatus,
} from "../exercises/exercisesSlice";
import {
  exerciseSelected,
  fetchExerciseProgress,
  fetchMacroTrend,
  rangeChanged,
  selectExerciseChartData,
  selectExerciseProgressStatus,
  selectMacroChartData,
  selectMacroTrendStatus,
  selectProgressDays,
  selectProgressExerciseId,
} from "./progressSlice";
import TrendChart from "./TrendChart";

const RANGES = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last year", days: 365 },
  { label: "All time", days: null },
];

const WEIGHT_SERIES = [{ key: "max_weight_kg", label: "Heaviest set" }];
const CALORIE_SERIES = [{ key: "calories", label: "Calories" }];
// Calories (thousands of kcal) and macros (grams) are on different scales, so
// they get separate charts rather than one chart with two y-axes.
const MACRO_SERIES = [
  { key: "protein_g", label: "Protein" },
  { key: "carbs_g", label: "Carbs" },
  { key: "fat_g", label: "Fat" },
];

function StatusMessage({ status, isEmpty, emptyText }) {
  if (status === "loading" || status === "idle") return <p className="muted-text mt-3">Loading…</p>;
  if (status === "failed") {
    return (
      <p role="alert" className="error-text">
        Could not load this chart.
      </p>
    );
  }
  if (isEmpty) return <p className="muted-text mt-3">{emptyText}</p>;
  return null;
}

export default function ProgressPage() {
  const dispatch = useDispatch();
  const days = useSelector(selectProgressDays);
  const exerciseId = useSelector(selectProgressExerciseId);
  const exercises = useSelector(selectAllExercises);
  const exercisesStatus = useSelector(selectExercisesStatus);
  const weightData = useSelector(selectExerciseChartData);
  const weightStatus = useSelector(selectExerciseProgressStatus);
  const macroData = useSelector(selectMacroChartData);
  const macroStatus = useSelector(selectMacroTrendStatus);

  useEffect(() => {
    if (exercisesStatus === "idle") {
      dispatch(fetchExercises());
    }
  }, [exercisesStatus, dispatch]);

  // Pick the first exercise by default (also covers the case where the
  // selected exercise was deleted in the Exercises tab).
  const selectedExists = exercises.some((ex) => ex.id === exerciseId);
  useEffect(() => {
    if (!selectedExists && exercises.length > 0) {
      dispatch(exerciseSelected(exercises[0].id));
    }
  }, [selectedExists, exercises, dispatch]);

  // Reload whenever the page opens or a filter changes, so newly logged
  // sets and macros show up.
  useEffect(() => {
    if (selectedExists) {
      dispatch(fetchExerciseProgress({ exerciseId, days }));
    }
  }, [selectedExists, exerciseId, days, dispatch]);

  useEffect(() => {
    dispatch(fetchMacroTrend({ days }));
  }, [days, dispatch]);

  const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
  const weightIsEmpty = weightData.length === 0;
  const macrosAreEmpty = macroData.length === 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">Progress</h2>

        <label className="label mb-0">
          Period
          <select
            className="input mt-1"
            value={days ?? "all"}
            onChange={(e) =>
              dispatch(rangeChanged(e.target.value === "all" ? null : Number(e.target.value)))
            }
          >
            {RANGES.map((range) => (
              <option key={range.label} value={range.days ?? "all"}>
                {range.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3 className="mt-6 text-base font-semibold text-slate-300">Strength</h3>
      {exercises.length === 0 ? (
        <p className="muted-text mt-3">
          Add an exercise and log some sets to see your progress here.
        </p>
      ) : (
        <>
          <label className="label mt-3 max-w-xs">
            Exercise
            <select
              className="input mt-1"
              value={exerciseId ?? ""}
              onChange={(e) => dispatch(exerciseSelected(Number(e.target.value)))}
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </label>
          <StatusMessage
            status={weightStatus}
            isEmpty={weightIsEmpty}
            emptyText="No sets logged for this exercise in this period."
          />
          {weightStatus === "succeeded" && !weightIsEmpty && (
            <TrendChart
              title={`${selectedExercise.name}: heaviest set per day (kg)`}
              data={weightData}
              series={WEIGHT_SERIES}
              unit="kg"
            />
          )}
        </>
      )}

      <h3 className="mt-8 text-base font-semibold text-slate-300">Nutrition</h3>
      <StatusMessage
        status={macroStatus}
        isEmpty={macrosAreEmpty}
        emptyText="No macros logged in this period."
      />
      {macroStatus === "succeeded" && !macrosAreEmpty && (
        <>
          <TrendChart
            title="Daily calories (kcal)"
            data={macroData}
            series={CALORIE_SERIES}
            unit="kcal"
          />
          <TrendChart
            title="Daily macros (g)"
            data={macroData}
            series={MACRO_SERIES}
            unit="g"
          />
        </>
      )}
    </div>
  );
}
