import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus, Alert } from "react-native";
import { locationService } from "../services/location";
import { tripDetectionService } from "../services/location/TripDetectionService";
import { tripService } from "../services/trips";
import { deductionService } from "../services/trips/DeductionService";
import { notificationService } from "../services/notifications";
import type { LocationUpdate } from "../services/location/types";
import type { TripPurpose } from "../types/database";

const ACTIVE_TRIP_KEY = "@shift-pilot:active-trip";
const AUTO_DETECT_KEY = "@shift-pilot:auto-detect-enabled";

// Throttle interval for saving trip to AsyncStorage (30 seconds)
const SAVE_THROTTLE_MS = 30000;

// Minimum trip thresholds for validity
const MIN_TRIP_DISTANCE_METERS = 160; // ~0.1 miles
const MIN_TRIP_DURATION_MS = 60000; // 60 seconds

export interface ActiveTripData {
  startTime: number;
  locations: LocationUpdate[];
  distanceMeters: number;
  mode: "manual" | "auto";
  startLocation: LocationUpdate | null;
}

interface ActiveTripContextType {
  // State
  isTracking: boolean;
  trackingMode: "manual" | "auto" | null;
  autoDetectEnabled: boolean;
  currentTrip: ActiveTripData | null;
  estimatedDeduction: number;

  // Actions
  startManualTrip: () => Promise<void>;
  requestStopTrip: () => void; // Shows confirmation dialog
  confirmStopTrip: () => Promise<void>; // Actually stops the trip
  cancelStopTrip: () => void; // Cancels the stop request
  enableAutoDetect: () => Promise<boolean>;
  disableAutoDetect: () => Promise<void>;
  completeTrip: (purpose: TripPurpose, notes?: string) => Promise<void>;
  discardTrip: () => Promise<void>;

  // UI
  showClassificationModal: boolean;
  setShowClassificationModal: (show: boolean) => void;
  showStopConfirmation: boolean;
  pendingTripData: ActiveTripData | null;
}

const ActiveTripContext = createContext<ActiveTripContextType | null>(null);

export function ActiveTripProvider({ children }: { children: ReactNode }) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingMode, setTrackingMode] = useState<"manual" | "auto" | null>(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<ActiveTripData | null>(null);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [pendingTripData, setPendingTripData] = useState<ActiveTripData | null>(null);
  const [estimatedDeduction, setEstimatedDeduction] = useState(0);
  const [businessRate, setBusinessRate] = useState(0.67); // Default IRS rate

  // Refs for callback handling
  const locationCallbackRef = useRef<((location: LocationUpdate) => void) | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const tripDetectionCallbackRef = useRef<any>(null);

  // Load business rate on mount
  useEffect(() => {
    const loadBusinessRate = async () => {
      try {
        const rates = await deductionService.getDeductionRates();
        const workRate = rates.find((r) => r.purpose === "work");
        if (workRate) {
          setBusinessRate(workRate.rate_per_mile);
        }
      } catch (error) {
        console.error("[ActiveTrip] Error loading business rate:", error);
      }
    };
    loadBusinessRate();
  }, []);

  // Calculate estimated deduction whenever trip distance changes
  useEffect(() => {
    if (currentTrip) {
      const miles = currentTrip.distanceMeters / 1609.34;
      setEstimatedDeduction(miles * businessRate);
    } else {
      setEstimatedDeduction(0);
    }
  }, [currentTrip?.distanceMeters, businessRate]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && currentTrip) {
        // App came to foreground - save trip state
        saveTrip(currentTrip);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [currentTrip]);

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();

    // Cleanup on unmount
    return () => {
      if (locationCallbackRef.current) {
        locationService.removeCallback(locationCallbackRef.current);
      }
      if (tripDetectionCallbackRef.current) {
        tripDetectionService.removeCallback(tripDetectionCallbackRef.current);
      }
    };
  }, []);

  // Load state from AsyncStorage
  const loadPersistedState = async () => {
    try {
      const [tripData, autoDetectData] = await Promise.all([
        AsyncStorage.getItem(ACTIVE_TRIP_KEY),
        AsyncStorage.getItem(AUTO_DETECT_KEY),
      ]);

      // Load auto-detect preference
      if (autoDetectData) {
        const enabled = JSON.parse(autoDetectData);
        setAutoDetectEnabled(enabled);
        if (enabled) {
          // Resume auto-detect mode
          await resumeAutoDetect();
        }
      }

      // Restore active trip if exists
      if (tripData) {
        const trip: ActiveTripData = JSON.parse(tripData);
        setCurrentTrip(trip);
        setIsTracking(true);
        setTrackingMode(trip.mode);

        console.log("[ActiveTrip] Restored trip from storage", {
          mode: trip.mode,
          duration: `${((Date.now() - trip.startTime) / 1000).toFixed(0)}s`,
          locations: trip.locations.length,
        });

        // Resume tracking if manual mode
        if (trip.mode === "manual") {
          await resumeManualTracking();
        }
      }
    } catch (error) {
      console.error("[ActiveTrip] Error loading persisted state:", error);
    }
  };

  // Resume manual tracking after app restart
  const resumeManualTracking = async () => {
    // Set up callback for location updates
    const callback = (location: LocationUpdate) => {
      handleLocationUpdate(location);
    };
    locationCallbackRef.current = callback;
    locationService.addCallback(callback);

    // Start foreground tracking
    await locationService.startTracking();
  };

  // Handle location update for manual/auto tracking
  const handleLocationUpdate = useCallback((location: LocationUpdate) => {
    setCurrentTrip((prev) => {
      if (!prev) return prev;

      const updatedTrip = { ...prev };
      updatedTrip.locations = [...prev.locations, location];

      // Calculate distance from last location
      if (updatedTrip.locations.length > 1) {
        const lastLoc = updatedTrip.locations[updatedTrip.locations.length - 2];
        const distance = haversineDistance(
          lastLoc.coords.latitude,
          lastLoc.coords.longitude,
          location.coords.latitude,
          location.coords.longitude
        );
        updatedTrip.distanceMeters = prev.distanceMeters + distance;
      }

      // Throttled save to AsyncStorage
      const now = Date.now();
      if (now - lastSaveTimeRef.current >= SAVE_THROTTLE_MS) {
        lastSaveTimeRef.current = now;
        saveTrip(updatedTrip);
      }

      return updatedTrip;
    });
  }, []);

  // Save trip to AsyncStorage
  const saveTrip = async (trip: ActiveTripData | null) => {
    try {
      if (trip) {
        await AsyncStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(trip));
      } else {
        await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      }
    } catch (error) {
      console.error("[ActiveTrip] Error saving trip:", error);
    }
  };

  // Save auto-detect preference
  const saveAutoDetectPreference = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(AUTO_DETECT_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error("[ActiveTrip] Error saving auto-detect preference:", error);
    }
  };

  // Start manual trip
  const startManualTrip = useCallback(async () => {
    if (isTracking) {
      console.warn("[ActiveTrip] Already tracking a trip");
      return;
    }

    console.log("[ActiveTrip] Starting manual trip");

    // Get current location as start point
    const startLocation = await locationService.getCurrentLocation();

    const trip: ActiveTripData = {
      startTime: Date.now(),
      locations: startLocation ? [startLocation] : [],
      distanceMeters: 0,
      mode: "manual",
      startLocation,
    };

    setCurrentTrip(trip);
    setIsTracking(true);
    setTrackingMode("manual");

    await saveTrip(trip);

    // Set up callback for location updates
    const callback = (location: LocationUpdate) => {
      handleLocationUpdate(location);
    };
    locationCallbackRef.current = callback;
    locationService.addCallback(callback);

    // Clear location buffer and start tracking
    locationService.clearLocationBuffer();
    await locationService.startTracking();
  }, [isTracking, handleLocationUpdate]);

  // Validate if a trip meets minimum requirements
  const isTripValid = useCallback((trip: ActiveTripData): boolean => {
    const duration = Date.now() - trip.startTime;
    const distance = trip.distanceMeters;

    const isValid =
      duration >= MIN_TRIP_DURATION_MS &&
      distance >= MIN_TRIP_DISTANCE_METERS &&
      trip.locations.length >= 2;

    console.log("[ActiveTrip] Trip validation:", {
      duration: `${(duration / 1000).toFixed(0)}s`,
      distance: `${distance.toFixed(0)}m`,
      locations: trip.locations.length,
      isValid,
    });

    return isValid;
  }, []);

  // Request to stop trip - shows confirmation drawer
  const requestStopTrip = useCallback(() => {
    if (!isTracking || !currentTrip) {
      console.warn("[ActiveTrip] No active trip to stop");
      return;
    }
    setShowStopConfirmation(true);
  }, [isTracking, currentTrip]);

  // Cancel stop request
  const cancelStopTrip = useCallback(() => {
    setShowStopConfirmation(false);
  }, []);

  // Actually stop the trip (called after confirmation)
  const confirmStopTrip = useCallback(async () => {
    setShowStopConfirmation(false);

    if (!isTracking || !currentTrip) {
      console.warn("[ActiveTrip] No active trip to stop");
      return;
    }

    console.log("[ActiveTrip] Stopping trip", { mode: trackingMode });

    // Stop location tracking if manual
    if (trackingMode === "manual") {
      if (locationCallbackRef.current) {
        locationService.removeCallback(locationCallbackRef.current);
        locationCallbackRef.current = null;
      }
      await locationService.stopTracking();
    }

    // Validate trip - auto-discard if too short
    if (!isTripValid(currentTrip)) {
      console.log("[ActiveTrip] Trip too short, auto-discarding");

      const distanceMiles = (currentTrip.distanceMeters / 1609.34).toFixed(2);
      const durationSeconds = Math.floor((Date.now() - currentTrip.startTime) / 1000);

      // Clear everything without showing classification modal
      setCurrentTrip(null);
      setIsTracking(false);
      setTrackingMode(null);
      await saveTrip(null);

      // Show alert explaining why trip was discarded
      Alert.alert(
        "Trip Not Saved",
        `Your trip was too short to save. Trips must be at least 0.1 miles and 60 seconds long.\n\nYour trip: ${distanceMiles} miles, ${durationSeconds} seconds.`,
        [{ text: "OK" }]
      );

      return;
    }

    // Store pending trip data for classification
    setPendingTripData(currentTrip);

    // Clear current tracking state (but keep pendingTripData for classification)
    setCurrentTrip(null);
    setIsTracking(false);
    setTrackingMode(null);

    // Show classification modal
    setShowClassificationModal(true);
  }, [isTracking, trackingMode, currentTrip, isTripValid]);

  // Enable auto-detect mode
  const enableAutoDetect = useCallback(async (): Promise<boolean> => {
    console.log("[ActiveTrip] Enabling auto-detect");

    // Request background permission
    const hasPermission = await locationService.requestBackgroundPermission();
    if (!hasPermission) {
      console.warn("[ActiveTrip] Background permission denied");
      return false;
    }

    setAutoDetectEnabled(true);
    await saveAutoDetectPreference(true);

    // Register background location task
    await locationService.registerBackgroundTask();

    // Set up trip detection callbacks
    const detectionCallback = (
      event: "trip_started" | "trip_stopped",
      data: { locations: LocationUpdate[]; distance: number; duration: number }
    ) => {
      handleTripDetectionEvent(event, data);
    };
    tripDetectionCallbackRef.current = detectionCallback;
    tripDetectionService.addCallback(detectionCallback);

    return true;
  }, []);

  // Disable auto-detect mode
  const disableAutoDetect = useCallback(async () => {
    console.log("[ActiveTrip] Disabling auto-detect");

    setAutoDetectEnabled(false);
    await saveAutoDetectPreference(false);

    // Unregister background location task
    await locationService.unregisterBackgroundTask();

    // Remove trip detection callbacks
    if (tripDetectionCallbackRef.current) {
      tripDetectionService.removeCallback(tripDetectionCallbackRef.current);
      tripDetectionCallbackRef.current = null;
    }
    tripDetectionService.reset();
  }, []);

  // Resume auto-detect on app restart
  const resumeAutoDetect = async () => {
    console.log("[ActiveTrip] Resuming auto-detect");

    // Ensure background task is registered
    await locationService.registerBackgroundTask();

    // Set up trip detection callbacks
    const detectionCallback = (
      event: "trip_started" | "trip_stopped",
      data: { locations: LocationUpdate[]; distance: number; duration: number }
    ) => {
      handleTripDetectionEvent(event, data);
    };
    tripDetectionCallbackRef.current = detectionCallback;
    tripDetectionService.addCallback(detectionCallback);
  };

  // Handle trip detection events (auto mode)
  const handleTripDetectionEvent = useCallback(
    (
      event: "trip_started" | "trip_stopped",
      data: { locations: LocationUpdate[]; distance: number; duration: number }
    ) => {
      if (event === "trip_started") {
        // Don't start auto trip if manual trip is in progress
        if (isTracking && trackingMode === "manual") {
          console.log("[ActiveTrip] Ignoring auto-start, manual trip in progress");
          return;
        }

        console.log("[ActiveTrip] Auto-detected trip started");

        const trip: ActiveTripData = {
          startTime: Date.now() - data.duration,
          locations: data.locations,
          distanceMeters: data.distance,
          mode: "auto",
          startLocation: data.locations[0] || null,
        };

        setCurrentTrip(trip);
        setIsTracking(true);
        setTrackingMode("auto");
        saveTrip(trip);

        // Send push notification that trip started
        notificationService.notifyTripStarted();
      } else if (event === "trip_stopped") {
        console.log("[ActiveTrip] Auto-detected trip stopped", {
          duration: `${(data.duration / 1000).toFixed(0)}s`,
          distance: `${data.distance.toFixed(0)}m`,
        });

        // Store pending trip data
        const pendingTrip: ActiveTripData = {
          startTime: Date.now() - data.duration,
          locations: data.locations,
          distanceMeters: data.distance,
          mode: "auto",
          startLocation: data.locations[0] || null,
        };

        // Calculate potential deduction for notification
        const distanceMiles = data.distance / 1609.34;
        const potentialDeduction = distanceMiles * businessRate;

        setPendingTripData(pendingTrip);
        setCurrentTrip(null);
        setIsTracking(false);
        setTrackingMode(null);
        saveTrip(null);

        // Show classification modal
        setShowClassificationModal(true);

        // Send push notification about completed trip
        notificationService.notifyTripCompleted({
          distanceMiles,
          potentialDeduction,
        });
      }
    },
    [isTracking, trackingMode, businessRate]
  );

  // Complete trip and save to database
  const completeTrip = useCallback(
    async (purpose: TripPurpose, notes?: string) => {
      const tripData = pendingTripData;
      if (!tripData) {
        console.warn("[ActiveTrip] No pending trip to complete");
        return;
      }

      console.log("[ActiveTrip] Completing trip", {
        purpose,
        locations: tripData.locations.length,
        distance: tripData.distanceMeters,
      });

      try {
        // Create trip in database
        await tripService.createTrip({
          locations: tripData.locations,
          purpose,
          source: tripData.mode === "auto" ? "auto_detected" : "manual",
          notes,
        });

        // Clear pending trip
        setPendingTripData(null);
        setShowClassificationModal(false);
        await saveTrip(null);

        console.log("[ActiveTrip] Trip completed successfully");
      } catch (error) {
        console.error("[ActiveTrip] Error completing trip:", error);
        throw error;
      }
    },
    [pendingTripData]
  );

  // Discard current/pending trip
  const discardTrip = useCallback(async () => {
    console.log("[ActiveTrip] Discarding trip");

    // Stop tracking if active
    if (isTracking && trackingMode === "manual") {
      if (locationCallbackRef.current) {
        locationService.removeCallback(locationCallbackRef.current);
        locationCallbackRef.current = null;
      }
      await locationService.stopTracking();
    }

    setCurrentTrip(null);
    setPendingTripData(null);
    setIsTracking(false);
    setTrackingMode(null);
    setShowClassificationModal(false);

    await saveTrip(null);
  }, [isTracking, trackingMode]);

  const value: ActiveTripContextType = {
    isTracking,
    trackingMode,
    autoDetectEnabled,
    currentTrip,
    estimatedDeduction,
    startManualTrip,
    requestStopTrip,
    confirmStopTrip,
    cancelStopTrip,
    enableAutoDetect,
    disableAutoDetect,
    completeTrip,
    discardTrip,
    showClassificationModal,
    setShowClassificationModal,
    showStopConfirmation,
    pendingTripData,
  };

  return (
    <ActiveTripContext.Provider value={value}>
      {children}
    </ActiveTripContext.Provider>
  );
}

export function useActiveTrip(): ActiveTripContextType {
  const context = useContext(ActiveTripContext);
  if (!context) {
    throw new Error("useActiveTrip must be used within an ActiveTripProvider");
  }
  return context;
}

// Haversine distance helper
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
