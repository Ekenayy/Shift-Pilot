import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { useActiveTrip } from "../../context/ActiveTripContext";
import { useTrips } from "../../context/TripsContext";
import type { TripPurpose } from "../../types/database";

interface ClassificationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PurposeOption {
  value: TripPurpose;
  label: string;
  icon: string;
  description: string;
}

const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    value: "work",
    label: "Business",
    icon: "💼",
    description: "Work-related travel",
  },
  {
    value: "personal",
    label: "Personal",
    icon: "🏠",
    description: "Personal errands",
  },
  {
    value: "charity",
    label: "Charity",
    icon: "❤️",
    description: "Volunteer or charity work",
  },
  {
    value: "medical",
    label: "Medical",
    icon: "🏥",
    description: "Medical appointments",
  },
];

export function ClassificationModal({ visible, onClose }: ClassificationModalProps) {
  const { pendingTripData, completeTrip, discardTrip } = useActiveTrip();
  const { refreshTrips } = useTrips();
  const [selectedPurpose, setSelectedPurpose] = useState<TripPurpose | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingTripData) {
    return null;
  }

  const distanceMiles = pendingTripData.distanceMeters / 1609.34;
  const durationMinutes = Math.floor(
    (Date.now() - pendingTripData.startTime) / 60000
  );

  const handleClassify = async () => {
    if (!selectedPurpose) return;

    setIsSubmitting(true);
    try {
      await completeTrip(selectedPurpose, notes.trim() || undefined);
      await refreshTrips();
      resetAndClose();
    } catch (error) {
      console.error("Error classifying trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    await discardTrip();
    resetAndClose();
  };

  const handleClassifyLater = async () => {
    // Save with "unknown" purpose - will show as unclassified
    setIsSubmitting(true);
    try {
      await completeTrip("unknown", notes.trim() || undefined);
      await refreshTrips();
      resetAndClose();
    } catch (error) {
      console.error("Error saving trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedPurpose(null);
    setNotes("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClassifyLater}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleDiscard} style={styles.headerButton}>
              <Text style={styles.discardText}>Discard</Text>
            </Pressable>
            <Text style={styles.title}>Classify Trip</Text>
            <Pressable onPress={handleClassifyLater} style={styles.headerButton}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Trip Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {distanceMiles.toFixed(1)}
                  </Text>
                  <Text style={styles.summaryLabel}>miles</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{durationMinutes}</Text>
                  <Text style={styles.summaryLabel}>min</Text>
                </View>
              </View>
            </View>

            {/* Purpose Selection */}
            <Text style={styles.sectionTitle}>What was this trip for?</Text>
            <View style={styles.purposeGrid}>
              {PURPOSE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.purposeCard,
                    selectedPurpose === option.value && styles.purposeCardSelected,
                  ]}
                  onPress={() => setSelectedPurpose(option.value)}
                >
                  <Text style={styles.purposeIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.purposeLabel,
                      selectedPurpose === option.value &&
                        styles.purposeLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this trip..."
              placeholderTextColor={colors.text.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={[
                styles.classifyButton,
                !selectedPurpose && styles.classifyButtonDisabled,
              ]}
              onPress={handleClassify}
              disabled={!selectedPurpose || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text
                  style={[
                    styles.classifyButtonText,
                    !selectedPurpose && styles.classifyButtonTextDisabled,
                  ]}
                >
                  Save Trip
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  discardText: {
    fontSize: 16,
    color: colors.error,
  },
  laterText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: "right",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryItem: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 12,
  },
  purposeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  purposeCard: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  purposeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent + "20",
  },
  purposeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  purposeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
  },
  purposeLabelSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  classifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  classifyButtonDisabled: {
    backgroundColor: colors.muted,
  },
  classifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  classifyButtonTextDisabled: {
    color: colors.white,
  },
});

