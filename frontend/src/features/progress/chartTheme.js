// Colours for the charts, in one place.
//
// The three series colours are used in this fixed order and were checked for
// colour-blind separation (worst adjacent pair still distinguishable under
// deuteranopia). Teal is a little light against white, which is why every
// multi-series chart also has a legend, a tooltip and a data table: colour
// is never the only way to tell the series apart.
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"]; // blue, orange, teal

export const CHART_INK = {
  text: "#52514e", // legend and table text
  muted: "#898781", // axis tick labels
  grid: "#e1e0d9", // horizontal gridlines
  axis: "#c3c2b7", // baseline
  surface: "#ffffff", // ring around dots so they stay readable on the line
};
