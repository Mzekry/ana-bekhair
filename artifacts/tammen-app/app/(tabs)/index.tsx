import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const COOLDOWN_MINUTES = 10;

function getMinutesAgo(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
}

function formatArabicDate(isoString: string): string {
  const diff = getMinutesAgo(isoString);
  if (diff < 1) return "منذ لحظات";
  if (diff < 60) return `قبل ${diff} دقيقة`;
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "مساءً" : "صباحاً";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${period}`;
}

function formatCountdown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const { user, contact, lastCheckIn, recordCheckIn } = useApp();

  const [secondsLeft, setSecondsLeft] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = (Platform.OS === "web" ? 84 : 72) + Math.max(insets.bottom, 0) + 16;

  const cooldownActive = secondsLeft > 0;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    function computeSecondsLeft() {
      if (!lastCheckIn) return 0;
      const elapsed = Math.floor((Date.now() - new Date(lastCheckIn).getTime()) / 1000);
      const cooldownSecs = COOLDOWN_MINUTES * 60;
      return Math.max(0, cooldownSecs - elapsed);
    }

    setSecondsLeft(computeSecondsLeft());

    const interval = setInterval(() => {
      const remaining = computeSecondsLeft();
      setSecondsLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastCheckIn]);

  const handleCheckIn = async () => {
    if (cooldownActive) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    await recordCheckIn();
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

  const handleEmergency = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "تنبيه طوارئ",
      "هل أنت متأكد من إرسال تنبيه الطوارئ؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إرسال",
          style: "destructive",
          onPress: () => Alert.alert("تم", "سيتم تفعيل هذه الميزة قريباً"),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          style={styles.profileAvatar}
          onPress={() => router.push("/(tabs)/settings")}
        >
          <MaterialIcons name="account-circle" size={40} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.appName}>أنا بخير</Text>
        <TouchableOpacity style={styles.menuBtn}>
          <MaterialIcons name="menu" size={26} color={Colors.primaryContainer} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetSection}>
          <Text style={styles.greetName}>مرحباً، {user?.name ?? "أحمد"}</Text>
          <Text style={styles.greetSub}>نحن هنا للتأكد من سلامتك اليوم.</Text>
        </View>

        <View style={styles.checkInSection}>
          <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={[
                styles.checkInBtn,
                cooldownActive && styles.checkInBtnDisabled,
              ]}
              onPress={handleCheckIn}
              disabled={cooldownActive}
              testID="check-in-button"
            >
              <MaterialIcons
                name="check-circle"
                size={64}
                color={cooldownActive ? "rgba(255,255,255,0.6)" : "#fff"}
                style={{ marginBottom: 8 }}
              />
              {cooldownActive ? (
                <>
                  <Text style={[styles.checkInText, styles.checkInTextDisabled]}>
                    {formatCountdown(secondsLeft)}
                  </Text>
                  <Text style={styles.cooldownLabel}>انتظر قليلاً</Text>
                </>
              ) : (
                <Text style={styles.checkInText}>أنا بخير</Text>
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                cooldownActive && { backgroundColor: Colors.secondary },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                cooldownActive && { color: Colors.secondary },
              ]}
            >
              {cooldownActive ? "سُجِّل حضورك بنجاح ✓" : "النظام يعمل بشكل طبيعي"}
            </Text>
          </View>

          {lastCheckIn ? (
            <Text style={styles.lastCheckIn}>
              آخر تحديث: {formatArabicDate(lastCheckIn)}
            </Text>
          ) : (
            <Text style={styles.lastCheckIn}>لم تُسجّل حضورك بعد</Text>
          )}

          <View style={styles.footerNote}>
            <MaterialIcons name="info-outline" size={15} color={Colors.onSurfaceVariant} />
            <Text style={styles.footerNoteText}>
              سنُخطر جهة الطوارئ في حال لم تُسجّل حضورك في الوقت المحدد يومياً
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={handleEmergency}
          activeOpacity={0.85}
        >
          <MaterialIcons name="emergency-share" size={22} color="#fff" />
          <Text style={styles.emergencyText}>إرسال تنبيه طوارئ</Text>
        </TouchableOpacity>

        {contact ? (
          <View style={styles.contactSection}>
            <View style={styles.contactSectionHeader}>
              <TouchableOpacity onPress={() => router.push("/(tabs)/contacts")}>
                <Text style={styles.manageText}>إدارة جهات الاتصال</Text>
              </TouchableOpacity>
              <Text style={styles.contactSectionTitle}>شخص الطوارئ الخاص بك</Text>
            </View>

            <View style={styles.contactCard}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={handleCall}
                activeOpacity={0.85}
                testID="call-button"
              >
                <MaterialIcons name="call" size={24} color={Colors.secondary} />
              </TouchableOpacity>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <View style={styles.contactAvatarWrap}>
                <View style={styles.contactAvatarBg}>
                  <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified-user" size={12} color="#fff" />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addContactCta}
            onPress={() => router.push("/(tabs)/contacts")}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person-add" size={22} color={Colors.primary} />
            <Text style={styles.addContactCtaText}>إضافة شخص الطوارئ</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primaryFixedDim,
    overflow: "hidden",
  },
  appName: {
    fontSize: 20,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.primaryContainer,
    textAlign: "center",
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 28,
    paddingTop: 20,
  },
  greetSection: { gap: 4 },
  greetName: {
    fontSize: 30,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "right",
  },
  greetSub: {
    fontSize: 17,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
  },
  checkInSection: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  glowRing: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "rgba(0,121,107,0.1)",
  },
  checkInBtn: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 14,
    borderWidth: 8,
    borderColor: "rgba(0,121,107,0.08)",
  },
  checkInBtnDisabled: {
    backgroundColor: Colors.onSurfaceVariant,
    shadowOpacity: 0.1,
  },
  checkInText: {
    color: "#fff",
    fontSize: 38,
    fontFamily: "Tajawal_800ExtraBold",
    textAlign: "center",
    letterSpacing: 1,
  },
  checkInTextDisabled: {
    fontSize: 32,
  },
  cooldownLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    color: Colors.primary,
  },
  lastCheckIn: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  footerNote: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 340,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
    lineHeight: 18,
  },
  emergencyBtn: {
    backgroundColor: Colors.error,
    borderRadius: 24,
    paddingVertical: 18,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  emergencyText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    textAlign: "center",
  },
  contactSection: { gap: 16 },
  contactSectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  contactSectionTitle: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
  },
  manageText: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
    color: Colors.secondary,
  },
  contactCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  contactAvatarWrap: { position: "relative" },
  contactAvatarBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  contactInitial: {
    fontSize: 28,
    fontFamily: "Tajawal_700Bold",
    color: "#fff",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  contactInfo: {
    flex: 1,
    alignItems: "flex-end",
    gap: 6,
  },
  contactName: {
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "right",
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
  },
  callBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  addContactCta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    backgroundColor: Colors.primaryFixedDim + "66",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primaryFixedDim,
    borderStyle: "dashed",
  },
  addContactCtaText: {
    fontSize: 17,
    fontFamily: "Tajawal_700Bold",
    color: Colors.primary,
  },
});
