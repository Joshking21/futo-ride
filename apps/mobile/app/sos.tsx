import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShieldAlert, AlertTriangle, Signal, X } from "lucide-react-native";

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
    // In a real app, this triggers Alerta integration and calls campus security
    alert("Emergency SOS Transmitted! Campus security and your emergency contacts have been notified with your live coordinates.");
    router.back();
  };

  return (
    <SafeAreaView className="flex-grow bg-inverse-surface flex-col justify-between p-6" style={{ flex: 1 }}>
      {/* Top Section */}
      <View className="w-full flex-row justify-center mb-6">
        <View className="flex-row items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-error/30">
          <View className="relative flex h-2.5 w-2.5">
            <View className={`absolute h-full w-full rounded-full bg-error opacity-75 ${isPulsing ? "scale-150" : "scale-100"}`} />
            <View className="h-2.5 w-2.5 rounded-full bg-error" />
          </View>
          <Text className="font-bold text-xs tracking-widest text-white font-jakarta">GPS ACTIVE</Text>
        </View>
      </View>

      {/* Center Action Area */}
      <View className="flex-1 items-center justify-center gap-8 w-full max-w-sm mx-auto">
        {/* Warning Text */}
        <View className="items-center text-center gap-2">
          <ShieldAlert color="#ba1a1a" size={48} />
          <Text className="text-headline-lg-mobile font-bold text-white mb-1 font-jakarta">Emergency Alert</Text>
          <Text className="text-body-sm text-outline-variant text-center max-w-[280px] font-jakarta">
            This alerts campus security with your live location. Use only in genuine emergencies.
          </Text>
        </View>

        {/* SOS Button */}
        <Pressable
          onPress={handleSendSOS}
          className={`w-44 h-44 rounded-full bg-error items-center justify-center border-4 border-error-container/20 shadow-2xl active:scale-95 ${
            isPulsing ? "scale-105" : "scale-100"
          }`}
        >
          <AlertTriangle color="#ffffff" size={48} />
          <Text className="text-headline-md font-bold text-white tracking-wider mt-2 font-jakarta">SEND SOS</Text>
        </Pressable>

        {/* Location Coordinates Card */}
        <View className="w-full bg-surface-container-highest rounded-xl border border-outline-variant overflow-hidden shadow-lg mt-2">
          {/* Map Area Placeholder */}
          <View className="relative h-32 w-full bg-surface-variant overflow-hidden flex items-center justify-center">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP-YY12q4fIeKFG_wzPcoIcBRPLtpUTLf-VuKfLWRRYbsp8wgOMHvXe9nosnoRXv9Z5e3FVYNUOtnSElahC0xoiqUZC3FOgCw111OvV5wFMdke19nnodcTXN0YOklZ86MX7j-IAZOOOBTolg8IQpX3j4BRIMpc9kaA3Aij7udi4mpFssXmbFfKJgR3xvhmZ2qSnlrKUJ9HlYHrgdZmn2PsNg1sB43Y3BsSUm9jnnl3lnf60y9amt2p6SDmFgyObabyrj-NOhdrKgEz",
              }}
              className="w-full h-full object-cover opacity-90"
            />
            {/* Red Pulse Marker */}
            <View className="absolute inset-0 flex items-center justify-center">
              <View className="w-4 h-4 bg-error rounded-full border-2 border-white" />
            </View>
          </View>

          {/* Coordinates Details */}
          <View className="p-4 flex-row justify-between items-center bg-surface">
            <View>
              <Text className="text-[10px] text-secondary font-bold font-jakarta">CURRENT COORDINATES</Text>
              <Text className="text-body-md font-bold text-on-surface font-mono mt-0.5">5°23'14"N 6°59'35"E</Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
              <Signal color="#001caa" size={20} />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View className="w-full max-w-sm mx-auto mt-6">
        <Pressable
          onPress={() => router.back()}
          className="w-full h-14 rounded-lg border border-outline-variant items-center justify-center active:bg-white/10"
        >
          <Text className="text-white font-bold text-label-md font-jakarta">Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
