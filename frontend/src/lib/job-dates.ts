const zone = "Asia/Kolkata";
const jobDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: zone });
const dateInput = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: zone,
});

export const formatJobDate = (date: string) => jobDate.format(new Date(date));

export function todayForJobDeadline() {
  const parts = dateInput.formatToParts(new Date());
  return ["year", "month", "day"].map(part => parts.find(item => item.type === part)?.value).join("-");
}
