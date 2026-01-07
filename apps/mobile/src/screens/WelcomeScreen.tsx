import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useState } from "react";
import { signInWithApple, signInWithGoogle } from "../services/auth";
import type { AuthStackParamList } from "../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const extra = Constants.expoConfig?.extra;

export default function WelcomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useIdTokenAuthRequest({
      iosClientId: extra?.googleIosClientId,
      androidClientId: extra?.googleAndroidClientId,
    });

  const handleAppleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      console.error("Apple sign in error:", error);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle(googleRequest, googlePromptAsync);
    if (error) {
      console.error("Google sign in error:", error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shift Pilot</Text>
        <Text style={styles.subtitle}>Track miles. Save money.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.terms}>
          By signing up for Shift Pilot, you agree to our{" "}
          <Text style={styles.link}>Terms of Service</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>

        <View style={styles.buttons}>
          {/* {Platform.OS === "ios" && (
            <Pressable
              style={[styles.button, styles.appleButton]}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </Pressable>
          )} */}

          <Pressable
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading || !googleRequest}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.emailButton]}
            onPress={() => navigation.navigate("SignUp")}
            disabled={loading}
          >
            <Text style={styles.emailButtonText}>Sign up with email</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>Log in with email</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#ccc",
  },
  footer: {
    gap: 20,
  },
  terms: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  link: {
    textDecorationLine: "underline",
    color: "#aaa",
  },
  buttons: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  appleButton: {
    backgroundColor: "#fff",
  },
  appleIcon: {
    fontSize: 20,
    color: "#000",
  },
  appleButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  googleButton: {
    backgroundColor: "#4a4a4a",
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#fff",
  },
  emailButton: {
    backgroundColor: "#4a4a4a",
  },
  emailButtonText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#fff",
  },
  loginButton: {
    backgroundColor: "#3a3a3a",
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#ccc",
  },
});
