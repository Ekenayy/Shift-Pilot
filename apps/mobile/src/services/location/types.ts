import * as Location from "expo-location";

export interface LocationUpdate {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
  };
  timestamp: number;
}

export interface LocationServiceConfig {
  accuracy: Location.Accuracy;
  distanceInterval: number; // meters between updates
  timeInterval: number; // ms between updates
  showsBackgroundLocationIndicator: boolean;
}

export interface PermissionStatus {
  foreground: Location.PermissionStatus;
  background: Location.PermissionStatus;
}

export const DEFAULT_FOREGROUND_CONFIG: LocationServiceConfig = {
  accuracy: Location.Accuracy.High,
  distanceInterval: 10, // 10 meters
  timeInterval: 5000, // 5 seconds
  showsBackgroundLocationIndicator: false,
};

export const DEFAULT_BACKGROUND_CONFIG: LocationServiceConfig = {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 50, // 50 meters (battery optimization)
  timeInterval: 10000, // 10 seconds
  showsBackgroundLocationIndicator: true,
};
