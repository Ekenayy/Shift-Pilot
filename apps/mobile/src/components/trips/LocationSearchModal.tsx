import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Constants from "expo-constants";
import { colors } from "../../theme/colors";

export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  type: "start" | "end";
  initialValue?: string;
}

const GOOGLE_PLACES_API_KEY =
  Constants.expoConfig?.extra?.googlePlacesApiKey || "";

export function LocationSearchModal({
  visible,
  onClose,
  onSelect,
  type,
  initialValue = "",
}: LocationSearchModalProps) {
  const title = type === "start" ? "Add start location" : "Add end location";
  const dotColor = type === "start" ? colors.success : colors.error;

  const handlePlaceSelect = (
    data: { description: string; place_id: string },
    details: { geometry: { location: { lat: number; lng: number } } } | null
  ) => {
    if (details) {
      onSelect({
        address: data.description,
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        placeId: data.place_id,
      });
      Keyboard.dismiss();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search input */}
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search for a location"
            onPress={handlePlaceSelect}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: "en",
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            textInputProps={{
              autoFocus: true,
              placeholderTextColor: colors.text.muted,
            }}
            styles={{
              container: {
                flex: 0,
              },
              textInputContainer: {
                backgroundColor: colors.white,
                borderWidth: 2,
                borderColor: colors.accent,
                borderRadius: 12,
                paddingHorizontal: 8,
              },
              textInput: {
                height: 48,
                fontSize: 16,
                color: colors.text.primary,
                backgroundColor: "transparent",
              },
              listView: {
                backgroundColor: colors.white,
                marginTop: 8,
              },
              row: {
                backgroundColor: colors.white,
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
              separator: {
                height: 0,
              },
              description: {
                fontSize: 16,
                color: colors.text.primary,
              },
              predefinedPlacesDescription: {
                color: colors.text.secondary,
              },
            }}
            renderLeftButton={() => (
              <View style={styles.inputIconContainer}>
                <View style={[styles.locationDot, { backgroundColor: dotColor }]} />
              </View>
            )}
            renderRightButton={() => (
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  // The GooglePlacesAutocomplete doesn't expose a clear method easily
                  // This is a visual placeholder
                }}
              >
                <Text style={styles.clearButtonText}>⊗</Text>
              </Pressable>
            )}
            renderRow={(data) => (
              <View style={styles.resultRow}>
                <Text style={styles.resultIcon}>📍</Text>
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {data.structured_formatting?.main_text || data.description}
                  </Text>
                  {data.structured_formatting?.secondary_text && (
                    <Text style={styles.resultSubtitle} numberOfLines={1}>
                      {data.structured_formatting.secondary_text}
                    </Text>
                  )}
                </View>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  placeholder: {
    width: 36,
  },
  searchContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  clearButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 8,
  },
  clearButtonText: {
    fontSize: 20,
    color: colors.text.muted,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultIcon: {
    fontSize: 18,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
  },
  resultSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

