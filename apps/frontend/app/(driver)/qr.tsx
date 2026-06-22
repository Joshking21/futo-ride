import React, { useEffect } from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, CheckCircle } from "lucide-react-native";

export default function DriverQR() {
  const router = useRouter();
  const { activeTrip, completeTrip } = useApp();

  const handleScanDone = () => {
    completeTrip();
    router.replace("/(driver)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex-row items-center justify-between z-30">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-surface-container">
            <ArrowLeft color="#001caa" size={24} />
          </Pressable>
          <Text className="text-headline-md font-bold text-primary font-jakarta">Completion Scan</Text>
        </View>
        <Pressable className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 12,500</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-between px-margin-mobile py-8 max-w-md mx-auto w-full">
        
        {/* Top Info */}
        <View className="w-full items-center text-center mt-4">
          <Text className="text-headline-lg-mobile font-bold text-on-surface">Ride Complete</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <Text className="text-body-md text-secondary font-medium">SOES Building</Text>
            <Text className="text-[12px] text-secondary">➔</Text>
            <Text className="text-body-md text-secondary font-medium">Senate Building</Text>
          </View>
          <View className="bg-surface-container-low px-5 py-2 rounded-full border border-outline-variant/30 mt-4">
            <Text className="text-body-lg font-bold text-primary">Fare: ₦ 300.00</Text>
          </View>
        </View>

        {/* QR Code Container */}
        <Pressable
          onPress={handleScanDone}
          className="w-full max-w-[280px] aspect-square bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm items-center justify-center my-6 active:opacity-85"
        >
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwU9p-p3MAM0M5CJ_uCAQo00mPIGbk1LtH9mb6CeU6eK4o9ldjRGsAlGd7jEJucTJ44oFbnErneToX7T0XMWtCmX3suULYGB5cD8gMskYI8qXtGDZsJjMGrb6_0-o6JGC6TBuPHkVX_H4qz6MrMOMMJ5dRmwR9z2SwKiRdf6DxhqSAymb8J-JREiJQtgrLkMKEh6_jqg2HjDJYhJfNAK1MK8kgKCAis6aO3S1YeVDn2BLeggH5-57fKB6I3Ol-1I-LRXn7VlgTBIrf",
            }}
            className="w-full h-full object-contain"
          />
        </Pressable>

        {/* Status indicator */}
        <View className="w-full flex-row items-center justify-center gap-3 bg-surface-container-low py-4 px-6 rounded-xl border border-outline-variant/30">
          <ActivityIndicator color="#001caa" />
          <Text className="text-body-md font-bold text-on-surface">Waiting for rider to scan...</Text>
        </View>

        {/* Demo completion shortcut */}
        <Pressable
          onPress={handleScanDone}
          className="mt-4 bg-primary/10 border border-primary/20 px-6 py-2.5 rounded-full active:bg-primary/20"
        >
          <Text className="text-label-sm text-primary font-bold uppercase tracking-wider">
            Simulate Scan (Complete Ride)
          </Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}
