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
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { getDistance } from "geolib";
import { colors } from "../../theme/colors";
import type { Trip, TripPurpose, DeductionRate } from "../../types/database";
import { LocationSearchModal, type LocationData } from "./LocationSearchModal";
import { TripMapPreview } from "./TripMapPreview";
import { deductionService } from "../../services/trips";
import { useTrips } from "../../context/TripsContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.9;
const DISMISS_THRESHOLD = 150;

interface EditTripDrawerProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip | null;
}

// Icons for each purpose type
const PURPOSE_ICONS: Record<TripPurpose, string> = {
  work: "💼",
  personal: "🏠",
  charity: "❤️",
  medical: "🏥",
  military: "🎖️",
  mixed: "🔀",
  unknown: "❓",
};

export function EditTripDrawer({ visible, onClose, trip }: EditTripDrawerProps) {
  const { editTrip, deleteTrip } = useTrips();
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

  // Initial values for change detection
  const [initialValues, setInitialValues] = useState<{
    tripDate: Date;
    startLocation: LocationData | null;
    endLocation: LocationData | null;
    classification: TripPurpose | null;
    notes: string;
  } | null>(null);

  // Location search modal state
  const [locationSearchVisible, setLocationSearchVisible] = useState(false);
  const [locationSearchType, setLocationSearchType] = useState<"start" | "end">(
    "start"
  );

  // Classification picker state
  const [classificationPickerVisible, setClassificationPickerVisible] =
    useState(false);
  const [deductionRates, setDeductionRates] = useState<DeductionRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);

  // Saving/deleting state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch deduction rates when drawer opens
  useEffect(() => {
    if (visible) {
      loadDeductionRates();
    }
  }, [visible]);

  const loadDeductionRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const rates = await deductionService.getDeductionRates();
      setDeductionRates(rates);
    } catch (error) {
      console.error("Failed to load deduction rates:", error);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Initialize form with trip data when trip changes or drawer opens
  useEffect(() => {
    if (visible && trip) {
      const date = new Date(trip.started_at);
      const startLoc: LocationData | null =
        trip.origin_lat && trip.origin_lng
          ? {
              latitude: trip.origin_lat,
              longitude: trip.origin_lng,
              address: trip.origin_address || "Unknown location",
              placeId: "", // Not stored in DB, empty for existing trips
            }
          : null;
      const endLoc: LocationData | null =
        trip.dest_lat && trip.dest_lng
          ? {
              latitude: trip.dest_lat,
              longitude: trip.dest_lng,
              address: trip.dest_address || "Unknown location",
              placeId: "", // Not stored in DB, empty for existing trips
            }
          : null;
      const purpose = trip.purpose || null;
      const tripNotes = trip.notes || "";

      setTripDate(date);
      setStartLocationData(startLoc);
      setEndLocationData(endLoc);
      setClassification(purpose);
      setNotes(tripNotes);
      setVehicle("");

      // Store initial values for change detection
      setInitialValues({
        tripDate: date,
        startLocation: startLoc,
        endLocation: endLoc,
        classification: purpose,
        notes: tripNotes,
      });
    }
  }, [visible, trip]);

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

  // Get the selected rate for the current classification
  const selectedRate = useMemo(() => {
    if (!classification) return null;
    return deductionRates.find((r) => r.purpose === classification) || null;
  }, [classification, deductionRates]);

  // Calculate deduction value using actual rates from database
  const deductionValue = useMemo(() => {
    const miles = parseFloat(distance) || 0;
    if (!classification || !selectedRate || miles === 0) {
      return "0";
    }
    return (miles * selectedRate.rate_per_mile).toFixed(2);
  }, [distance, classification, selectedRate]);

  // Check if both locations are set for showing map
  const showMap = startLocationData && endLocationData;

  // Check if user has made any changes compared to initial values
  const hasChanges = useMemo(() => {
    if (!initialValues) return false;

    const dateChanged =
      tripDate.getTime() !== initialValues.tripDate.getTime();

    const startChanged =
      startLocationData?.latitude !== initialValues.startLocation?.latitude ||
      startLocationData?.longitude !== initialValues.startLocation?.longitude ||
      startLocationData?.address !== initialValues.startLocation?.address;

    const endChanged =
      endLocationData?.latitude !== initialValues.endLocation?.latitude ||
      endLocationData?.longitude !== initialValues.endLocation?.longitude ||
      endLocationData?.address !== initialValues.endLocation?.address;

    const classificationChanged =
      classification !== initialValues.classification;

    const notesChanged = notes !== initialValues.notes;

    return (
      dateChanged ||
      startChanged ||
      endChanged ||
      classificationChanged ||
      notesChanged
    );
  }, [
    tripDate,
    startLocationData,
    endLocationData,
    classification,
    notes,
    initialValues,
  ]);

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

  // Handle saving the trip
  const handleSaveTrip = async () => {
    if (!trip || !startLocationData || !endLocationData) return;

    setIsSaving(true);
    try {
      await editTrip(trip.id, {
        startedAt: tripDate,
        originLat: startLocationData.latitude,
        originLng: startLocationData.longitude,
        destLat: endLocationData.latitude,
        destLng: endLocationData.longitude,
        originAddress: startLocationData.address,
        destAddress: endLocationData.address,
        distanceMiles: parseFloat(distance),
        purpose: classification || "unknown",
        notes: notes || undefined,
      });

      closeDrawer();
    } catch (error) {
      console.error("Failed to save trip:", error);
      Alert.alert("Error", "Failed to save trip. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting the trip
  const handleDeleteTrip = () => {
    if (!trip) return;

    Alert.alert(
      "Delete trip?",
      "This action cannot be undone. Are you sure you want to delete this trip?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteTrip(trip.id);
              closeDrawer();
            } catch (error) {
              console.error("Failed to delete trip:", error);
              Alert.alert("Error", "Failed to delete trip. Please try again.", [
                { text: "OK" },
              ]);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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

  const formattedDate = format(tripDate, "EEEE, d MMM, yyyy");
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
            </View>
          )}

          {/* Date and deduction header */}
          <Text style={styles.dateHeader}>{formattedDate}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.deductionDisplay}>
              $ {deductionValue}
            </Text>
            <Text style={styles.distanceDisplay}>
              {distance} mi
            </Text>
          </View>

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
          <Pressable
            style={styles.inputRow}
            onPress={() => setClassificationPickerVisible(true)}
          >
            <Text style={styles.inputIcon}>
              {classification ? PURPOSE_ICONS[classification] : "💼"}
            </Text>
            <Text
              style={[
                styles.inputText,
                !classification && styles.inputPlaceholder,
              ]}
            >
              {selectedRate?.display_name || "Business"}
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
            />
          </View>

          {/* Delete button */}
          <Pressable
            style={styles.deleteButton}
            onPress={handleDeleteTrip}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.deleteButtonText}>Delete trip</Text>
            )}
          </Pressable>

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

        {/* Classification Picker Modal */}
        <Modal
          visible={classificationPickerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setClassificationPickerVisible(false)}
        >
          <SafeAreaView style={styles.classificationModal}>
            <View style={styles.classificationHeader}>
              <Text style={styles.classificationTitle}>Select a purpose</Text>
              <Pressable
                style={styles.classificationCloseButton}
                onPress={() => setClassificationPickerVisible(false)}
              >
                <Text style={styles.classificationCloseButtonText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.classificationList}>
              {ratesLoading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={styles.classificationLoading}
                />
              ) : (
                deductionRates.map((rate) => (
                  <Pressable
                    key={rate.id}
                    style={[
                      styles.classificationOption,
                      classification === rate.purpose &&
                        styles.classificationOptionSelected,
                    ]}
                    onPress={() => {
                      setClassification(rate.purpose);
                      setClassificationPickerVisible(false);
                    }}
                  >
                    <Text style={styles.classificationOptionIcon}>
                      {PURPOSE_ICONS[rate.purpose] || "📍"}
                    </Text>
                    <View style={styles.classificationOptionContent}>
                      <Text style={styles.classificationOptionLabel}>
                        {rate.display_name}
                        {rate.rate_per_mile > 0 && " ($)"}
                      </Text>
                      {rate.description && (
                        <Text style={styles.classificationOptionDescription}>
                          {rate.description}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Sticky footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.saveButton,
              (!hasChanges || isSaving) && styles.saveButtonDisabled,
            ]}
            disabled={!hasChanges || isSaving}
            onPress={handleSaveTrip}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  !hasChanges && styles.saveButtonTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  dateHeader: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 16,
    marginBottom: 24,
  },
  deductionDisplay: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  distanceDisplay: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text.primary,
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
  deleteButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.error,
  },
  footerSpacer: {
    height: 120,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: colors.tabBar.lightInactive,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  saveButtonTextDisabled: {
    color: colors.text.primary,
  },
  // Classification picker styles
  classificationModal: {
    flex: 1,
    backgroundColor: colors.white,
  },
  classificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  classificationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  classificationCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  classificationCloseButtonText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  classificationList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  classificationLoading: {
    marginTop: 40,
  },
  classificationOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  classificationOptionSelected: {
    backgroundColor: colors.background,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  classificationOptionIcon: {
    fontSize: 24,
  },
  classificationOptionContent: {
    flex: 1,
  },
  classificationOptionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
  },
  classificationOptionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
