import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

export default function IndexScreen() {
  const { user, isLoading } = useApp();
  const colors = Colors.light;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/splash" />;
  }

  return <Redirect href="/(tabs)" />;
}
