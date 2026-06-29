import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Shield, ShieldAlert, Lock, X } from "lucide-react-native";

export default function SOSScreen() {
  const router = useRouter();
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing((prev) => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendSOS = () => {
    alert("Emergency SOS Transmitted! Campus Security Team has been notified of your live coordinates.");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright flex-col justify-between px-margin-mobile py-6" edges={["top", "bottom"]}>
      {/* Top Header Row with Close Button */}
      <View className="flex-row items-center justify-between w-full">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white shadow-sm shadow-black/5 items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <X color="#1A1A1A" size={24} />
        </Pressable>
        <View className="w-12" />
      </View>

      {/* Main Content Area */}
      <View className="flex-grow justify-center items-center py-6 gap-6 w-full max-w-sm mx-auto">
        {/* Glowing Red Warning Header */}
        <View className="items-center">
          <View className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center relative mb-4">
            {/* Pulsing ring */}
            <View className={`absolute inset-0 rounded-full bg-error/15 ${isPulsing ? "scale-125" : "scale-100"}`} />
            <ShieldAlert color="#ba1a1a" size={38} />
          </View>
          <Text className="text-headline-xl font-bold text-error tracking-tight text-center font-jakarta mb-1">
            SOS
          </Text>
          <Text className="text-headline-md font-bold text-on-surface text-center font-jakarta mb-2">
            Need Help?
          </Text>
          <Text className="text-body-sm text-secondary text-center px-4 leading-5 font-jakarta">
            This alerts campus security with your live location
          </Text>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleSendSOS}
          className="w-full bg-error h-14 rounded-full flex-row items-center justify-center gap-2.5 shadow-lg shadow-error/25 active:scale-[0.98]"
        >
          {/* Custom siren icon styling using text/shields */}
          <Shield color="#ffffff" size={20} />
          <Text className="text-white text-action-lg font-bold font-jakarta">
            Send SOS
          </Text>
        </Pressable>

        {/* Warning Policy Box */}
        <View className="bg-error-container border border-error-container/20 rounded-2xl p-4 flex-row items-start gap-3 w-full">
          <ShieldAlert color="#93000a" size={20} className="shrink-0 mt-0.5" />
          <View className="flex-1">
            <Text className="text-body-sm font-bold text-on-error-container font-jakarta">
              Use SOS only in real emergencies.
            </Text>
            <Text className="text-body-sm text-on-error-container/80 font-jakarta mt-0.5">
              False alarms may lead to disciplinary action.
            </Text>
          </View>
        </View>

        {/* Location Map Preview */}
        <View className="w-full bg-surface border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm relative">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
            }}
            className="w-full h-44 object-cover"
          />
          {/* Floating Location Badge */}
          <View className="absolute top-4 left-4 bg-white px-3.5 py-2.5 rounded-2xl border border-outline-variant/10 shadow-sm flex-row items-center gap-2.5">
            <View className="w-6 h-6 rounded-full bg-error/15 items-center justify-center">
              <View className="w-2.5 h-2.5 rounded-full bg-error" />
            </View>
            <View>
              <Text className="text-[10px] text-secondary font-bold font-jakarta">Your Location</Text>
              <Text className="text-body-sm font-bold text-on-surface font-jakarta mt-0.5">SEET Roundabout, FUTO</Text>
            </View>
          </View>

          {/* User Marker Dot */}
          <View className="absolute top-[50%] left-[50%] -ml-5 -mt-5 w-10 h-10 items-center justify-center">
            <View className="absolute w-8 h-8 rounded-full bg-primary/20 scale-125" />
            <View className="absolute w-6 h-6 rounded-full bg-primary/40" />
            <View className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-white" />
          </View>
        </View>

        {/* Security team subtext */}
        <View className="flex-row items-center justify-center gap-2 w-full">
          <Lock color="#757687" size={14} />
          <Text className="text-body-sm text-secondary font-jakarta">
            Your location will be shared with <Text className="text-error font-semibold">Campus Security Team</Text>
          </Text>
        </View>
      </View>

      {/* Cancel Button */}
      <View className="w-full max-w-sm mx-auto pt-2">
        <Pressable
          onPress={() => router.back()}
          className="w-full h-14 rounded-full border border-error flex items-center justify-center bg-white active:bg-error/5"
        >
          <Text className="text-error font-bold text-action-lg font-jakarta">Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
