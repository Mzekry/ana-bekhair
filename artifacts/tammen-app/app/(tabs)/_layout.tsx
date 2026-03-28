import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

function TabIcon({
  icon,
  label,
  focused,
  badge,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  focused: boolean;
  badge?: boolean;
}) {
  return (
    <View
      style={[
        styles.tabItem,
        focused && styles.tabItemActive,
      ]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons
          name={icon}
          size={24}
          color={focused ? "#fff" : Colors.outline}
        />
        {!focused && badge && <View style={styles.badgeDot} />}
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? "#fff" : Colors.outline },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === "web" ? 84 : 72,
          backgroundColor: "rgba(255,255,255,0.85)",
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        },
        tabBarShowLabel: false,
        tabBarBackground: () => null,
      }}
    >
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="settings" label="الإعدادات" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="notifications" label="التنبيهات" focused={focused} badge />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="manage-search" label="جهات الاتصال" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="الرئيسية" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 18,
    minWidth: 70,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.08 }],
  },
  iconWrap: {
    position: "relative",
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Tajawal_500Medium",
    textAlign: "center",
  },
  badgeDot: {
    position: "absolute",
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
});
