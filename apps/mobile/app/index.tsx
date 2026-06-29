import { useRouter } from "expo-router";
import { ArrowRight, Compass, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import KekeIcon from "../components/KekeIcon";
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
    router.push("/(rider)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright justify-between px-margin-mobile py-xl relative">
      {/* Map outline background image */}
      <Image
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
        }}
        className="absolute inset-0 opacity-[0.07] object-cover"
        resizeMode="cover"
      />

      <View className="flex-1 justify-center items-center">
        {/* App Logo & Branding */}
        <View className="flex flex-col items-center justify-center">
          {/* Logo Container */}
          <View className="w-28 h-28 rounded-3xl bg-white shadow-xl shadow-black/5 flex items-center justify-center border border-outline-variant/20 mb-6">
            <KekeIcon size={76} color="#001caa" />
          </View>

          {/* Typography */}
          <View className="flex flex-col items-center">
            <Text className="text-headline-xl font-bold text-on-surface tracking-tight text-center font-jakarta">
              Futo <Text className="text-primary">Ride</Text>
            </Text>
            <Text className="text-body-md text-secondary max-w-[280px] text-center mt-2 font-jakarta">
              Move better. Live better.
            </Text>
          </View>
        </View>
      </View>

      {/* Action phase or Loading spinner */}
      {loading ? (
        <View className="w-full justify-center items-center py-8">
          <ActivityIndicator size="large" color="#001caa" className="scale-110" />
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
