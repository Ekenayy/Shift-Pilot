import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for displaying elapsed time during an active trip.
 * Updates every second and returns a formatted string (HH:MM:SS or MM:SS).
 *
 * @param startTime - The trip start timestamp in milliseconds
 * @param isActive - Whether the timer should be running
 * @returns Formatted elapsed time string
 */
export function useActiveTripTimer(
  startTime: number | null,
  isActive: boolean
): string {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }

    // Calculate initial elapsed time
    const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
    setElapsed(initialElapsed);

    // Update every second
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setElapsed(elapsedSeconds);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTime, isActive]);

  return formatElapsedTime(elapsed);
}

/**
 * Format seconds into HH:MM:SS or MM:SS string
 */
function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Get elapsed time in seconds from a start timestamp
 */
export function getElapsedSeconds(startTime: number): number {
  return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Format elapsed time without the hook (for static display)
 */
export function formatDuration(startTime: number, endTime?: number): string {
  const end = endTime || Date.now();
  const totalSeconds = Math.floor((end - startTime) / 1000);
  return formatElapsedTime(totalSeconds);
}

