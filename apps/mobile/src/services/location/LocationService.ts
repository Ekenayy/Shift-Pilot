import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import type {
  LocationUpdate,
  LocationServiceConfig,
  PermissionStatus,
} from "./types";
import { DEFAULT_FOREGROUND_CONFIG, DEFAULT_BACKGROUND_CONFIG } from "./types";
import {
  getPermissionStatus,
  requestForegroundPermission,
  requestBackgroundPermission,
  hasForegroundAccess,
} from "./LocationPermissions";
import { BACKGROUND_LOCATION_TASK } from "./BackgroundLocationHandler";

type LocationCallback = (location: LocationUpdate) => void;

class LocationService {
  private static instance: LocationService;
  private locationSubscription: Location.LocationSubscription | null = null;
  private locationBuffer: LocationUpdate[] = [];
  private callbacks: Set<LocationCallback> = new Set();
  private isTracking: boolean = false;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Permission management
  async getPermissionStatus(): Promise<PermissionStatus> {
    return getPermissionStatus();
  }

  async requestForegroundPermission(): Promise<boolean> {
    return requestForegroundPermission();
  }

  async requestBackgroundPermission(): Promise<boolean> {
    return requestBackgroundPermission();
  }

  // Subscribe to location updates
  addCallback(callback: LocationCallback): void {
    this.callbacks.add(callback);
  }

  removeCallback(callback: LocationCallback): void {
    this.callbacks.delete(callback);
  }

  private notifyCallbacks(location: LocationUpdate): void {
    this.callbacks.forEach((callback) => callback(location));
  }

  // Foreground tracking
  async startTracking(
    config: LocationServiceConfig = DEFAULT_FOREGROUND_CONFIG
  ): Promise<boolean> {
    const status = await this.getPermissionStatus();
    if (!hasForegroundAccess(status)) {
      console.warn("[LocationService] No foreground permission");
      return false;
    }

    if (this.isTracking) {
      console.warn("[LocationService] Already tracking");
      return true;
    }

    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: config.accuracy,
          distanceInterval: config.distanceInterval,
          timeInterval: config.timeInterval,
        },
        (location) => {
          const update: LocationUpdate = {
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

          this.locationBuffer.push(update);
          this.notifyCallbacks(update);
        }
      );

      this.isTracking = true;
      console.log("[LocationService] Started foreground tracking");
      return true;
    } catch (error) {
      console.error("[LocationService] Error starting tracking:", error);
      return false;
    }
  }

  async stopTracking(): Promise<LocationUpdate[]> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    this.isTracking = false;
    const buffer = [...this.locationBuffer];
    console.log(
      `[LocationService] Stopped tracking, ${buffer.length} locations recorded`
    );
    return buffer;
  }

  // Location buffer management
  getLocationBuffer(): LocationUpdate[] {
    return [...this.locationBuffer];
  }

  clearLocationBuffer(): void {
    this.locationBuffer = [];
  }

  getIsTracking(): boolean {
    return this.isTracking;
  }

  // Get current location (one-shot)
  async getCurrentLocation(): Promise<LocationUpdate | null> {
    const status = await this.getPermissionStatus();
    if (!hasForegroundAccess(status)) {
      console.warn("[LocationService] No foreground permission");
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
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
    } catch (error) {
      console.error("[LocationService] Error getting current location:", error);
      return null;
    }
  }

  // Background task management
  async registerBackgroundTask(): Promise<boolean> {
    const hasPermission = await this.requestBackgroundPermission();
    if (!hasPermission) {
      console.warn("[LocationService] No background permission");
      return false;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isRegistered) {
      console.log("[LocationService] Background task already registered");
      return true;
    }

    try {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: DEFAULT_BACKGROUND_CONFIG.accuracy,
        distanceInterval: DEFAULT_BACKGROUND_CONFIG.distanceInterval,
        timeInterval: DEFAULT_BACKGROUND_CONFIG.timeInterval,
        showsBackgroundLocationIndicator:
          DEFAULT_BACKGROUND_CONFIG.showsBackgroundLocationIndicator,
        foregroundService: {
          notificationTitle: "Shift Pilot",
          notificationBody: "Tracking your trip in the background",
          notificationColor: "#34435E",
        },
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
      });

      console.log("[LocationService] Background task registered");
      return true;
    } catch (error) {
      console.error(
        "[LocationService] Error registering background task:",
        error
      );
      return false;
    }
  }

  async unregisterBackgroundTask(): Promise<void> {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (!isRegistered) {
      return;
    }

    try {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log("[LocationService] Background task unregistered");
    } catch (error) {
      console.error(
        "[LocationService] Error unregistering background task:",
        error
      );
    }
  }

  // Reverse geocoding
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const addr = results[0];
        const parts = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
        ].filter(Boolean);
        return parts.join(", ") || addr.name || null;
      }

      return null;
    } catch (error) {
      console.error("[LocationService] Reverse geocode error:", error);
      return null;
    }
  }
}

export const locationService = LocationService.getInstance();
