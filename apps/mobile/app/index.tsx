import { useRouter } from "expo-router";
import { ArrowRight, Car, Compass, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import "../global.css";

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
    // router.push("/login");
    router.push("/(driver)/home");
    // /(driver)/home
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-container-lowest justify-between px-margin-mobile py-xl relative">
      {/* Decorative subtle background elements */}
      <View
        pointerEvents="none"
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[80px]"
      />
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 w-96 h-96 bg-primary-container/5 rounded-full blur-[80px]"
      />

      <View className="flex-1 justify-center items-center">
        {/* App Logo & Branding */}
        <View className="flex flex-col items-center justify-center">
          {/* Logo Container */}
          <View className="w-24 h-24 rounded-xl bg-primary shadow-lg flex items-center justify-center overflow-hidden mb-6 relative">
            <View className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-container opacity-90" />
            <Car color="#ffffff" size={48} />
          </View>

          {/* Typography */}
          <View className="flex flex-col items-center">
            <Text className="text-headline-xl font-bold text-primary tracking-tight text-center font-jakarta">
              Futo Ride
            </Text>
            <Text className="text-body-md text-secondary max-w-[280px] text-center mt-2 font-jakarta">
              Fast, safe, and reliable rides across FUTO campus.
            </Text>
          </View>
        </View>
      </View>

      {/* Action phase or Loading spinner */}
      {loading ? (
        <View className="w-full justify-center items-center py-8">
          <ActivityIndicator size="large" color="#001caa" />
        </View>
      ) : (
        <View className="w-full gap-4 pb-6 px-2">
          <Text className="text-center text-label-sm uppercase tracking-widest text-secondary font-bold mb-2">
            Select Your Role
          </Text>

          {/* Rider Button */}
          <Pressable
            onPress={() => selectRole("rider")}
            className="w-full bg-primary h-14 rounded-full flex-row items-center justify-center gap-2 shadow-md active:opacity-90 active:scale-[0.98]"
          >
            <Compass color="#ffffff" size={20} />
            <Text className="text-on-primary text-action-lg font-bold">
              Ride as Student (Rider)
            </Text>
            <ArrowRight color="#ffffff" size={16} />
          </Pressable>

          {/* Driver Button */}
          <Pressable
            onPress={() => selectRole("driver")}
            className="w-full bg-surface-container border border-outline-variant h-14 rounded-full flex-row items-center justify-center gap-2 active:opacity-85 active:scale-[0.98]"
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
