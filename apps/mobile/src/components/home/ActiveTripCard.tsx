import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { useEffect, useRef } from "react";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { colors } from "../../theme/colors";
import { useActiveTrip } from "../../context/ActiveTripContext";
import { useActiveTripTimer } from "../../hooks";

interface ActiveTripCardProps {
  onStopTrip?: () => void;
}

export function ActiveTripCard({ onStopTrip }: ActiveTripCardProps) {
  const {
    currentTrip,
    isTracking,
    trackingMode,
    estimatedDeduction,
    requestStopTrip,
  } = useActiveTrip();

  // Animation for recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Timer hook
  const elapsedTime = useActiveTripTimer(
    currentTrip?.startTime ?? null,
    isTracking
  );

  // Start pulse animation
  useEffect(() => {
    if (isTracking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isTracking, pulseAnim]);

  if (!isTracking || !currentTrip) {
    return null;
  }

  const distanceMiles = currentTrip.distanceMeters / 1609.34;
  const startLocation = currentTrip.startLocation;

  const handleStopTrip = () => {
    requestStopTrip();
    onStopTrip?.();
  };

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{distanceMiles.toFixed(1)}</Text>
          <Text style={styles.statLabel}> miles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.deductionValue}>
            $ {estimatedDeduction.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Trip Status */}
      <View style={styles.statusRow}>
        <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />
        <Text style={styles.statusText}>Trip in progress</Text>
        <Text style={styles.elapsedTime}>{elapsedTime}</Text>
      </View>

      {/* Map showing start location */}
      {startLocation && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: startLocation.coords.latitude,
              longitude: startLocation.coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: startLocation.coords.latitude,
                longitude: startLocation.coords.longitude,
              }}
              pinColor={colors.success}
            />
          </MapView>
        </View>
      )}

      {/* Stop Button */}
      <Pressable style={styles.stopButton} onPress={handleStopTrip}>
        <Text style={styles.stopButtonText}>Stop trip</Text>
      </Pressable>

      {/* Mode indicator */}
      {trackingMode === "auto" && (
        <View style={styles.modeIndicator}>
          <Text style={styles.modeText}>Auto-detected</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  deductionValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.muted,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
  },
  elapsedTime: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.muted,
    fontVariant: ["tabular-nums"],
  },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  stopButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  modeIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.accent + "40",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

