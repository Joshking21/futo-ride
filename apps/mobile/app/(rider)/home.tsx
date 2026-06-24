import React, { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Compass, ShieldCheck, MapPin, Search, Navigation, AlertTriangle, Wallet, Menu } from "lucide-react-native";

export default function RiderHome() {
  const router = useRouter();
  const { activeTrip } = useApp();
  const [vehicleType, setVehicleType] = useState<"keke" | "bus">("keke");

  const recentLocations = [
    { name: "SEET Head", desc: "Engineering & Tech Complex" },
    { name: "FUTO Main Gate", desc: "Campus entrance/shuttle park" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background relative" edges={["top"]}>
      {/* Top Overlay Menu */}
      <View className="absolute top-4 left-margin-mobile z-[60] md:hidden">
        <Pressable className="bg-surface text-on-surface p-3 rounded-full shadow-lg flex items-center justify-center border border-outline-variant/30 active:bg-surface-container-low">
          <Menu color="#001caa" size={24} />
        </Pressable>
      </View>

      {/* Top App Bar Balance */}
      <View className="absolute top-4 right-margin-mobile z-[60] flex flex-row gap-md">
        <Pressable
          onPress={() => router.push("/(rider)/payment")}
          className="flex-row items-center gap-1.5 bg-surface px-4 py-2.5 rounded-full border border-outline-variant/30 shadow-lg active:opacity-75"
        >
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 1,850</Text>
        </Pressable>
      </View>

      {/* Map Area */}
      <View className="flex-1 relative z-10 bg-surface-container-low">
        {/* Mock Map Image */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          className="w-full h-full object-cover"
        />

        {/* User Location pulsing dot */}
        <View className="absolute top-[52%] left-[48%] -mt-2 -ml-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />

        {/* Driver Keke 1 */}
        <View className="absolute top-[40%] left-[32%] -mt-4 -ml-4 bg-surface border-2 border-primary w-9 h-9 rounded-lg items-center justify-center shadow-md">
          <Text className="text-lg">🛺</Text>
        </View>

        {/* Driver Keke 2 */}
        <View className="absolute top-[62%] left-[68%] -mt-4 -ml-4 bg-surface border-2 border-primary w-9 h-9 rounded-lg items-center justify-center shadow-md">
          <Text className="text-lg">🛺</Text>
        </View>

        {/* Floating Actions (Right Side) */}
        <View className="absolute bottom-[280px] right-margin-mobile z-20 gap-3">
          {/* Target Location Button */}
          <Pressable className="bg-surface border border-outline-variant/30 text-primary w-12 h-12 rounded-full items-center justify-center shadow-lg active:scale-95">
            <Navigation color="#001caa" size={20} />
          </Pressable>
          {/* Floating SOS Button */}
          <Pressable
            onPress={() => router.push("/sos")}
            className="bg-error-container text-on-error-container w-16 h-16 rounded-full items-center justify-center shadow-lg border border-error/20 active:bg-error active:scale-95"
          >
            <AlertTriangle color="#ba1a1a" size={24} />
            <Text className="font-label-sm text-[10px] font-bold text-error uppercase mt-0.5">SOS</Text>
          </Pressable>
        </View>

        {/* Search & Toggle Panel (Bottom Sheet) */}
        <View className="absolute bottom-4 left-margin-mobile right-margin-mobile bg-surface rounded-2xl p-4 shadow-xl border border-surface-container-highest z-20">
          {/* Where to Search Bar */}
          <View className="flex flex-row gap-2 mb-3">
            <Pressable
              onPress={() => router.push("/(rider)/book")}
              className="flex-1 flex-row items-center bg-surface-container-low border border-outline-variant rounded-full px-4 py-3 gap-3 active:bg-surface-container-high transition-colors"
            >
              <Search color="#444655" size={20} />
              <Text className="text-body-md text-secondary font-medium flex-1">Where to?</Text>
            </Pressable>
          </View>

          {/* Vehicle Type Toggle */}
          <View className="flex flex-row bg-surface-container-low rounded-lg p-1 mb-3">
            <Pressable
              onPress={() => setVehicleType("keke")}
              className={`flex-1 py-2 px-3 rounded-md flex-row items-center justify-center gap-2 ${
                vehicleType === "keke" ? "bg-primary shadow-sm" : "bg-transparent"
              }`}
            >
              <Compass color={vehicleType === "keke" ? "#ffffff" : "#444655"} size={16} />
              <Text className={`font-label-md text-label-md font-bold ${
                vehicleType === "keke" ? "text-on-primary" : "text-on-surface-variant"
              }`}>Keke</Text>
            </Pressable>

            <Pressable
              onPress={() => setVehicleType("bus")}
              className={`flex-1 py-2 px-3 rounded-md flex-row items-center justify-center gap-2 ${
                vehicleType === "bus" ? "bg-primary shadow-sm" : "bg-transparent"
              }`}
            >
              <Compass color={vehicleType === "bus" ? "#ffffff" : "#444655"} size={16} />
              <Text className={`font-label-md text-label-md font-bold ${
                vehicleType === "bus" ? "text-on-primary" : "text-on-surface-variant"
              }`}>Bus</Text>
            </Pressable>
          </View>

          {/* Nearby Status Row */}
          <Pressable
            onPress={() => router.push("/(rider)/book")}
            className="w-full flex-row items-center justify-between pt-3 border-t border-surface-container-highest active:opacity-75"
          >
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <Text className="font-body-md text-body-md text-on-surface">
                <Text className="font-bold">
                  {vehicleType === "keke" ? "8" : "3"}
                </Text>{" "}
                {vehicleType === "keke" ? "Kekes" : "Campus Shuttle buses"} nearby
              </Text>
            </View>
            <Text className="text-secondary">➔</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

