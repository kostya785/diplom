export function normalizeSlotDate(dateInput) {
  const d = new Date(dateInput);
  d.setSeconds(0, 0);
  return d;
}

export function slotTimestamp(dateInput) {
  return normalizeSlotDate(dateInput).getTime();
}
