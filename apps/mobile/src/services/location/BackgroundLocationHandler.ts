/**
 * BackgroundLocationHandler.ts
 *
 * This file defines the background location task that processes location updates
 * when the app is in the background. It MUST be imported at the top level of the app
 * (in App.tsx) BEFORE any components render.
 *
 * The task definition is global and persists across app restarts.
 */

import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { tripDetectionService } from "./TripDetectionService";
import type { LocationUpdate } from "./types";

export const BACKGROUND_LOCATION_TASK = "shift-pilot-background-location";

// Track if we've already defined the task
let isTaskDefined = false;

/**
 * Define the background location task.
 * This must be called before registering the task.
 */
export function defineBackgroundLocationTask(): void {
  if (isTaskDefined) {
    console.log("[BackgroundLocation] Task already defined");
    return;
  }

  TaskManager.defineTask(
    BACKGROUND_LOCATION_TASK,
    async ({
      data,
      error,
    }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
      if (error) {
        console.error("[BackgroundLocation] Task error:", error);
        return;
      }

      if (!data || !data.locations || data.locations.length === 0) {
        console.log("[BackgroundLocation] No locations received");
        return;
      }

      const { locations } = data;

      console.log(
        `[BackgroundLocation] Received ${locations.length} location(s)`,
        {
          speed: locations[0].coords.speed?.toFixed(1),
          accuracy: locations[0].coords.accuracy?.toFixed(0),
        }
      );

      // Process each location through the trip detection service
      for (const location of locations) {
        const locationUpdate: LocationUpdate = {
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
          },
          timestamp: location.timestamp,
        };

        try {
          await tripDetectionService.processLocationUpdate(locationUpdate);
        } catch (err) {
          console.error("[BackgroundLocation] Error processing location:", err);
        }
      }
    }
  );

  isTaskDefined = true;
  console.log("[BackgroundLocation] Task defined successfully");
}

/**
 * Check if the background location task is registered
 */
export async function isBackgroundLocationTaskRegistered(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
}

/**
 * Unregister the background location task
 */
export async function unregisterBackgroundLocationTask(): Promise<void> {
  const isRegistered = await isBackgroundLocationTaskRegistered();
  if (!isRegistered) {
    return;
  }

  try {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    console.log("[BackgroundLocation] Task unregistered");
  } catch (error) {
    console.error("[BackgroundLocation] Error unregistering task:", error);
  }
}

