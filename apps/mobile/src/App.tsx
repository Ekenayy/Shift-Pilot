// IMPORTANT: Import and define background task BEFORE any components
// This must be at the top level of the app entry point
import { defineBackgroundLocationTask } from "./services/location/BackgroundLocationHandler";

// Define the background location task before rendering
defineBackgroundLocationTask();

import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./context/AuthContext";
import { TripsProvider } from "./context/TripsContext";
import { ActiveTripProvider } from "./context/ActiveTripContext";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <TripsProvider>
        <ActiveTripProvider>
          <SafeAreaProvider>
            <RootNavigator />
            <StatusBar style="light" />
          </SafeAreaProvider>
        </ActiveTripProvider>
      </TripsProvider>
    </AuthProvider>
  );
}
