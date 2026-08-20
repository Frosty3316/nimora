export function deadlinesEqual(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return new Date(a).getTime() === new Date(b).getTime();
}

export function shouldRecordDeadlineChange(previousDeadline, newDeadline) {
  return !deadlinesEqual(previousDeadline, newDeadline);
}
