import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { APP_NAME } from "@shift-pilot/shared";
import { useAuth } from "../context/AuthContext";
import type { AppStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.buttons}>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("Placeholder")}
        >
          <Text style={styles.buttonText}>Go to Placeholder</Text>
        </Pressable>

        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  buttons: {
    gap: 16,
    width: "100%",
    maxWidth: 300,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: "#FF3B30",
    fontSize: 16,
  },
});
