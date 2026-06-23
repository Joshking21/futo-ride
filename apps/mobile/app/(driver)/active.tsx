import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, MessageSquare, Phone, MapPin, CheckCircle } from "lucide-react-native";

export default function DriverActiveTrip() {
  const router = useRouter();
  const { activeTrip, progressDriverTrip } = useApp();
  const [tripState, setTripState] = useState<"arrived" | "start" | "dropoff" | "complete">("arrived");

  const handleTripAction = () => {
    progressDriverTrip(); // Update state context
    if (tripState === "arrived") {
      setTripState("start");
    } else if (tripState === "start") {
      setTripState("dropoff");
    } else if (tripState === "dropoff") {
      setTripState("complete");
    } else {
      // Completed, redirect to QR code verification
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
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex-row items-center justify-between z-30">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-surface-container">
            <ArrowLeft color="#001caa" size={24} />
          </Pressable>
          <Text className="text-headline-md font-bold text-primary font-jakarta">Active Trip</Text>
        </View>
        <Pressable className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 12,500</Text>
        </Pressable>
      </View>

      {/* Map View */}
      <View className="flex-grow w-full relative z-0 bg-surface-container-low">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          className="w-full h-full object-cover opacity-85"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none" />

        {/* Map Location markers */}
        <View className="absolute top-[52%] left-[48%] -mt-2 -ml-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />
        <View className="absolute top-[42%] left-[32%] -mt-4 -ml-4 bg-surface-container-lowest border-2 border-primary w-8 h-8 rounded-full items-center justify-center shadow-md">
          <Text className="text-[12px]">🛺</Text>
        </View>
      </View>

      {/* Driver Active Trip Card Sheet */}
      <View className="bg-surface rounded-t-2xl shadow-xl border-t border-outline-variant/40 p-margin-mobile gap-4 z-10">
        <View className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-1" />

        {/* Passenger Info Details */}
        <View className="flex-row items-center justify-between border-b border-outline-variant/20 pb-4 mb-2">
          <View className="flex-row items-center gap-3">
            <View className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant bg-surface-container">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                }}
                className="w-full h-full object-cover"
              />
            </View>
            <View>
              <Text className="text-body-lg font-bold text-on-surface">Alex</Text>
              <View className="flex-row items-center gap-2 mt-0.5">
                <Text className="text-[11px] font-bold text-primary">★ 4.9</Text>
                <Text className="text-body-sm text-secondary">• Student</Text>
              </View>
            </View>
          </View>

          {/* Contact shortcuts */}
          <View className="flex-row gap-2">
            <Pressable className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center active:bg-surface-container-high">
              <MessageSquare color="#001caa" size={18} />
            </Pressable>
            <Pressable className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center active:bg-surface-container-high">
              <Phone color="#001caa" size={18} />
            </Pressable>
          </View>
        </View>

        {/* Waypoints */}
        <View className="flex-row items-start gap-3 mb-2">
          <View className="items-center mt-1 w-5">
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            <View className="w-[1px] h-10 bg-outline-variant/30 my-1" />
            <MapPin color="#333640" size={16} />
          </View>
          <View className="flex-col gap-3 flex-1">
            <View>
              <Text className="text-[10px] text-secondary uppercase font-bold">Pickup</Text>
              <Text className="text-body-md font-semibold text-on-surface">SOES Building</Text>
            </View>
            <View>
              <Text className="text-[10px] text-secondary uppercase font-bold">Drop-off</Text>
              <Text className="text-body-md font-semibold text-on-surface">Senate Building</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleTripAction}
          className={`w-full h-14 rounded-xl items-center justify-center shadow-md active:scale-[0.98] transition-all ${getButtonClass()}`}
        >
          <Text className="text-on-primary text-action-lg font-bold">{getButtonText()}</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}
