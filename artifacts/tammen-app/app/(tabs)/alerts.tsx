import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function AlertsTab() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = (Platform.OS === "web" ? 84 : 72) + Math.max(insets.bottom, 0) + 16;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>التنبيهات</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.emptyState}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="notifications-none" size={52} color={Colors.primaryFixedDim} />
        </View>
        <Text style={styles.emptyTitle}>لا توجد تنبيهات</Text>
        <Text style={styles.emptySubtitle}>
          ستظهر هنا تنبيهات السلامة والتحقق من الحضور قريباً
        </Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>قريباً</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.primaryContainer,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primaryFixedDim + "33",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 24,
  },
  comingSoonBadge: {
    backgroundColor: Colors.primary + "22",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100,
    marginTop: 8,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: "Tajawal_700Bold",
    color: Colors.primary,
  },
});
