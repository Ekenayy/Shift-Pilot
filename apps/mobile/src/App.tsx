import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./context/AuthContext";
import { TripsProvider } from "./context/TripsContext";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <TripsProvider>
        <SafeAreaProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </TripsProvider>
    </AuthProvider>
  );
}
