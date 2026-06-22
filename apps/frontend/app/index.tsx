import { useRouter } from "expo-router";
import { ArrowRight, Compass, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import '../global.css';
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";

export default function Splash() {
  const router = useRouter();
  const { setRole } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const selectRole = (role: "rider" | "driver") => {
    setRole(role);
    router.push("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-container-lowest justify-between px-margin-mobile py-xl relative">
      {/* Decorative Blur Backgrounds — 👑 FIXED: Removed web-only blur properties */}
      <View
        pointerEvents="none"
        className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full"
      />
      <View
        pointerEvents="none"
        className="absolute bottom-20 left-0 w-64 h-64 bg-surface-container-highest/40 rounded-full"
      />

      <View className="flex-1 justify-center items-center">
        {/* App Logo & Branding */}
        {/* 👑 FIXED: Swapped web layout separation spacing logic for standard margin configurations */}
        <View className="flex flex-col items-center justify-center">
          {/* Minimalist Logo Container — 👑 FIXED: Removed md breakpoint restraints */}
          <View className="w-32 h-32 rounded-[2rem] bg-surface shadow-xl border border-outline-variant flex items-center justify-center overflow-hidden mb-6">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9CyhyywKx8di_u_g3bV4Dr8trjVvKajiPhv2HlBhyWQFc-yJi9jDDBO778ZSQg_NtAI96nLfHwaDA7pUpRdE8PpJ-K05IvxNhowMRzhRyXhQv3NTdlbvc7x_nH7V4VATSZ9jGeJEP7-RES6PN2F3WFa5_CUsQTQhRmCdak-As3adXShTYNelc48d8dpuujcJpe5AO17vLS5QE2h7K5WtukgjFlyHKfKr_tRfek91eAIf07ddIymuVAZIW1RqkHEdO2R7sBk5xc1Bq",
              }}
              className="w-full h-full"
              resizeMode="cover" // 👑 FIXED: Replaced web object-cover utility with explicit native configuration prop
              defaultSource={require("../assets/icon.png")}
            />
          </View>

          {/* Typography */}
          <View className="flex flex-col items-center">
            <Text className="text-headline-lg-mobile font-bold text-on-surface tracking-tight text-center">
              Futo{" "}
              <Text className="text-primary" style={{ color: "#001caa" }}>
                Ride
              </Text>
            </Text>
            <Text className="text-body-md text-secondary max-w-[280px] text-center mt-2 font-jakarta">
              Fast, safe, and reliable rides across FUTO campus.
            </Text>
          </View>
        </View>
      </View>

      {/* Action phase or Loading spinner */}
      {loading ? (
        <View className="w-full justify-center items-center py-6">
          <ActivityIndicator size="large" color="#001caa" />
        </View>
      ) : (
        <View className="w-full gap-4 pb-6 px-2">
          <Text className="text-center text-label-sm uppercase tracking-widest text-secondary font-bold mb-2">
            Select Your Role
          </Text>

          {/* Rider Button — 👑 FIXED: Replaced web hover/transition properties with mobile-native active parameters */}
          <Pressable
            onPress={() => selectRole("rider")}
            className="w-full bg-primary h-14 rounded-xl flex-row items-center justify-center gap-2 shadow-lg active:opacity-90 active:scale-[0.98]"
          >
            <Compass color="#ffffff" size={20} />
            <Text className="text-on-primary text-action-lg font-bold">
              Ride as Student (Rider)
            </Text>
            <ArrowRight color="#ffffff" size={16} />
          </Pressable>

          {/* Driver Button — 👑 FIXED: Swapped hover actions for native active opacity responses */}
          <Pressable
            onPress={() => selectRole("driver")}
            className="w-full bg-surface-container border border-outline-variant h-14 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80 active:scale-[0.98]"
          >
            <ShieldCheck color="#001caa" size={20} />
            <Text className="text-primary text-action-lg font-bold">
              Drive Transit (Driver)
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}