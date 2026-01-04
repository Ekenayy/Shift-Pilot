import { View, Text, StyleSheet } from "react-native";

export default function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Placeholder Screen</Text>
      <Text style={styles.subtext}>Add your content here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
});
