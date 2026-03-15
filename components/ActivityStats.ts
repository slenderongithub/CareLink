export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(safe % 60)
    .toString()
    .padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

export function formatPace(totalSeconds: number, distanceKm: number) {
  if (distanceKm <= 0) {
    return '--:--';
  }

  const secondsPerKm = Math.round(totalSeconds / distanceKm);
  const minutes = Math.floor(secondsPerKm / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (secondsPerKm % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function estimateCalories(steps: number, durationMinutes: number) {
  const bySteps = steps * 0.045;
  const byDuration = durationMinutes * 4.2;
  return Math.round((bySteps + byDuration) / 2);
}
