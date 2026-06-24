import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Menu, ShieldAlert, Navigation, Star, MessageSquare, Phone, MapPin, ArrowRight, CornerUpRight, ArrowLeft } from "lucide-react-native";

export default function DriverActiveTrip() {
  const router = useRouter();
  const { activeTrip, progressDriverTrip } = useApp();
  const [tripState, setTripState] = useState<"arrived" | "start" | "dropoff" | "complete">("arrived");

  const handleTripAction = () => {
    progressDriverTrip();
    if (tripState === "arrived") {
      setTripState("start");
    } else if (tripState === "start") {
      setTripState("dropoff");
    } else if (tripState === "dropoff") {
      setTripState("complete");
    } else {
      router.push("/(driver)/qr");
    }
  };

  const getButtonText = () => {
    if (tripState === "arrived") return "Arrived at Pickup";
    if (tripState === "start") return "Start Trip";
    if (tripState === "dropoff") return "At Dropoff Location";
    return "Complete Trip (Show QR)";
  };

  const getButtonClass = () => {
    if (tripState === "arrived") return "bg-primary";
    if (tripState === "start") return "bg-inverse-surface";
    if (tripState === "dropoff") return "bg-primary";
    return "bg-success";
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top Navigation */}
      <View className="flex-row justify-between items-center px-4 h-16 bg-surface border-b border-outline-variant z-50">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface border border-outline-variant items-center justify-center">
          <Menu color="#001caa" size={20} />
        </Pressable>
        <View className="bg-surface rounded-full border border-outline-variant px-4 py-1.5 flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <Text className="text-label-md font-bold text-on-surface font-jakarta">Navigating</Text>
        </View>
        <Pressable
          onPress={() => router.push("/sos")}
          className="w-10 h-10 rounded-full bg-error items-center justify-center active:opacity-90"
        >
          <ShieldAlert color="#ffffff" size={20} />
        </Pressable>
      </View>

      {/* Main Map Area */}
      <View className="flex-1 relative z-0">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          className="w-full h-full object-cover"
        />

        {/* Turn-by-Turn Instruction Card */}
        <View className="absolute top-4 left-4 right-4 z-40">
          <View className="bg-primary rounded-xl shadow-lg p-4 flex-row items-center gap-4 border border-primary-container">
            <CornerUpRight color="#ffffff" size={32} />
            <View className="flex-1">
              <Text className="text-headline-md font-bold text-white font-jakarta">200m</Text>
              <Text className="text-body-sm text-white/90 font-jakarta">Turn right onto Senate Drive</Text>
            </View>
          </View>
        </View>

        {/* Map Location markers */}
        <View className="absolute top-[52%] left-[48%] -mt-2 -ml-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />
        <View className="absolute top-[42%] left-[32%] -mt-4 -ml-4 bg-surface-container-lowest border border-outline-variant w-8 h-8 rounded-full items-center justify-center shadow-md">
          <Text className="text-[12px]">🛺</Text>
        </View>
      </View>

      {/* Bottom Sheet containing Passenger Info & Actions */}
      <View className="bg-surface rounded-t-2xl border-t border-outline-variant/60 p-5 gap-4 z-10 pb-8">
        <View className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-1" />

        {/* Passenger Info */}
        <View className="flex-row items-center justify-between border-b border-outline-variant/20 pb-4">
          <View className="flex-row items-center gap-3">
            <View className="relative">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                }}
                className="w-14 h-14 rounded-full object-cover border border-outline-variant/30"
              />
              <View className="absolute bottom-0 right-0 bg-surface rounded-full p-0.5">
                <View className="bg-success w-2.5 h-2.5 rounded-full" />
              </View>
            </View>
            <View>
              <Text className="text-headline-sm font-bold text-on-surface font-jakarta">Alex</Text>
              <View className="flex-row items-center gap-2 mt-0.5">
                <View className="bg-surface-container px-2 py-0.5 rounded flex-row items-center gap-0.5">
                  <Star color="#fbbf24" fill="#fbbf24" size={12} />
                  <Text className="text-label-sm font-bold font-jakarta text-on-surface-variant">4.9</Text>
                </View>
                <Text className="text-body-sm text-secondary font-jakarta">• Student</Text>
              </View>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Pressable className="w-10 h-10 rounded-full bg-surface-container items-center justify-center active:bg-surface-container-high">
              <MessageSquare color="#001caa" size={18} />
            </Pressable>
            <Pressable className="w-10 h-10 rounded-full bg-surface-container items-center justify-center active:bg-surface-container-high">
              <Phone color="#001caa" size={18} fill="#001caa" />
            </Pressable>
          </View>
        </View>

        {/* Trip Details (Waypoints) */}
        <View className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 relative">
          <View className="absolute left-[27px] top-[24px] bottom-[24px] w-0.5 bg-outline-variant" />
          
          {/* Pickup */}
          <View className="flex-row items-start gap-4 mb-4 relative z-10">
            <View className="mt-1 bg-surface-container-lowest rounded-full p-0.5">
              <MapPin color="#001caa" size={16} />
            </View>
            <View>
              <Text className="text-label-sm text-secondary uppercase tracking-wider mb-0.5 font-jakarta">Pickup</Text>
              <Text className="text-body-md font-medium text-on-surface font-jakarta">{activeTrip.pickup || "SOES Building"}</Text>
            </View>
          </View>

          {/* Dropoff */}
          <View className="flex-row items-start relative z-10">
            <View className="mt-1 bg-surface-container-lowest rounded-full p-0.5">
              <MapPin color="#ba1a1a" size={16} />
            </View>
            <View>
              <Text className="text-label-sm text-secondary uppercase tracking-wider mb-0.5 font-jakarta">Dropoff</Text>
              <Text className="text-body-md font-medium text-on-surface font-jakarta">{activeTrip.destination || "Senate Building"}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleTripAction}
          className={`w-full h-14 rounded-xl items-center justify-center shadow-md active:scale-[0.98] transition-all ${getButtonClass()}`}
        >
          <Text className="text-on-primary text-headline-md font-bold font-jakarta">{getButtonText()}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

