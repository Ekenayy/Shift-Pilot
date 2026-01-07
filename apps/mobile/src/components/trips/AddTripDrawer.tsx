import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useState, useRef, useEffect, useMemo } from "react";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { getDistance } from "geolib";
import { colors } from "../../theme/colors";
import type { TripPurpose } from "../../types/database";
import { LocationSearchModal, type LocationData } from "./LocationSearchModal";
import { TripMapPreview } from "./TripMapPreview";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.9;
const DISMISS_THRESHOLD = 150;

interface AddTripDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const CLASSIFICATION_OPTIONS: { value: TripPurpose; label: string }[] = [
  { value: "work", label: "Business" },
  { value: "personal", label: "Personal" },
  { value: "charity", label: "Charity" },
  { value: "medical", label: "Medical" },
];

export function AddTripDrawer({ visible, onClose }: AddTripDrawerProps) {
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const [shouldRender, setShouldRender] = useState(false);

  // Form state
  const [tripDate, setTripDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startLocationData, setStartLocationData] =
    useState<LocationData | null>(null);
  const [endLocationData, setEndLocationData] = useState<LocationData | null>(
    null
  );
  const [classification, setClassification] = useState<TripPurpose | null>(
    null
  );
  const [vehicle, setVehicle] = useState("");
  const [notes, setNotes] = useState("");

  // Location search modal state
  const [locationSearchVisible, setLocationSearchVisible] = useState(false);
  const [locationSearchType, setLocationSearchType] = useState<"start" | "end">(
    "start"
  );

  // Calculate distance using geolib when both locations are set
  const distance = useMemo(() => {
    if (startLocationData && endLocationData) {
      const distanceMeters = getDistance(
        {
          latitude: startLocationData.latitude,
          longitude: startLocationData.longitude,
        },
        {
          latitude: endLocationData.latitude,
          longitude: endLocationData.longitude,
        }
      );
      // Convert meters to miles
      const distanceMiles = distanceMeters / 1609.34;
      return distanceMiles.toFixed(1);
    }
    return "0";
  }, [startLocationData, endLocationData]);

  // Calculate deduction value (simplified - using standard IRS rate)
  const deductionValue = useMemo(() => {
    const miles = parseFloat(distance) || 0;
    // Standard IRS rate for 2024: $0.67 per mile for business
    const rate = classification === "work" ? 0.67 : 0;
    return (miles * rate).toFixed(2);
  }, [distance, classification]);

  // Check if both locations are set for showing map
  const showMap = startLocationData && endLocationData;

  // Reset form when drawer opens
  useEffect(() => {
    if (visible) {
      setTripDate(new Date());
      setStartLocationData(null);
      setEndLocationData(null);
      setClassification(null);
      setVehicle("");
      setNotes("");
    }
  }, [visible]);

  const openLocationSearch = (type: "start" | "end") => {
    setLocationSearchType(type);
    setLocationSearchVisible(true);
  };

  const handleLocationSelect = (location: LocationData) => {
    if (locationSearchType === "start") {
      setStartLocationData(location);
    } else {
      setEndLocationData(location);
    }
  };

  // Pan responder for drag-to-dismiss
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only respond to downward drags
          return gestureState.dy > 0;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > DISMISS_THRESHOLD) {
            closeDrawer();
          } else {
            // Snap back
            Animated.spring(translateY, {
              toValue: 0,
              friction: 8,
              tension: 65,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateY]
  );

  const closeDrawer = () => {
    Animated.timing(translateY, {
      toValue: DRAWER_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShouldRender(false);
      onClose();
    });
  };

  // Check if user has made any changes
  const hasChanges =
    startLocationData !== null ||
    endLocationData !== null ||
    classification !== null ||
    vehicle !== "" ||
    notes !== "";

  const handleClosePress = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Keep editing",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: closeDrawer,
          },
        ]
      );
    } else {
      closeDrawer();
    }
  };

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    } else if (shouldRender) {
      closeDrawer();
    }
  }, [visible]);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTripDate(selectedDate);
    }
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
  };

  if (!shouldRender) return null;

  const formattedDate = format(tripDate, "EEE, dd MMM, h:mm a");
  const formattedTime = format(tripDate, "h:mm a");

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Scrim */}
      <Animated.View
        style={[
          styles.scrim,
          {
            opacity: translateY.interpolate({
              inputRange: [0, DRAWER_HEIGHT],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <Pressable style={styles.scrimPressable} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        {/* Handle bar */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={handleClosePress}>
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Map Preview - shows when both locations are selected */}
          {showMap && (
            <View style={styles.mapContainer}>
              <TripMapPreview
                originLat={startLocationData.latitude}
                originLng={startLocationData.longitude}
                destLat={endLocationData.latitude}
                destLng={endLocationData.longitude}
                height={200}
              />
              <Pressable style={styles.mapExpandButton}>
                <Text style={styles.mapExpandButtonText}>↗</Text>
              </Pressable>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>Add a Drive</Text>

          {/* Date picker field */}
          <Pressable
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputIcon}>📅</Text>
            <Text style={styles.inputText}>{formattedDate}</Text>
            <Text style={styles.chevron}>▼</Text>
          </Pressable>

          {/* Date picker modal */}
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={tripDate}
                mode="datetime"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  style={styles.datePickerDone}
                  onPress={handleCloseDatePicker}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Location inputs */}
          <View style={styles.locationContainer}>
            <Pressable
              style={styles.locationRow}
              onPress={() => openLocationSearch("start")}
            >
              <View style={[styles.locationDot, styles.locationDotStart]} />
              <Text
                style={[
                  styles.locationInput,
                  !startLocationData && styles.locationPlaceholder,
                ]}
                numberOfLines={1}
              >
                {startLocationData?.address || "Enter start location"}
              </Text>
              <Text style={styles.timeLabel}>{formattedTime}</Text>
            </Pressable>
            <View style={styles.locationLine} />
            <Pressable
              style={styles.locationRow}
              onPress={() => openLocationSearch("end")}
            >
              <View style={[styles.locationDot, styles.locationDotEnd]} />
              <Text
                style={[
                  styles.locationInput,
                  !endLocationData && styles.locationPlaceholder,
                ]}
                numberOfLines={1}
              >
                {endLocationData?.address || "Enter end location"}
              </Text>
              {endLocationData && (
                <Text style={styles.timeLabel}>
                  {format(
                    new Date(
                      tripDate.getTime() +
                        (parseFloat(distance) / 30) * 60 * 60 * 1000
                    ),
                    "h:mm a"
                  )}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Classification dropdown */}
          <Pressable style={styles.inputRow}>
            <Text style={styles.inputIcon}>⊙</Text>
            <Text
              style={[
                styles.inputText,
                !classification && styles.inputPlaceholder,
              ]}
            >
              {classification
                ? CLASSIFICATION_OPTIONS.find((o) => o.value === classification)
                    ?.label
                : "Classify as"}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </Pressable>

          {/* Vehicle dropdown */}
          <Pressable style={styles.inputRow}>
            <Text style={styles.inputIcon}>🚗</Text>
            <Text
              style={[styles.inputText, !vehicle && styles.inputPlaceholder]}
            >
              {vehicle || "Choose a vehicle"}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </Pressable>

          {/* Notes */}
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes"
              placeholderTextColor={colors.text.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              editable={false}
            />
          </View>

          {/* Distance display (calculated automatically) */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Distance</Text>
              <View style={styles.metricInputRow}>
                <Text style={styles.metricValue}>{distance}</Text>
                <Text style={styles.metricUnit}>mi</Text>
              </View>
            </View>
          </View>

          {/* Spacer for footer */}
          <View style={styles.footerSpacer} />
        </ScrollView>

        {/* Location Search Modal */}
        <LocationSearchModal
          visible={locationSearchVisible}
          onClose={() => setLocationSearchVisible(false)}
          onSelect={handleLocationSelect}
          type={locationSearchType}
          initialValue={
            locationSearchType === "start"
              ? startLocationData?.address
              : endLocationData?.address
          }
        />

        {/* Sticky footer */}
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerLabel}>
              Value: <Text style={styles.footerValue}>$ {deductionValue}</Text>
            </Text>
            <Text style={styles.footerLabel}>
              Distance:{" "}
              <Text style={styles.footerValue}>{distance || "0"} mi</Text>
            </Text>
          </View>
          <Pressable
            style={[
              styles.addButton,
              parseFloat(distance) === 0 && styles.addButtonDisabled,
            ]}
            disabled={parseFloat(distance) === 0}
          >
            <Text
              style={[
                styles.addButtonText,
                parseFloat(distance) === 0 && styles.addButtonTextDisabled,
              ]}
            >
              Add drive
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  scrimPressable: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: 2,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  mapContainer: {
    marginHorizontal: -20,
    marginTop: -40,
    marginBottom: 16,
    position: "relative",
  },
  mapExpandButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapExpandButtonText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputPlaceholder: {
    color: colors.text.muted,
  },
  chevron: {
    fontSize: 12,
    color: colors.text.muted,
  },
  datePickerContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  datePickerDone: {
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  locationContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationDotStart: {
    backgroundColor: colors.success,
  },
  locationDotEnd: {
    backgroundColor: colors.error,
  },
  locationLine: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginLeft: 5.5,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  locationPlaceholder: {
    color: colors.text.muted,
  },
  timeLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  notesContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 100,
  },
  notesInput: {
    fontSize: 16,
    color: colors.text.primary,
    textAlignVertical: "top",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  metricInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  metricValue: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  metricUnit: {
    fontSize: 16,
    color: colors.text.muted,
  },
  footerSpacer: {
    height: 140,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  footerLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  footerValue: {
    fontWeight: "600",
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  addButtonTextDisabled: {
    color: colors.text.muted,
  },
});

