import { supabase } from "./supabaseClient";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra;

export async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) throw error;
      return { data, error: null };
    }

    throw new Error("No identity token received from Apple");
  } catch (error: any) {
    if (error.code === "ERR_REQUEST_CANCELED") {
      return { data: null, error: null };
    }
    return { data: null, error };
  }
}

export async function signInWithGoogle(
  request: Google.GoogleAuthRequestConfig | null,
  promptAsync: () => Promise<any>
) {
  try {
    const result = await promptAsync();

    if (result?.type === "success") {
      const { id_token } = result.params;

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: id_token,
      });

      if (error) throw error;
      return { data, error: null };
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    console.log("Attempting signup for:", email);
    console.log("Supabase Auth:", supabase.auth);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log("Signup response:", { data: !!data, error: error?.message });
    return { data, error };
  } catch (e: any) {
    console.error("Signup exception:", e);
    return { data: null, error: { message: e.message || "Network request failed" } };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    console.log("Attempting login for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("Login response:", { data: !!data, error: error?.message });
    return { data, error };
  } catch (e: any) {
    console.error("Login exception:", e);
    return { data: null, error: { message: e.message || "Network request failed" } };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
