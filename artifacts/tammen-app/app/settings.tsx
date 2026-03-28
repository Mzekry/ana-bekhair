import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, contact, logout, resetData } = useApp();
  const colors = Colors.light;

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad =
    Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 16;

  const handleLogout = async () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleResetData = async () => {
    Alert.alert(
      "حذف جميع البيانات",
      "سيتم حذف جميع بياناتك وجهة الاتصال. هل أنت متأكد؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
            await resetData();
            router.replace("/login");
          },
        },
      ]
    );
  };

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
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          الإعدادات
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
        >
          <Feather name="x" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.profileAvatar,
              { backgroundColor: colors.primaryBg },
            ]}
          >
            <Feather name="user" size={28} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name ?? "مستخدم"}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email ?? ""}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          جهة الطوارئ
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {contact ? (
            <View style={styles.contactRow}>
              <TouchableOpacity
                onPress={() => router.push("/edit-contact")}
                style={[
                  styles.editBtn,
                  { backgroundColor: colors.primaryBg },
                ]}
              >
                <Feather name="edit-2" size={16} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.contactDetails}>
                <Text style={[styles.contactName, { color: colors.text }]}>
                  {contact.name}
                </Text>
                <Text
                  style={[
                    styles.contactPhone,
                    { color: colors.textSecondary },
                  ]}
                >
                  {contact.phone}
                </Text>
              </View>
              <View
                style={[
                  styles.contactAvatar,
                  { backgroundColor: colors.primaryBg },
                ]}
              >
                <Text
                  style={[styles.contactInitial, { color: colors.primary }]}
                >
                  {contact.name.charAt(0)}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addContactRow}
              onPress={() => router.push("/onboarding")}
              activeOpacity={0.8}
            >
              <Feather name="plus-circle" size={20} color={colors.primary} />
              <Text style={[styles.addContactText, { color: colors.primary }]}>
                إضافة جهة اتصال
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          الحساب
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: colors.border }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={18} color={colors.textMuted} />
            <View style={styles.menuRowContent}>
              <Text style={[styles.menuRowText, { color: colors.text }]}>
                تسجيل الخروج
              </Text>
            </View>
            <Feather name="log-out" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleResetData}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={18} color={colors.textMuted} />
            <View style={styles.menuRowContent}>
              <Text style={[styles.menuRowText, { color: colors.danger }]}>
                حذف جميع البيانات
              </Text>
            </View>
            <Feather name="trash-2" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          الإصدار 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 20,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    alignItems: "flex-end",
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  contactDetails: {
    flex: 1,
    alignItems: "flex-end",
    gap: 4,
  },
  contactName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addContactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 18,
  },
  addContactText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  menuRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  menuRowContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  menuRowText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
  },
  versionText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 24,
  },
  danger: {
    color: "#EF4444",
  },
});
