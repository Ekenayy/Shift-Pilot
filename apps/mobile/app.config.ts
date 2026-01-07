import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Shift Pilot",
  slug: "shift-pilot",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  plugins: [
    "expo-web-browser",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Shift Pilot needs your location to automatically track trips while you drive, even when the app is in the background.",
        locationWhenInUsePermission:
          "Shift Pilot needs your location to track your trips and calculate mileage deductions.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    "expo-sensors",
  ],
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.shiftpilot.mileage",
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Shift Pilot needs your location to automatically track trips while you drive, even when the app is in the background.",
      NSLocationWhenInUseUsageDescription:
        "Shift Pilot needs your location to track your trips and calculate mileage deductions.",
      NSMotionUsageDescription:
        "Shift Pilot uses motion data to detect when you start and stop driving.",
      UIBackgroundModes: ["location", "fetch"],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
    },
    package: "com.shiftpilot.mileage",
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "ACTIVITY_RECOGNITION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
    ],
  },
  extra: {
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  },
});
