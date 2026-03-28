import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

export default function SettingsTab() {
  const insets = useSafeAreaInsets();
  const { user, logout, resetData } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = (Platform.OS === "web" ? 84 : 72) + Math.max(insets.bottom, 0) + 16;

  const handleLogout = async () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/splash");
        },
      },
    ]);
  };

  const handleResetData = async () => {
    Alert.alert("حذف البيانات", "سيتم حذف جميع بياناتك. هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await resetData();
          router.replace("/splash");
        },
      },
    ]);
  };

  const userInitial = user?.name?.charAt(0) ?? "أ";

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-forward" size={24} color={Colors.primaryContainer} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View>
            <Text style={styles.profileName}>{user?.name ?? "أحمد عبدالله"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? "ahmed.a@example.com"}</Text>
          </View>
          <View style={styles.profileAvatarWrap}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={styles.profileAvatar}
            >
              <Text style={styles.profileInitial}>{userInitial}</Text>
            </LinearGradient>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#fff" />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>الحساب والأمان</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.4)" }]} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={22} color={Colors.outline} />
            <View style={styles.menuRowContent}>
              <Text style={styles.menuRowTitle}>الحساب</Text>
              <Text style={styles.menuRowSub}>تغيير البريد الإلكتروني وكلمة المرور</Text>
            </View>
            <View style={styles.menuIcon}>
              <MaterialIcons name="alternate-email" size={22} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.4)" }]} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={22} color={Colors.outline} />
            <View style={styles.menuRowContent}>
              <Text style={styles.menuRowTitle}>تغيير البلد</Text>
              <Text style={styles.menuRowSub}>تحديث أرقام الطوارئ وأشخاص الطوارئ</Text>
            </View>
            <View style={styles.menuIcon}>
              <MaterialIcons name="public" size={22} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={22} color={Colors.outline} />
            <View style={styles.menuRowContent}>
              <Text style={styles.menuRowTitle}>الخصوصية والأمان</Text>
              <Text style={styles.menuRowSub}>كيفية استخدام الموقع وبيانات التحقق</Text>
            </View>
            <View style={styles.menuIcon}>
              <MaterialIcons name="shield" size={22} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>التفضيلات</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.outline, true: Colors.primary }}
              thumbColor="#fff"
            />
            <View style={styles.menuRowContent}>
              <Text style={styles.menuRowTitle}>إشعارات التحقق</Text>
              <Text style={styles.menuRowSub}>تلقي تذكيرات دورية للأمان</Text>
            </View>
            <View style={styles.menuIcon}>
              <MaterialIcons name="notifications-active" size={22} color={Colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.privacyBanner}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            style={styles.privacyBannerGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.privacyTitle}>أمانك هو أولويتنا</Text>
            <Text style={styles.privacyText}>
              يتم تشفير كافة بيانات الموقع ولا يتم مشاركتها إلا في حالات الطوارئ القصوى مع الأشخاص الذين حددتهم.
            </Text>
            <TouchableOpacity style={styles.privacyBtn}>
              <Text style={styles.privacyBtnText}>عرض سياسة الخصوصية</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={22} color={Colors.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleResetData}
          activeOpacity={0.8}
        >
          <MaterialIcons name="delete-forever" size={20} color={Colors.error} />
          <Text style={[styles.logoutText, { fontSize: 14 }]}>حذف جميع البيانات</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>الإصدار 1.0.0 • أنا بخير 2025</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.primaryContainer,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  profileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
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
  profileAvatarWrap: {
    position: "relative",
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInitial: {
    fontSize: 26,
    fontFamily: "Tajawal_700Bold",
    color: "#fff",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "right",
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Tajawal_700Bold",
    color: Colors.primary,
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 6,
    marginBottom: -4,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuRowContent: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  menuRowTitle: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "right",
  },
  menuRowSub: {
    fontSize: 12,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
  },
  privacyBanner: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  privacyBannerGrad: {
    padding: 28,
    gap: 10,
  },
  privacyTitle: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    color: "#fff",
    textAlign: "right",
  },
  privacyText: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    color: "rgba(255,255,255,0.88)",
    textAlign: "right",
    lineHeight: 20,
  },
  privacyBtn: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 8,
  },
  privacyBtnText: {
    fontSize: 13,
    fontFamily: "Tajawal_700Bold",
    color: "#fff",
  },
  logoutBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    color: Colors.error,
  },
  deleteBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    opacity: 0.7,
  },
  versionText: {
    fontSize: 11,
    fontFamily: "Tajawal_400Regular",
    color: Colors.outline,
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 1.5,
  },
});
