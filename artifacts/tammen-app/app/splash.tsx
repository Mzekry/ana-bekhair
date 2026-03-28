import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function SplashAnimationScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad =
    Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad, paddingBottom: botPad + 48 },
      ]}
    >
      <LinearGradient
        colors={["#E0F2F1", Colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.main}>
        <Animated.View
          style={[
            styles.iconWrap,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconOuter}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={styles.iconInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons
                name="volunteer-activism"
                size={56}
                color="#fff"
              />
            </LinearGradient>
          </View>
          <View style={styles.checkBadge}>
            <MaterialIcons name="check-circle" size={22} color={Colors.secondary} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: "center", gap: 8 }}>
          <Text style={styles.title}>أنا بخير</Text>
          <Text style={styles.subtitle}>طمّن أهلك وحبايبك</Text>
        </Animated.View>

        <View style={styles.loadingTrack}>
          <Animated.View
            style={[
              styles.loadingBar,
              {
                transform: [
                  {
                    translateX: loadingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-80, 80],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pillBadge}>
          <View style={styles.pulsingDot} />
          <Text style={styles.pillText}>نظام المراقبة الذكي مفعل</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  iconWrap: {
    position: "relative",
    marginBottom: 8,
  },
  iconOuter: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-3deg" }],
  },
  checkBadge: {
    position: "absolute",
    bottom: -6,
    left: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 42,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Tajawal_500Medium",
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  loadingTrack: {
    width: 180,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 32,
  },
  loadingBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  footer: {
    alignItems: "center",
  },
  pillBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
    color: Colors.onSurfaceVariant,
  },
});
