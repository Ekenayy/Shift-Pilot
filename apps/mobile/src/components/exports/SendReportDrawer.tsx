import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { colors } from "../../theme/colors";
import { ExportService } from "../../services/exports/ExportService";
import { useAuth } from "../../context/AuthContext";
import type { TripPurpose } from "../../types/database";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = 150;

type TripFilter = "work" | "personal" | "all";

interface SendReportDrawerProps {
  visible: boolean;
  onClose: () => void;
  periodStart: Date;
  periodEnd: Date;
  tripCounts: {
    business: number;
    personal: number;
    total: number;
  };
}

interface Recipient {
  id: string;
  name: string;
  email: string;
}

export function SendReportDrawer({
  visible,
  onClose,
  periodStart,
  periodEnd,
  tripCounts,
}: SendReportDrawerProps) {
  const { user } = useAuth();
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const [shouldRender, setShouldRender] = useState(false);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<TripFilter>("all");

  // Sending states
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // Recipients (for now just "Myself")
  const recipients: Recipient[] = [
    {
      id: "myself",
      name: "Myself only",
      email: user?.email || "",
    },
  ];

  // Pan responder for swipe-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
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
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  // Open/close animations
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: DRAWER_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  const closeDrawer = () => {
    Animated.timing(translateY, {
      toValue: DRAWER_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSend = async (recipient: Recipient) => {
    if (!user?.email) {
      Alert.alert("Error", "User email not found");
      return;
    }

    try {
      setSendingTo(recipient.id);

      // Map filter to purposes array and description
      let purposes: string[] | undefined;
      let filterDescription: string;

      if (selectedFilter === "work") {
        purposes = ["work"];
        filterDescription = "Business Drives";
      } else if (selectedFilter === "personal") {
        purposes = ["personal"];
        filterDescription = "Personal Drives";
      } else {
        purposes = undefined; // "all" - no filter
        filterDescription = "All Drives";
      }

      // Prepare the request
      const request = {
        period_start: format(periodStart, "yyyy-MM-dd"),
        period_end: format(periodEnd, "yyyy-MM-dd"),
        format: "both" as const,
        email: recipient.email,
        purposes,
        filter_description: filterDescription,
      };

      // Call the export service
      const response = await ExportService.exportTrips(request);

      // Show success message with filter info
      const filterText = selectedFilter === "all"
        ? "all drives"
        : selectedFilter === "work"
          ? "business drives only"
          : "personal drives only";

      Alert.alert(
        "Report Sent!",
        `Your ${format(periodStart, "MMMM yyyy")} report (${filterText}) has been sent to ${recipient.email}. Check your inbox!`,
        [{ text: "OK", onPress: closeDrawer }]
      );
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send report. Please try again."
      );
    } finally {
      setSendingTo(null);
    }
  };

  const getFilterCount = (filter: TripFilter): number => {
    switch (filter) {
      case "work":
        return tripCounts.business;
      case "personal":
        return tripCounts.personal;
      case "all":
        return tripCounts.total;
    }
  };

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeDrawer}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} />

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
            {/* Drag Handle */}
            <View {...panResponder.panHandlers} style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={closeDrawer}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>

            {/* Title */}
            <Text style={styles.title}>{format(periodStart, "MMMM yyyy")} report</Text>

            {/* Step 1: Filter */}
            <View style={styles.section}>
              <Text style={styles.stepLabel}>
                <Text style={styles.stepNumber}>Step 1:</Text> Choose which drives to send
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterButtonsContent}
              >
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedFilter === "work" && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedFilter("work")}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === "work" && styles.filterButtonTextActive,
                    ]}
                  >
                    Business
                  </Text>
                  <Text
                    style={[
                      styles.filterButtonCount,
                      selectedFilter === "work" && styles.filterButtonCountActive,
                    ]}
                  >
                    {getFilterCount("work")}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    selectedFilter === "personal" && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedFilter("personal")}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === "personal" && styles.filterButtonTextActive,
                    ]}
                  >
                    Personal
                  </Text>
                  <Text
                    style={[
                      styles.filterButtonCount,
                      selectedFilter === "personal" && styles.filterButtonCountActive,
                    ]}
                  >
                    {getFilterCount("personal")}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    selectedFilter === "all" && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedFilter("all")}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === "all" && styles.filterButtonTextActive,
                    ]}
                  >
                    All Drives
                  </Text>
                  <Text
                    style={[
                      styles.filterButtonCount,
                      selectedFilter === "all" && styles.filterButtonCountActive,
                    ]}
                  >
                    {getFilterCount("all")}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>

            {/* Step 2: Recipients */}
            <View style={styles.section}>
              <Text style={styles.stepLabel}>
                <Text style={styles.stepNumber}>Step 2:</Text> Pick who gets the report
              </Text>

              <View style={styles.recipients}>
                {recipients.map((recipient) => (
                  <View key={recipient.id} style={styles.recipientRow}>
                    <View style={styles.recipientInfo}>
                      <View style={styles.avatarIcon}>
                        <Text style={styles.avatarText}>👤</Text>
                      </View>
                      <Text style={styles.recipientName}>{recipient.name}</Text>
                    </View>

                    <Pressable
                      style={[
                        styles.sendButton,
                        sendingTo === recipient.id && styles.sendButtonDisabled,
                      ]}
                      onPress={() => handleSend(recipient)}
                      disabled={sendingTo !== null}
                    >
                      {sendingTo === recipient.id ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                      )}
                    </Pressable>
                  </View>
                ))}

                {/* Add Contact Button (not functional yet) */}
                <Pressable style={styles.addContactButton} disabled>
                  <Text style={styles.addContactIcon}>+</Text>
                  <Text style={styles.addContactText}>Add Contact</Text>
                </Pressable>
              </View>
            </View>

            {/* Info Message */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                When sharing a report with someone else, we'll also send you a copy
              </Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: DRAWER_HEIGHT,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: "300",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text.primary,
    marginTop: 48,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 16,
  },
  stepNumber: {
    fontWeight: "600",
  },
  filterButtonsContent: {
    gap: 12,
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.text.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  filterButtonCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  filterButtonCountActive: {
    color: colors.white,
  },
  recipients: {
    gap: 16,
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
  },
  sendButton: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 100,
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  addContactIcon: {
    fontSize: 20,
    color: "#1E88E5",
    fontWeight: "600",
  },
  addContactText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E88E5",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: "auto",
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
