import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

function formatArabicDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "مساءً" : "صباحاً";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  const prefix = isToday ? "اليوم" : "أمس";
  return `${prefix} ${displayHour}:${minutes} ${period}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, contact, lastCheckIn, recordCheckIn } = useApp();
  const colors = Colors.light;

  const [showSuccess, setShowSuccess] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (!contact) {
      router.replace("/onboarding");
    }
  }, [user, contact]);

  const handleCheckIn = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    await recordCheckIn();
    setShowSuccess(true);

    Animated.sequence([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSuccess(false));
  };

  const handleCall = async () => {
    if (!contact?.phone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `tel:${contact.phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("تعذر إجراء المكالمة", "يرجى التحقق من رقم الهاتف");
    }
  };

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad =
    Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 16;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad,
          paddingBottom: botPad,
        },
      ]}
    >
      <View style={[styles.topBar]}>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
        >
          <Feather name="settings" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appTitle, { color: colors.primary }]}>
          طمّن أهلك
        </Text>
      </View>

      <View style={styles.mainArea}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          مرحباً، {user?.name ?? ""}
        </Text>
        <Text style={[styles.prompt, { color: colors.text }]}>
          كيف حالك اليوم؟
        </Text>

        <Animated.View
          style={[
            styles.checkInBtnWrap,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.checkInBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={handleCheckIn}
            testID="check-in-button"
          >
            <Feather name="heart" size={40} color="#fff" />
            <Text style={styles.checkInBtnText}>أنا بخير</Text>
          </Pressable>
        </Animated.View>

        {showSuccess ? (
          <Animated.View
            style={[
              styles.successBanner,
              {
                backgroundColor: colors.success + "22",
                borderColor: colors.success,
                opacity: successOpacity,
              },
            ]}
          >
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>
              تم تسجيل أنك بخير
            </Text>
          </Animated.View>
        ) : lastCheckIn ? (
          <View
            style={[
              styles.lastCheckInBadge,
              { backgroundColor: colors.primaryBg },
            ]}
          >
            <Feather name="clock" size={14} color={colors.primary} />
            <Text
              style={[styles.lastCheckInText, { color: colors.primary }]}
            >
              آخر تسجيل: {formatArabicDate(lastCheckIn)}
            </Text>
          </View>
        ) : (
          <Text style={[styles.noCheckIn, { color: colors.textMuted }]}>
            لم تُسجّل حضورك بعد اليوم
          </Text>
        )}
      </View>

      {contact ? (
        <View
          style={[
            styles.contactCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.contactCardLeft}>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: colors.primary }]}
              onPress={handleCall}
              activeOpacity={0.85}
              testID="call-button"
            >
              <Feather name="phone" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.contactCardRight}>
            <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
              جهة الطوارئ
            </Text>
            <Text style={[styles.contactName, { color: colors.text }]}>
              {contact.name}
            </Text>
            <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
              {contact.phone}
            </Text>
          </View>

          <View
            style={[
              styles.contactAvatar,
              { backgroundColor: colors.primaryBg },
            ]}
          >
            <Text style={[styles.contactInitial, { color: colors.primary }]}>
              {contact.name.charAt(0)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  topBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mainArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  greeting: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  prompt: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  checkInBtnWrap: {
    marginVertical: 16,
  },
  checkInBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  checkInBtnText: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  successBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  successText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  lastCheckInBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lastCheckInText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
  },
  noCheckIn: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  contactCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
  },
  contactCardRight: {
    flex: 1,
    alignItems: "flex-end",
    gap: 3,
  },
  contactCardLeft: {
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  contactLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contactName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  callBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
