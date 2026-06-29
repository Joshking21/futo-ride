import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Phone, ShieldAlert, Star, MessageSquare, ShieldCheck, MapPin, Maximize } from "lucide-react-native";
import KekeIcon from "../../components/KekeIcon";

export default function LiveTracking() {
  const router = useRouter();
  const { activeTrip, cancelBooking, completeTrip } = useApp();
  const [driverState, setDriverState] = useState<"assigned" | "arriving" | "arrived">("arriving");

  useEffect(() => {
    // Simulate real-time tracking progression
    const timer1 = setTimeout(() => {
      setDriverState("arriving");
    }, 3000);

    const timer2 = setTimeout(() => {
      setDriverState("arrived");
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
    <SafeAreaView className="flex-1 bg-surface-bright relative" edges={["top", "bottom"]}>
      {/* Top Header with Back Button */}
      <View className="absolute top-4 left-margin-mobile right-margin-mobile flex-row items-center justify-between z-30">
        <Pressable
          onPress={() => {
            cancelBooking();
            router.replace("/(rider)/home");
          }}
          className="w-12 h-12 rounded-2xl bg-white shadow-md shadow-black/5 items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-on-surface font-jakarta bg-white/90 px-4 py-2 rounded-2xl border border-outline-variant/10 shadow-sm">
          Live Tracking
        </Text>
        <View className="w-12" />
      </View>

      {/* Floating SOS button on Map */}
      <View className="absolute top-20 right-margin-mobile z-40">
        <Pressable
          onPress={() => router.push("/sos")}
          className="bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg border border-outline-variant/10 active:bg-error/5"
        >
          <ShieldAlert color="#ba1a1a" size={24} />
          <Text className="text-[10px] font-bold text-error uppercase tracking-wider font-jakarta mt-0.5">
            SOS
          </Text>
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
          <View className="absolute top-[42%] left-[49%] -mt-6 -ml-6 bg-white rounded-2xl p-2 border border-outline-variant/10 shadow-md items-center justify-center">
            <KekeIcon size={28} color="#001caa" />
          </View>
        )}

        {/* Pulsing User/Pickup Location Marker */}
        <View className="absolute top-[52%] left-[45%] -mt-3 -ml-3 w-6 h-6 items-center justify-center">
          <View className="absolute w-5 h-5 rounded-full bg-primary/20 scale-125" />
          <View className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-white shadow-md shadow-primary/20" />
        </View>
      </View>

      {/* Bottom Sheet containing Status & Details */}
      <View className="bg-white rounded-t-[36px] shadow-xl shadow-black/15 border-t border-outline-variant/10 p-6 gap-5 z-10">
        <View className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto" />

        {/* Header Status Row */}
        <View className="flex-col gap-2">
          <Text className="text-headline-lg font-bold text-on-surface font-jakarta">
            {driverState === "assigned"
              ? "Driver Assigned"
              : driverState === "arriving"
              ? "Driver is approaching..."
              : "Driver has arrived"}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1.5 bg-success/10 px-3 py-1 rounded-full">
              <View className="w-2 h-2 rounded-full bg-success" />
              <Text className="text-body-sm font-bold text-success font-jakarta">
                {driverState === "arrived" ? "Ready" : "Arriving in 3 mins"}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
              <ShieldCheck color="#001caa" size={14} />
              <Text className="text-body-sm font-bold text-primary font-jakarta">Live Location Shared</Text>
            </View>
          </View>
        </View>

        {/* Driver Profile Card */}
        <View className="bg-surface rounded-3xl p-4 flex-row items-center justify-between border border-outline-variant/10 shadow-sm">
          <View className="flex-row items-center gap-3.5 flex-1">
            <View className="relative w-12 h-12 rounded-full overflow-hidden border border-outline-variant/10 bg-white">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
                }}
                className="w-full h-full object-cover"
              />
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-bold text-on-surface font-jakarta">Kelechi Okafor</Text>
              <Text className="text-body-sm text-secondary font-jakarta mt-0.5">
                White Keke • Plate: IMO-123-AB
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Star color="#f59e0b" fill="#f59e0b" size={14} />
                <Text className="text-label-sm text-on-surface font-jakarta font-semibold">4.9 (124 rides)</Text>
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

        {/* Timeline route indicator card */}
        <View className="bg-surface rounded-3xl p-4 border border-outline-variant/10 shadow-sm relative">
          {/* connector line */}
          <View className="absolute left-[25px] top-[26px] bottom-[26px] w-[1px] border-l border-dashed border-outline-variant/30" />

          <View className="flex-row items-center gap-3.5 mb-3.5">
            <View className="w-5 h-5 rounded-full bg-primary/15 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-primary" />
            </View>
            <View>
              <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">Pickup Location</Text>
              <Text className="text-body-sm font-bold text-on-surface font-jakarta mt-0.5">{activeTrip.pickup || "SEET Roundabout, FUTO"}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3.5">
            <View className="w-5 h-5 rounded-full bg-primary/15 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-primary border-2 border-white" />
            </View>
            <View>
              <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">Destination</Text>
              <Text className="text-body-sm font-bold text-on-surface font-jakarta mt-0.5">{activeTrip.destination || "Senate Building, FUTO"}</Text>
            </View>
          </View>
        </View>

        {/* Scan QR Section */}
        <View className="bg-primary/5 rounded-3xl p-5 border border-primary/10 items-center justify-center gap-3.5">
          <View className="items-center text-center">
            <Text className="text-body-md font-bold text-on-surface font-jakarta">Ready to board?</Text>
            <Text className="text-body-sm text-secondary font-jakarta mt-1 text-center px-2">
              Scan the driver's QR code to verify your ride and start the trip
            </Text>
          </View>
          <Pressable
            onPress={handleVerifyComplete}
            className="w-full bg-[#0b1c30] h-14 rounded-full flex-row items-center justify-center gap-2 shadow-md active:scale-[0.98]"
          >
            <Maximize color="#ffffff" size={18} />
            <Text className="text-white text-action-lg font-bold font-jakarta">Scan QR Code</Text>
          </Pressable>
        </View>

        {/* Cancel link at bottom */}
        <Pressable onPress={handleCancel} className="items-center py-2 active:opacity-75">
          <Text className="text-body-sm font-bold text-error font-jakarta">Cancel Ride</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
