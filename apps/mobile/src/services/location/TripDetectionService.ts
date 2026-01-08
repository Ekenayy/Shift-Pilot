import type { LocationUpdate } from "./types";

// Detection thresholds
const MOVEMENT_SPEED_THRESHOLD = 3; // m/s (~7 mph)
const STATIONARY_SPEED_THRESHOLD = 1; // m/s (~2 mph)
const MOVEMENT_CONFIRMATION_TIME = 60000; // 60 seconds to confirm moving
const STATIONARY_TIMEOUT = 180000; // 3 minutes stationary to end trip
const MIN_TRIP_DURATION = 60000; // 60 seconds minimum
const MIN_TRIP_DISTANCE = 160; // meters (~0.1 miles)

// Detection states
type DetectionState =
  | "IDLE"
  | "POSSIBLY_MOVING"
  | "MOVING"
  | "POSSIBLY_STOPPED";

interface DetectionStateData {
  state: DetectionState;
  stateEnterTime: number;
  tripStartTime: number | null;
  locations: LocationUpdate[];
  totalDistance: number; // meters
}

export type TripDetectionCallback = (
  event: "trip_started" | "trip_stopped",
  data: { locations: LocationUpdate[]; distance: number; duration: number }
) => void;

class TripDetectionService {
  private static instance: TripDetectionService;

  private stateData: DetectionStateData = {
    state: "IDLE",
    stateEnterTime: Date.now(),
    tripStartTime: null,
    locations: [],
    totalDistance: 0,
  };

  private lastProcessedLocation: LocationUpdate | null = null;
  private callbacks: Set<TripDetectionCallback> = new Set();

  private constructor() {}

  static getInstance(): TripDetectionService {
    if (!TripDetectionService.instance) {
      TripDetectionService.instance = new TripDetectionService();
    }
    return TripDetectionService.instance;
  }

  // Add callback for trip events
  addCallback(callback: TripDetectionCallback): void {
    this.callbacks.add(callback);
  }

  // Remove callback
  removeCallback(callback: TripDetectionCallback): void {
    this.callbacks.delete(callback);
  }

  // Notify all callbacks
  private notifyCallbacks(
    event: "trip_started" | "trip_stopped",
    data: { locations: LocationUpdate[]; distance: number; duration: number }
  ): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("[TripDetection] Callback error:", error);
      }
    });
  }

  // Process new location update
  async processLocationUpdate(location: LocationUpdate): Promise<void> {
    const speed = location.coords.speed ?? 0; // m/s
    const now = Date.now();
    const timeInState = now - this.stateData.stateEnterTime;

    switch (this.stateData.state) {
      case "IDLE":
        if (speed > MOVEMENT_SPEED_THRESHOLD) {
          this.transitionTo("POSSIBLY_MOVING", location);
        }
        break;

      case "POSSIBLY_MOVING":
        if (speed > MOVEMENT_SPEED_THRESHOLD) {
          // Still moving, check if confirmed
          if (timeInState >= MOVEMENT_CONFIRMATION_TIME) {
            this.startTrip(location);
          } else {
            // Add location to buffer
            this.addLocation(location);
          }
        } else {
          // Stopped moving, back to idle
          this.transitionTo("IDLE", location);
        }
        break;

      case "MOVING":
        this.addLocation(location);

        if (speed < STATIONARY_SPEED_THRESHOLD) {
          this.transitionTo("POSSIBLY_STOPPED", location);
        }
        break;

      case "POSSIBLY_STOPPED":
        this.addLocation(location);

        if (speed > STATIONARY_SPEED_THRESHOLD) {
          // Started moving again
          this.transitionTo("MOVING", location);
        } else if (timeInState >= STATIONARY_TIMEOUT) {
          // Confirmed stopped
          this.stopTrip();
        }
        break;
    }

    this.lastProcessedLocation = location;
  }

  // Transition to new state
  private transitionTo(newState: DetectionState, location: LocationUpdate): void {
    console.log(
      `[TripDetection] ${this.stateData.state} → ${newState}`,
      `Speed: ${(location.coords.speed ?? 0).toFixed(1)} m/s`
    );

    this.stateData.state = newState;
    this.stateData.stateEnterTime = Date.now();

    if (newState === "IDLE") {
      // Reset buffers when going back to idle
      this.stateData.locations = [];
      this.stateData.totalDistance = 0;
      this.stateData.tripStartTime = null;
    } else if (newState === "POSSIBLY_MOVING") {
      // Start buffering locations
      this.stateData.locations = [location];
      this.stateData.totalDistance = 0;
    }
  }

  // Start trip (POSSIBLY_MOVING → MOVING)
  private startTrip(location: LocationUpdate): void {
    this.stateData.state = "MOVING";
    this.stateData.tripStartTime = Date.now();
    this.stateData.stateEnterTime = Date.now();

    console.log("[TripDetection] Trip started", {
      locationsBuffered: this.stateData.locations.length,
      distance: this.stateData.totalDistance,
    });

    // Notify callbacks
    this.notifyCallbacks("trip_started", {
      locations: [...this.stateData.locations],
      distance: this.stateData.totalDistance,
      duration: 0,
    });
  }

  // Stop trip (POSSIBLY_STOPPED → IDLE or validation failure)
  private stopTrip(): void {
    const tripDuration = this.stateData.tripStartTime
      ? Date.now() - this.stateData.tripStartTime
      : 0;

    console.log("[TripDetection] Trip stopped", {
      duration: `${(tripDuration / 1000).toFixed(0)}s`,
      distance: `${this.stateData.totalDistance.toFixed(0)}m`,
      locations: this.stateData.locations.length,
    });

    // Validate trip
    const isValid =
      tripDuration >= MIN_TRIP_DURATION &&
      this.stateData.totalDistance >= MIN_TRIP_DISTANCE &&
      this.stateData.locations.length >= 2;

    if (isValid) {
      // Valid trip - notify callbacks
      this.notifyCallbacks("trip_stopped", {
        locations: [...this.stateData.locations],
        distance: this.stateData.totalDistance,
        duration: tripDuration,
      });
    } else {
      console.log("[TripDetection] Trip invalid, discarded", {
        duration: `${(tripDuration / 1000).toFixed(0)}s`,
        distance: `${this.stateData.totalDistance.toFixed(0)}m`,
        minDuration: `${MIN_TRIP_DURATION / 1000}s`,
        minDistance: `${MIN_TRIP_DISTANCE}m`,
      });
    }

    // Reset to IDLE
    this.transitionTo("IDLE", this.stateData.locations[this.stateData.locations.length - 1] || this.lastProcessedLocation!);
  }

  // Add location to buffer and update distance
  private addLocation(location: LocationUpdate): void {
    if (this.stateData.locations.length > 0) {
      const lastLocation =
        this.stateData.locations[this.stateData.locations.length - 1];
      const distance = this.haversineDistance(
        lastLocation.coords.latitude,
        lastLocation.coords.longitude,
        location.coords.latitude,
        location.coords.longitude
      );
      this.stateData.totalDistance += distance;
    }

    this.stateData.locations.push(location);
  }

  // Calculate distance between two points using Haversine formula
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get current state (for debugging/UI)
  getState(): DetectionState {
    return this.stateData.state;
  }

  // Get current trip data (if MOVING or POSSIBLY_STOPPED)
  getCurrentTripData(): {
    isActive: boolean;
    locations: LocationUpdate[];
    distance: number;
    duration: number;
  } | null {
    if (
      this.stateData.state === "MOVING" ||
      this.stateData.state === "POSSIBLY_STOPPED"
    ) {
      const duration = this.stateData.tripStartTime
        ? Date.now() - this.stateData.tripStartTime
        : 0;

      return {
        isActive: true,
        locations: [...this.stateData.locations],
        distance: this.stateData.totalDistance,
        duration,
      };
    }

    return null;
  }

  // Reset detection state (use when manually starting/stopping)
  reset(): void {
    console.log("[TripDetection] Manual reset");
    this.stateData = {
      state: "IDLE",
      stateEnterTime: Date.now(),
      tripStartTime: null,
      locations: [],
      totalDistance: 0,
    };
    this.lastProcessedLocation = null;
  }
}

export const tripDetectionService = TripDetectionService.getInstance();
