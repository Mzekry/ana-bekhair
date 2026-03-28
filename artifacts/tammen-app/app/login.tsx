import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setUser, contact } = useApp();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailMode, setEmailMode] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 20;

  const navigateAfterLogin = (hasContact: boolean) => {
    if (!hasContact) {
      router.replace("/onboarding");
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleContinue = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("خطأ", "يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const name = email.split("@")[0];
      await setUser({ name, email: email.trim() });
      navigateAfterLogin(!!contact);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await setUser({ name: "أحمد", email: "user@gmail.com" });
      navigateAfterLogin(!!contact);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <LinearGradient
        colors={["#E0F2F1", Colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.top}>
        <View style={styles.iconOuter}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            style={styles.iconInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="volunteer-activism" size={44} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.title}>أنا بخير</Text>
        <Text style={styles.subtitle}>طمّن أهلك وحبايبك</Text>
      </View>

      <View style={styles.formArea}>
        {emailMode ? (
          <>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={Colors.outline}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
              <MaterialIcons
                name="alternate-email"
                size={20}
                color={Colors.outline}
                style={styles.inputIcon}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleContinue}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>متابعة</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEmailMode(false)} style={styles.linkBtn}>
              <Text style={styles.linkText}>رجوع</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="language" size={22} color={Colors.onSurfaceVariant} />
                  <Text style={styles.googleBtnText}>تسجيل الدخول عبر Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setEmailMode(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.primaryBtnText}>الدخول بالبريد الإلكتروني</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.footer}>بالمتابعة، أنت توافق على سياسة الخصوصية</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    gap: 12,
    paddingTop: 30,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  iconInner: {
    width: 86,
    height: 86,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 38,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    fontFamily: "Tajawal_500Medium",
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  formArea: {
    gap: 14,
  },
  inputWrapper: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Tajawal_400Regular",
    paddingVertical: 14,
    textAlign: "right",
    color: Colors.onSurface,
  },
  inputIcon: {
    marginLeft: 8,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
    textAlign: "center",
  },
  googleBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerHighest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleBtnText: {
    fontSize: 17,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  dividerText: {
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    color: Colors.outline,
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    fontFamily: "Tajawal_500Medium",
    color: Colors.onSurfaceVariant,
    textDecorationLine: "underline",
  },
  footer: {
    fontSize: 12,
    fontFamily: "Tajawal_400Regular",
    color: Colors.outline,
    textAlign: "center",
    paddingBottom: 4,
  },
});
