import { useRouter } from "expo-router";
import {
  CornerUpRight,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  Star,
  ArrowLeft,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import KekeIcon from "../../components/KekeIcon";

export default function DriverActiveTrip() {
  const router = useRouter();
  const { activeTrip, progressDriverTrip } = useApp();
  const [tripState, setTripState] = useState<
    "arrived" | "start" | "dropoff" | "complete"
  >("arrived");

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

  const getStatusTitle = () => {
    if (tripState === "arrived") return "Navigate to pickup";
    if (tripState === "start") return "Passenger Boarding";
    if (tripState === "dropoff") return "Navigate to destination";
    return "Arrived at destination";
  };

  const getStatusSubtitle = () => {
    if (tripState === "arrived") return "Alex is waiting at SOES Building";
    if (tripState === "start") return "Alex is boarding your Keke";
    if (tripState === "dropoff") return "Drop off Alex at Senate Building";
    return "Complete the trip and generate payment QR";
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top", "bottom"]}>
      {/* Top Navigation Row */}
      <View className="absolute top-4 left-margin-mobile right-margin-mobile flex-row items-center justify-between z-30">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white shadow-md shadow-black/5 items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <View className="bg-white/95 rounded-2xl border border-outline-variant/10 px-4 py-2.5 flex-row items-center gap-2 shadow-sm">
          <View className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <Text className="text-body-sm font-bold text-on-surface font-jakarta">
            Navigating
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/sos")}
          className="w-12 h-12 rounded-2xl bg-error items-center justify-center active:opacity-90 shadow-md"
        >
          <ShieldAlert color="#ffffff" size={24} />
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

        {/* Turn-by-Turn Instruction Card Overlay */}
        <View className="absolute top-20 left-4 right-4 z-40">
          <View className="bg-primary rounded-3xl shadow-md p-5 flex-row items-center gap-4 border border-outline-variant/10">
            <CornerUpRight color="#ffffff" size={28} />
            <View className="flex-1">
              <Text className="text-headline-md font-bold text-white font-jakarta">
                200m
              </Text>
              <Text className="text-body-sm text-white/90 font-jakarta mt-0.5">
                Turn right onto Senate Drive
              </Text>
            </View>
          </View>
        </View>

        {/* Map Location markers */}
        <View className="absolute top-[52%] left-[48%] -mt-3 -ml-3 w-6 h-6 items-center justify-center">
          <View className="absolute w-5 h-5 rounded-full bg-primary/20 scale-125" />
          <View className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-white shadow-sm" />
        </View>
        <View className="absolute top-[42%] left-[32%] -mt-6 -ml-6 bg-white border border-outline-variant/10 w-12 h-12 rounded-2xl items-center justify-center shadow-md">
          <KekeIcon size={28} color="#001caa" />
        </View>
      </View>

      {/* Bottom Sheet Passenger Info & Controls */}
      <View className="bg-white rounded-t-[36px] shadow-xl shadow-black/15 border-t border-outline-variant/10 p-6 gap-5 z-10">
        <View className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto" />

        {/* Trip State Info Header */}
        <View className="flex-col gap-1 pb-1">
          <Text className="text-headline-lg font-bold text-on-surface font-jakarta">
            {getStatusTitle()}
          </Text>
          <Text className="text-body-sm text-secondary font-jakarta">
            {getStatusSubtitle()}
          </Text>
        </View>

        {/* Passenger Profile Row */}
        <View className="bg-surface rounded-3xl p-4 flex-row items-center justify-between border border-outline-variant/10 shadow-sm">
          <View className="flex-row items-center gap-3.5 flex-1 pr-4">
            <View className="relative w-12 h-12 rounded-full overflow-hidden border border-outline-variant/10 bg-white">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                }}
                className="w-full h-full object-cover"
              />
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-bold text-on-surface font-jakarta">Alex</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Star color="#eab308" fill="#eab308" size={13} />
                <Text className="text-body-sm text-secondary font-jakarta font-semibold">4.9 • Student</Text>
              </View>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Pressable className="bg-white w-11 h-11 rounded-2xl items-center justify-center border border-outline-variant/15 shadow-sm active:bg-surface-container">
              <MessageSquare color="#0B1C30" size={18} />
            </Pressable>
            <Pressable className="bg-white w-11 h-11 rounded-2xl items-center justify-center border border-outline-variant/15 shadow-sm active:bg-surface-container">
              <Phone color="#0B1C30" size={18} />
            </Pressable>
          </View>
        </View>

        {/* Route Details Connector Timeline */}
        <View className="bg-surface rounded-3xl p-4 border border-outline-variant/10 shadow-sm relative">
          <View className="absolute left-[25px] top-[26px] bottom-[26px] w-[1px] border-l border-dashed border-outline-variant/30" />

          {/* Pickup */}
          <View className="flex-row items-center gap-3.5 mb-3.5">
            <View className="w-5 h-5 rounded-full bg-primary/15 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-primary" />
            </View>
            <View>
              <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">Pickup Location</Text>
              <Text className="text-body-sm font-bold text-on-surface font-jakarta mt-0.5">
                {activeTrip.pickup || "SOES Building"}
              </Text>
            </View>
          </View>

          {/* Dropoff */}
          <View className="flex-row items-center gap-3.5">
            <View className="w-5 h-5 rounded-full bg-primary/15 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-primary border-2 border-white" />
            </View>
            <View>
              <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">Destination</Text>
              <Text className="text-body-sm font-bold text-on-surface font-jakarta mt-0.5">
                {activeTrip.destination || "Senate Building"}
              </Text>
            </View>
          </View>
        </View>

        {/* Boarding instruction detail for state start */}
        {tripState === "start" && (
          <View className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <Text className="text-body-sm text-secondary font-jakarta text-center">
              Verify boarding by checking payment option or scanning QR code.
            </Text>
          </View>
        )}

        {/* Action Button */}
        <Pressable
          onPress={handleTripAction}
          className="w-full h-14 bg-[#0b1c30] rounded-full flex items-center justify-center shadow-md active:scale-[0.98]"
        >
          <Text className="text-white text-action-lg font-bold font-jakarta">
            {getButtonText()}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
