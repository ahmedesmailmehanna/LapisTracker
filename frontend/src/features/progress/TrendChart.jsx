import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_INK, SERIES_COLORS } from "./chartTheme";

const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" });

const cellStyle = { padding: "2px 12px 2px 0", textAlign: "left" };

/**
 * A line chart of one or more series over time, plus the same data as a table.
 *
 * props:
 *   title  - heading above the chart (names the series when there is only one)
 *   data   - [{ time: <ms timestamp>, date: "YYYY-MM-DD", <key>: number, ... }]
 *   series - [{ key: "calories", label: "Calories" }, ...]  (max 3)
 *   unit   - "kg", "g", "kcal": shown in the tooltip and table header
 */
export default function TrendChart({ title, data, series, unit }) {
  // Dots on every point help with a few points and become clutter with many.
  const showDots = data.length <= 40;

  return (
    <figure style={{ margin: "12px 0 24px" }}>
      <figcaption style={{ fontWeight: "bold", marginBottom: 8 }}>{title}</figcaption>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
          {/* A real time axis: the gap between two points matches the number
              of days between them, instead of spacing the points evenly. */}
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(time) => shortDate.format(time)}
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.axis }}
            minTickGap={32}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis
            width={52}
            domain={["auto", "auto"]}
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(time) => fullDate.format(time)}
            formatter={(value, name) => [`${value} ${unit}`, name]}
            itemStyle={{ color: CHART_INK.text }}
            isAnimationActive={false}
          />
          {/* With a single series the title already says what is plotted. */}
          {series.length > 1 && (
            <Legend
              iconType="plainline"
              itemSorter={null} // keep the order of the `series` prop
              formatter={(label) => <span style={{ color: CHART_INK.text }}>{label}</span>}
            />
          )}
          {series.map((s, index) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type="linear"
              stroke={SERIES_COLORS[index]}
              strokeWidth={2}
              dot={
                showDots
                  ? { r: 4, fill: SERIES_COLORS[index], stroke: CHART_INK.surface, strokeWidth: 2 }
                  : false
              }
              activeDot={{ r: 6, stroke: CHART_INK.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* The same numbers as text, for anyone who cannot or would rather not
          read them off the chart. */}
      <details style={{ fontSize: 14, color: CHART_INK.text }}>
        <summary>Show data</summary>
        <table style={{ borderCollapse: "collapse", marginTop: 6 }}>
          <thead>
            <tr>
              <th style={cellStyle}>Date</th>
              {series.map((s) => (
                <th key={s.key} style={cellStyle}>
                  {s.label} ({unit})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date}>
                <td style={cellStyle}>{point.date}</td>
                {series.map((s) => (
                  <td key={s.key} style={cellStyle}>
                    {point[s.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
