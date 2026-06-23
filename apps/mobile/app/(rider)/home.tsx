import React, { useState } from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Compass, ShieldCheck, MapPin, Search, Navigation, AlertTriangle, Wallet } from "lucide-react-native";

export default function RiderHome() {
  const router = useRouter();
  const { activeTrip } = useApp();
  const [vehicleType, setVehicleType] = useState<"keke" | "bus">("keke");

  const recentLocations = [
    { name: "SEET Head", desc: "Engineering & Tech Complex" },
    { name: "FUTO Main Gate", desc: "Campus entrance/shuttle park" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface relative" edges={["top"]}>
      {/* Top App Bar */}
      <View className="flex-row justify-between items-center px-margin-mobile h-12 bg-surface-container-lowest border-b border-outline-variant/30 z-30">
        <View className="flex-row items-center gap-2">
          <Text className="text-headline-md font-bold text-primary font-jakarta">
            Futo <Text className="text-primary font-black">Ride</Text>
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/payment")}
          className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75"
        >
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 1,850</Text>
        </Pressable>
      </View>

      {/* Map Area */}
      <View className="flex-1 relative bg-surface-container-low z-10">
        {/* Mock Map Image */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          className="w-full h-full object-cover"
        />

        {/* Floating Top Controls */}
        <View className="absolute top-4 left-4 right-4 z-20 items-center gap-2">
          {/* Vehicle Selector */}
          <View className="bg-surface-container-lowest border border-outline-variant/30 p-1.5 rounded-full shadow-md flex-row gap-1">
            <Pressable
              onPress={() => setVehicleType("keke")}
              className={`flex-row items-center gap-2 px-5 py-2 rounded-full ${
                vehicleType === "keke"
                  ? "bg-inverse-surface"
                  : "bg-transparent"
              }`}
            >
              <Compass color={vehicleType === "keke" ? "#eaf1ff" : "#0b1c30"} size={16} />
              <Text
                className={`text-label-sm font-bold uppercase tracking-wider ${
                  vehicleType === "keke" ? "text-inverse-on-surface" : "text-on-surface"
                }`}
              >
                Keke
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setVehicleType("bus")}
              className={`flex-row items-center gap-2 px-5 py-2 rounded-full ${
                vehicleType === "bus"
                  ? "bg-inverse-surface"
                  : "bg-transparent"
              }`}
            >
              <Compass color={vehicleType === "bus" ? "#eaf1ff" : "#0b1c30"} size={16} />
              <Text
                className={`text-label-sm font-bold uppercase tracking-wider ${
                  vehicleType === "bus" ? "text-inverse-on-surface" : "text-on-surface"
                }`}
              >
                Bus
              </Text>
            </Pressable>
          </View>

          {/* Active Status Badge */}
          <View className="bg-surface/90 backdrop-blur-sm border border-outline-variant px-4 py-1.5 rounded-full flex-row items-center gap-2 shadow-sm">
            <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <Text className="text-label-sm font-bold text-on-surface">
              {vehicleType === "keke" ? "8 Kekes nearby" : "3 Campus Shuttle buses nearby"}
            </Text>
          </View>
        </View>

        {/* Map Markers Overlay */}
        {/* User Location pulsing dot */}
        <View className="absolute top-[52%] left-[48%] -mt-2 -ml-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />

        {/* Driver Keke 1 */}
        <View className="absolute top-[40%] left-[32%] -mt-4 -ml-4 bg-surface-container-lowest border-2 border-primary w-8 h-8 rounded-full items-center justify-center shadow-md">
          <Text className="text-[12px]">🛺</Text>
        </View>

        {/* Driver Keke 2 */}
        <View className="absolute top-[62%] left-[68%] -mt-4 -ml-4 bg-surface-container-lowest border-2 border-primary w-8 h-8 rounded-full items-center justify-center shadow-md">
          <Text className="text-[12px]">🛺</Text>
        </View>

        {/* Floating Right Action Buttons */}
        <View className="absolute bottom-[200px] right-margin-mobile z-20 gap-3">
          <Pressable className="bg-surface border border-outline-variant text-primary w-12 h-12 rounded-full items-center justify-center shadow-md active:scale-95">
            <Navigation color="#001caa" size={20} />
          </Pressable>
          <Pressable className="bg-error text-on-error w-14 h-14 rounded-full items-center justify-center shadow-lg active:scale-95">
            <AlertTriangle color="#ffffff" size={24} />
          </Pressable>
        </View>

        {/* Floating Destination Booking Input Sheet */}
        <View className="absolute bottom-4 left-margin-mobile right-margin-mobile bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-lg z-20">
          <Pressable
            onPress={() => router.push("/(rider)/book")}
            className="flex-row items-center bg-surface border border-outline-variant/80 rounded-lg px-4 py-3 gap-3 active:bg-surface-container-low transition-colors"
          >
            <Search color="#001caa" size={20} />
            <Text className="text-body-md text-secondary font-medium flex-1">Where to?</Text>
          </Pressable>

          <View className="mt-4 pt-3 border-t border-outline-variant/30">
            <Text className="text-label-sm text-secondary uppercase font-bold mb-2">Recent Searches</Text>
            {recentLocations.map((loc, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  router.push({
                    pathname: "/(rider)/book",
                    params: { prefillDestination: loc.name }
                  });
                }}
                className="flex-row items-center gap-3 py-2 active:opacity-75"
              >
                <MapPin color="#5b5e66" size={16} />
                <View>
                  <Text className="text-body-md text-on-surface font-semibold">{loc.name}</Text>
                  <Text className="text-[11px] text-secondary">{loc.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
