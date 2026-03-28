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
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <View style={styles.iconWrap}>
        <MaterialIcons
          name={icon}
          size={22}
          color={focused ? "#fff" : Colors.outline}
        />
        {!focused && badge && <View style={styles.badgeDot} />}
      </View>
      <Text
        style={[styles.tabLabel, { color: focused ? "#fff" : Colors.outline }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
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
          height: Platform.OS === "web" ? 88 : 76,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 4,
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
            <TabIcon icon="contacts" label="جهات الاتصال" focused={focused} />
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
    borderRadius: 18,
    width: 82,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.06 }],
  },
  iconWrap: {
    position: "relative",
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Tajawal_500Medium",
    textAlign: "center",
    width: 78,
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
