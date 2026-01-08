import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { useActiveTrip } from "../context/ActiveTripContext";
import { locationService } from "../services/location";
import {
  ActiveTripCard,
  ClassificationModal,
  StopTripConfirmation,
} from "../components/home";
import type { PermissionStatus } from "../services/location/types";

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    isTracking,
    autoDetectEnabled,
    enableAutoDetect,
    disableAutoDetect,
    showClassificationModal,
    setShowClassificationModal,
    showStopConfirmation,
    confirmStopTrip,
    cancelStopTrip,
  } = useActiveTrip();

  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isTogglingAutoDetect, setIsTogglingAutoDetect] = useState(false);

  // Check permission status on mount and when returning to screen
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const status = await locationService.getPermissionStatus();
    setPermissionStatus(status);
  };

  const handleAutoDetectToggle = async (value: boolean) => {
    if (isTogglingAutoDetect) return;

    setIsTogglingAutoDetect(true);

    try {
      if (value) {
        const success = await enableAutoDetect();
        if (!success) {
          Alert.alert(
            "Permission Required",
            'Auto-detect needs "Always Allow" location permission to work in the background. Would you like to open Settings?',
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      } else {
        await disableAutoDetect();
      }
    } catch (error) {
      console.error("Error toggling auto-detect:", error);
      Alert.alert("Error", "Failed to toggle auto-detect. Please try again.");
    } finally {
      setIsTogglingAutoDetect(false);
      // Refresh permission status
      checkPermissions();
    }
  };

  const handleFixPermissions = () => {
    Linking.openSettings();
  };

  // Determine if we need to show the permission warning
  const needsPermissionWarning =
    permissionStatus &&
    (permissionStatus.foreground !== "granted" ||
      (autoDetectEnabled && permissionStatus.background !== "granted"));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Trip Card - shows when tracking */}
        {isTracking && <ActiveTripCard />}

        {/* Promo Card - hide when tracking */}
        {!isTracking && (
          <View style={styles.promoCard}>
            <Text style={styles.promoTitle}>💰 GET A BIGGER REFUND</Text>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>Professional</Text>
            </View>
            <Text style={styles.promoText}>Expense sync +</Text>
            <Text style={styles.promoText}>Audit protection</Text>
          </View>
        )}

        {/* Auto Detection Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleLabel}>Automatic Drive Detection</Text>
            {autoDetectEnabled && (
              <Text style={styles.toggleSubtext}>
                Trips will start automatically when you drive
              </Text>
            )}
          </View>
          <View style={styles.toggleRight}>
            <Text style={styles.toggleStatus}>
              {autoDetectEnabled ? "ON" : "OFF"}
            </Text>
            <Switch
              value={autoDetectEnabled}
              onValueChange={handleAutoDetectToggle}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={colors.white}
              disabled={isTogglingAutoDetect}
            />
          </View>
        </View>

        {/* Location Warning Card - show when permissions need attention */}
        {needsPermissionWarning && (
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Text style={styles.warningIconText}>🚗</Text>
            </View>
            <Text style={styles.warningTitle}>
              Location services needs attention!
            </Text>
            <Text style={styles.warningText}>
              We can't track your trips without your location.
            </Text>
            <View style={styles.warningSteps}>
              <Text style={styles.warningStep}>
                1. Set Location permissions to{" "}
                <Text style={styles.link}>Always</Text>
              </Text>
              <Text style={styles.warningStep}>
                2. Enable Precise location <Text style={styles.link}>ON</Text>
              </Text>
              <Text style={styles.warningStep}>
                3. Enable Motion & Fitness <Text style={styles.link}>ON</Text>
              </Text>
            </View>
            <Pressable style={styles.fixButton} onPress={handleFixPermissions}>
              <Text style={styles.fixButtonText}>Fix it in Settings</Text>
            </Pressable>
          </View>
        )}

        {/* Quick Start Card - show when not tracking and auto-detect is off */}
        {!isTracking && !autoDetectEnabled && (
          <View style={styles.quickStartCard}>
            <Text style={styles.quickStartTitle}>Ready to track?</Text>
            <Text style={styles.quickStartText}>
              Enable auto-detect above or tap the + button to start a trip
              manually.
            </Text>
          </View>
        )}

        {/* Mileage Summary */}
        <View style={styles.mileageHeader}>
          <Text style={styles.mileageTitle}>UNCLASSIFIED MILEAGE</Text>
          <Pressable style={styles.periodSelector}>
            <Text style={styles.periodText}>This Year</Text>
            <Text style={styles.periodArrow}>▼</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Stop Trip Confirmation */}
      <StopTripConfirmation
        visible={showStopConfirmation}
        onConfirm={confirmStopTrip}
        onCancel={cancelStopTrip}
      />

      {/* Classification Modal */}
      <ClassificationModal
        visible={showClassificationModal}
        onClose={() => setShowClassificationModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  promoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 12,
  },
  promoBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  promoBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  promoText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "500",
  },
  toggleCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  toggleSubtext: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  toggleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleStatus: {
    fontSize: 14,
    color: colors.text.muted,
  },
  warningCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  warningIconText: {
    fontSize: 40,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
  },
  warningSteps: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  warningStep: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 4,
  },
  link: {
    color: colors.accent,
  },
  fixButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  fixButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  quickStartCard: {
    backgroundColor: colors.accent + "20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent + "40",
  },
  quickStartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  quickStartText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  mileageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  mileageTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  periodText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  periodArrow: {
    fontSize: 10,
    color: colors.text.secondary,
  },
});
