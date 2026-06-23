import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, AlertTriangle, Phone, ShieldAlert, CheckCircle2 } from "lucide-react-native";

export default function LiveTracking() {
  const router = useRouter();
  const { activeTrip, cancelBooking, completeTrip } = useApp();
  const [driverState, setDriverState] = useState<"assigned" | "arriving" | "arrived">("arriving");
  const [progressWidth, setProgressWidth] = useState<any>("33%");

  useEffect(() => {
    // Simulate real-time tracking progression
    const timer1 = setTimeout(() => {
      setDriverState("arriving");
      setProgressWidth("66%");
    }, 3000);

    const timer2 = setTimeout(() => {
      setDriverState("arrived");
      setProgressWidth("100%");
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleCancel = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel your ride?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelBooking();
            router.replace("/(rider)/home");
          },
        },
      ]
    );
  };

  const handleVerifyComplete = () => {
    // Complete the trip and push history
    completeTrip();
    router.replace("/(rider)/receipt");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-margin-mobile h-touch-target bg-surface border-b border-outline-variant/30 z-30">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => {
              cancelBooking();
              router.replace("/(rider)/home");
            }}
            className="p-2 -ml-2 rounded-full active:bg-surface-container"
          >
            <ArrowLeft color="#001caa" size={24} />
          </Pressable>
          <Text className="text-headline-md font-bold text-primary font-jakarta">Live Tracking</Text>
        </View>
        <Pressable className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 1,850</Text>
        </Pressable>
      </View>

      {/* Map Content */}
      <View className="flex-1 relative z-0">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          className="w-full h-full object-cover opacity-80"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none" />

        {/* Pulsing Driver Location Marker */}
        {driverState !== "arrived" && (
          <View className="absolute top-[42%] left-[49%] -mt-4 -ml-4 bg-primary rounded-full p-2 border-2 border-white shadow-lg items-center justify-center">
            <Text className="text-[14px]">🛺</Text>
          </View>
        )}

        {/* Pulsing User/Pickup Location Marker */}
        <View className="absolute top-[55%] left-[45%] -mt-2 -ml-2 w-4.5 h-4.5 bg-secondary rounded-full border-2 border-white shadow-md" />

        {/* Floating SOS button */}
        <Pressable className="absolute right-margin-mobile bottom-[280px] bg-error text-on-error w-14 h-14 rounded-full items-center justify-center shadow-lg active:scale-95">
          <ShieldAlert color="#ffffff" size={24} />
        </Pressable>
      </View>

      {/* Bottom Information Sheet */}
      <View className="bg-surface w-full rounded-t-2xl shadow-xl border-t border-outline-variant/50 p-margin-mobile gap-4 z-10">
        <View className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-1" />

        {/* Header Status */}
        <View className="flex-row justify-between items-end mb-2">
          <View>
            <Text className="text-headline-lg-mobile font-bold text-on-surface">
              {driverState === "assigned"
                ? "Assigned"
                : driverState === "arriving"
                ? "Arriving"
                : "Arrived"}
            </Text>
            <Text className="text-body-sm text-primary font-bold mt-0.5">
              {driverState === "arrived" ? "Driver has reached pickup roundabout" : "in 2 mins"}
            </Text>
          </View>
        </View>

        {/* Trip Progress Bar */}
        <View className="w-full">
          <View className="relative w-full h-2 bg-surface-container rounded-full overflow-hidden mb-3">
            <View style={{ width: progressWidth }} className="absolute top-0 left-0 h-full bg-primary rounded-full" />
          </View>
          <View className="flex-row justify-between px-1">
            <Text className={`text-[10px] font-bold ${driverState === "assigned" || driverState === "arriving" || driverState === "arrived" ? "text-primary" : "text-secondary"}`}>ASSIGNED</Text>
            <Text className={`text-[10px] font-bold ${driverState === "arriving" || driverState === "arrived" ? "text-primary" : "text-secondary"}`}>ARRIVING</Text>
            <Text className={`text-[10px] font-bold ${driverState === "arrived" ? "text-primary" : "text-secondary"}`}>ARRIVED</Text>
          </View>
        </View>

        {/* Driver Card */}
        <View className="flex-row items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
          <View className="flex-row items-center gap-3">
            <View className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-surface-container">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
                }}
                className="w-full h-full object-cover"
              />
            </View>
            <View>
              <Text className="text-body-lg font-bold text-on-surface">Chidi</Text>
              <View className="flex-row items-center gap-2 mt-0.5">
                <Text className="bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded text-[11px] font-semibold">
                  ABJ-123-XY
                </Text>
                <Text className="text-body-sm text-secondary">• Keke Blue</Text>
              </View>
            </View>
          </View>
          <Pressable className="w-11 h-11 rounded-full bg-primary-container text-primary items-center justify-center shadow-sm active:scale-95">
            <Phone color="#ffffff" size={20} />
          </Pressable>
        </View>

        {/* Action Panel */}
        <View className="items-center mt-2">
          {driverState === "arrived" ? (
            <Pressable
              onPress={handleVerifyComplete}
              className="w-full bg-success hover:bg-success/80 h-14 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-success/10 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 color="#ffffff" size={20} />
              <Text className="text-white text-action-lg font-bold">Verify Completion (Scan QR)</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleCancel} className="py-2 px-6 rounded-full active:bg-error/10">
              <Text className="text-body-md font-bold text-error">Cancel Ride</Text>
            </Pressable>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}
