import { MaterialIcons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type EmailStep = "email" | "password";
type AuthMode = "signin" | "signup";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { contact, setUser } = useApp();

  const [emailStep, setEmailStep] = useState<EmailStep | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 20;

  const navigateAfterLogin = () => {
    router.replace(contact ? "/(tabs)" : "/onboarding");
  };

  const handleMockLogin = async (name: string, mockEmail: string) => {
    await setUser({ name, email: mockEmail });
    navigateAfterLogin();
  };

  const handleEmailNext = () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("خطأ", "يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setEmailStep("password");
  };

  const handleSubmit = async () => {
    if (!isSupabaseConfigured) {
      await handleMockLogin(email.split("@")[0], email.trim());
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      Alert.alert("خطأ", "كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          if (error.message.includes("Invalid login")) {
            Alert.alert("خطأ في تسجيل الدخول", "البريد الإلكتروني أو كلمة المرور غير صحيحة");
          } else {
            Alert.alert("خطأ", error.message);
          }
          return;
        }
        navigateAfterLogin();
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          Alert.alert("خطأ في إنشاء الحساب", error.message);
          return;
        }
        Alert.alert(
          "تحقق من بريدك",
          "تم إرسال رابط تأكيد إلى بريدك الإلكتروني. يرجى تفعيل حسابك ثم تسجيل الدخول.",
          [{ text: "حسناً", onPress: () => setAuthMode("signin") }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      await handleMockLogin("أحمد", "user@gmail.com");
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: "tammen-app" });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        Alert.alert("خطأ", "تعذر الاتصال بـ Google. يرجى المحاولة مرة أخرى.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);

        const code = url.searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError) {
            navigateAfterLogin();
            return;
          }
        }

        const hash = url.hash.slice(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token") ?? "";
        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!sessionError) {
            navigateAfterLogin();
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (emailStep === "password") {
      setEmailStep("email");
      setPassword("");
      setConfirmPassword("");
    } else {
      setEmailStep(null);
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

      {!isSupabaseConfigured && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info-outline" size={16} color={Colors.secondary} />
          <Text style={styles.demoBannerText}>وضع التجريب — أضف بيانات Supabase لتفعيل المصادقة الحقيقية</Text>
        </View>
      )}

      <View style={styles.formArea}>
        {emailStep === null && (
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
                  <Text style={styles.googleBtnText}>الدخول عبر Google</Text>
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
              onPress={() => setEmailStep("email")}
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

        {emailStep === "email" && (
          <>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>
                {authMode === "signin" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
              </Text>
            </View>

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
                autoFocus
              />
              <MaterialIcons name="alternate-email" size={20} color={Colors.outline} />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleEmailNext}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.primaryBtnText}>متابعة</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <TouchableOpacity
                onPress={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              >
                <Text style={styles.switchLink}>
                  {authMode === "signin" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleBack} style={styles.linkBtn}>
              <Text style={styles.linkText}>رجوع</Text>
            </TouchableOpacity>
          </>
        )}

        {emailStep === "password" && (
          <>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>
                {authMode === "signin" ? "كلمة المرور" : "أنشئ كلمة مرور"}
              </Text>
              <Text style={styles.stepEmail}>{email}</Text>
            </View>

            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={Colors.outline}
                />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                placeholderTextColor={Colors.outline}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textAlign="right"
                autoFocus
              />
              <MaterialIcons name="lock" size={20} color={Colors.outline} />
            </View>

            {authMode === "signup" && (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="تأكيد كلمة المرور"
                  placeholderTextColor={Colors.outline}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
                <MaterialIcons name="lock-outline" size={20} color={Colors.outline} />
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSubmit}
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
                  <Text style={styles.primaryBtnText}>
                    {authMode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBack} style={styles.linkBtn}>
              <Text style={styles.linkText}>رجوع</Text>
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
  demoBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.tertiaryFixed + "88",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  demoBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Tajawal_400Regular",
    color: Colors.secondary,
    textAlign: "right",
    lineHeight: 18,
  },
  formArea: {
    gap: 14,
  },
  stepHeader: {
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
  },
  stepEmail: {
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
  },
  inputWrapper: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Tajawal_400Regular",
    paddingVertical: 14,
    textAlign: "right",
    color: Colors.onSurface,
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
  switchRow: {
    alignItems: "center",
  },
  switchLink: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
    color: Colors.secondary,
    textDecorationLine: "underline",
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 4,
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
