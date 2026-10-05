// Colours for the charts, in one place. Recharts draws SVG and takes colours
// as props, so these are plain values rather than Tailwind classes.
//
// The three series colours are used in this fixed order. They were checked
// against the dark card background for contrast and for colour-blind
// separation (the closest pair stays distinguishable under deuteranopia).
// Every multi-series chart also has a legend, a tooltip and a data table, so
// colour is never the only way to tell the series apart.
export const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70"]; // blue, orange, teal

export const CHART_INK = {
  text: "#cbd5e1", // legend and tooltip text (slate-300)
  muted: "#94a3b8", // axis tick labels (slate-400)
  grid: "#1e293b", // horizontal gridlines (slate-800)
  axis: "#334155", // baseline (slate-700)
  surface: "#0f172a", // card background (slate-900): ring around dots
  tooltip: "#1e293b", // tooltip background (slate-800)
};
