// Today's date as "YYYY-MM-DD" in the user's own time zone, which is the
// format <input type="date"> and the API use. (toISOString() would give the
// UTC date, which is yesterday or tomorrow near midnight.)
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

// "2026-10-05" -> "Mon, 5 Oct 2026". The "T00:00:00" makes the browser read
// the date in local time; a bare "2026-10-05" would be parsed as UTC.
export function formatDate(isoDate) {
  return dayFormat.format(new Date(`${isoDate}T00:00:00`));
}
