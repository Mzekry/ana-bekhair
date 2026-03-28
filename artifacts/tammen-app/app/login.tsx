import { Feather } from "@expo/vector-icons";
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

  const colors = Colors.light;

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
      if (contact) {
        router.replace("/home");
      } else {
        router.replace("/onboarding");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await setUser({ name: "مستخدم", email: "user@gmail.com" });
      if (contact) {
        router.replace("/home");
      } else {
        router.replace("/onboarding");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const topPad =
    Platform.OS === "web"
      ? Math.max(insets.top, 67)
      : insets.top;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad + 20,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 20,
        },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primaryBg }]}>
          <Feather name="shield" size={44} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.primary }]}>طمّن أهلك</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          تواصل مع من تحب بضغطة واحدة
        </Text>
      </View>

      <View style={styles.formArea}>
        {emailMode ? (
          <>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleContinue}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>متابعة</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEmailMode(false)}
              style={styles.linkBtn}
            >
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                رجوع
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Feather name="globe" size={20} color={colors.textSecondary} />
                  <Text style={[styles.googleBtnText, { color: colors.text }]}>
                    تسجيل عبر Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={[styles.dividerRow]}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>أو</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => setEmailMode(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>تسجيل عبر البريد الإلكتروني</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={[styles.footer, { color: colors.textMuted }]}>
        بالمتابعة، أنت توافق على سياسة الخصوصية
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    gap: 12,
    paddingTop: 20,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  formArea: {
    gap: 14,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingVertical: 12,
    textAlign: "right",
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  googleBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 10,
  },
  googleBtnText: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
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
  },
  dividerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  footer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingBottom: 8,
  },
});
