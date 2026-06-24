import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, AlertTriangle, Phone, ShieldAlert, CheckCircle2, Star } from "lucide-react-native";

export default function LiveTracking() {
  const router = useRouter();
  const { activeTrip, cancelBooking, completeTrip } = useApp();
  const [driverState, setDriverState] = useState<"assigned" | "arriving" | "arrived">("arriving");
  const [progressWidth, setProgressWidth] = useState<string>("66%");

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
    completeTrip();
    router.replace("/(rider)/receipt");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-4 h-16 bg-surface border-b border-outline-variant z-30">
        <Pressable
          onPress={() => {
            cancelBooking();
            router.replace("/(rider)/home");
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors"
        >
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary font-jakarta">Live Tracking</Text>
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
          className="w-full h-full object-cover"
        />

        {/* Pulsing Driver Location Marker */}
        {driverState !== "arrived" && (
          <View className="absolute top-[42%] left-[49%] -mt-4 -ml-4 bg-primary rounded-full p-2 border-2 border-white shadow-lg items-center justify-center">
            <Text className="text-[14px]">🛺</Text>
          </View>
        )}

        {/* Pulsing User/Pickup Location Marker */}
        <View className="absolute top-[55%] left-[45%] -mt-2 -ml-2 w-4.5 h-4.5 bg-secondary rounded-full border-2 border-white shadow-md" />

        {/* Floating SOS button */}
        <Pressable
          onPress={() => router.push("/sos")}
          className="absolute top-4 right-4 bg-error text-on-error shadow-lg rounded-full px-4 py-2.5 flex-row items-center gap-2 active:scale-95 z-40"
        >
          <ShieldAlert color="#ffffff" size={18} />
          <Text className="text-white font-bold text-label-md font-jakarta">SOS</Text>
        </Pressable>
      </View>

      {/* Bottom Information Sheet */}
      <View className="bg-surface w-full rounded-t-[24px] shadow-[0_-8px_24px_rgba(0,0,0,0.1)] border-t border-outline-variant/60 p-5 gap-4 z-10 pb-8">
        <View className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-1" />

        {/* Header Status */}
        <View className="items-center text-center pb-2">
          <Text className="text-headline-md font-bold text-primary font-jakarta">
            {driverState === "assigned"
              ? "Assigned"
              : driverState === "arriving"
              ? "Arriving in 3 mins"
              : "Arrived at Pickup"}
          </Text>
          <Text className="text-body-sm text-secondary mt-1 font-jakarta text-center">
            {driverState === "arrived" 
              ? "Your driver has reached the pickup point."
              : `Your ${activeTrip.rideType === "keke" ? "Keke" : "Bus"} is on the way to ${activeTrip.pickup || "Senate Building"}`}
          </Text>
        </View>

        {/* Trip Progress Bar */}
        <View className="w-full">
          <View className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden relative mb-2">
            <View style={{ width: progressWidth as any }} className="absolute top-0 left-0 h-full bg-primary rounded-full" />
          </View>
          <View className="flex-row justify-between px-1">
            <Text className={`text-[10px] font-bold font-jakarta ${(driverState === "assigned" || driverState === "arriving" || driverState === "arrived") ? "text-primary" : "text-secondary"}`}>ASSIGNED</Text>
            <Text className={`text-[10px] font-bold font-jakarta ${(driverState === "arriving" || driverState === "arrived") ? "text-primary" : "text-secondary"}`}>ARRIVING</Text>
            <Text className={`text-[10px] font-bold font-jakarta ${driverState === "arrived" ? "text-primary" : "text-secondary"}`}>ARRIVED</Text>
          </View>
        </View>

        {/* Driver Card */}
        <View className="bg-surface-container rounded-xl p-4 flex-row items-center justify-between border border-outline-variant shadow-sm mt-1">
          <View className="flex-row items-center gap-3">
            <View className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-surface bg-surface-container">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
                }}
                className="w-full h-full object-cover"
              />
              <View className="absolute bottom-0 right-0 bg-surface rounded-full p-0.5">
                <View className="bg-success w-2.5 h-2.5 rounded-full" />
              </View>
            </View>
            <View>
              <Text className="text-label-md font-bold text-on-surface font-jakarta">Chukwuemeka O.</Text>
              <Text className="text-body-sm text-secondary font-jakarta">
                {activeTrip.rideType === "keke" ? "Keke Napep" : "Campus Bus"} • FTO-492-XA
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <Star color="#f59e0b" fill="#f59e0b" size={14} />
                <Text className="text-label-sm text-on-surface font-jakarta font-semibold">4.9</Text>
              </View>
            </View>
          </View>
          <Pressable className="bg-primary-container w-11 h-11 rounded-full items-center justify-center shadow-md active:scale-95">
            <Phone color="#ffffff" size={20} fill="#ffffff" />
          </Pressable>
        </View>

        {/* Action Panel */}
        <View className="items-center mt-2">
          {driverState === "arrived" ? (
            <Pressable
              onPress={handleVerifyComplete}
              className="w-full bg-success h-14 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
            >
              <CheckCircle2 color="#ffffff" size={20} />
              <Text className="text-white text-action-lg font-bold font-jakarta">Verify Completion (Scan QR)</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleCancel} className="py-2 px-6 rounded-full active:bg-error/10">
              <Text className="text-body-md font-bold text-error font-jakarta">Cancel Ride</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

