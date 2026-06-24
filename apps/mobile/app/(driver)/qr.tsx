import React from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, CheckCircle2, MapPin, Navigation, Info, DollarSign } from "lucide-react-native";

export default function DriverQR() {
  const router = useRouter();
  const { activeTrip, completeTrip } = useApp();

  const handleScanDone = () => {
    completeTrip();
    router.replace("/(driver)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="px-4 h-16 bg-surface border-b border-outline-variant flex-row items-center justify-between z-30">
        <Pressable onPress={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors">
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary font-jakarta">Completion Scan</Text>
        <Pressable className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 12,500</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-between px-4 py-8 max-w-md mx-auto w-full">
        
        {/* Success Indicator */}
        <View className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center shadow-lg mb-4">
          <CheckCircle2 color="#ffffff" size={40} fill="#1d35d1" />
        </View>

        {/* Route Summary Card */}
        <View className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center">
              <Navigation color="#001caa" size={14} />
            </View>
            <Text className="text-body-md text-on-surface font-medium font-jakarta">{activeTrip.pickup || "SOES Building"}</Text>
          </View>
          <View className="pl-3 border-l-2 border-dashed border-outline-variant ml-3 h-4 my-1" />
          <View className="flex-row items-center gap-3">
            <View className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center">
              <MapPin color="#ba1a1a" size={14} />
            </View>
            <Text className="text-body-md text-on-surface font-semibold font-jakarta">{activeTrip.destination || "Senate Building"}</Text>
          </View>
          <View className="mt-4 pt-4 border-t border-outline-variant flex-row justify-between items-center">
            <Text className="text-body-sm text-secondary font-jakarta">Total Fare</Text>
            <Text className="text-headline-md font-bold text-primary font-jakarta">₦{activeTrip.price || 300}.00</Text>
          </View>
        </View>

        {/* QR Code Section */}
        <View className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm items-center gap-4 relative my-4 w-full">
          <View className="absolute inset-0 border-2 border-primary rounded-2xl opacity-20" />
          <Text className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider font-jakarta">Scan to Pay</Text>
          
          {/* Simulated QR Code Image */}
          <Pressable
            onPress={handleScanDone}
            className="w-44 h-44 bg-surface border border-outline-variant rounded-lg overflow-hidden p-1 active:opacity-85"
          >
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwU9p-p3MAM0M5CJ_uCAQo00mPIGbk1LtH9mb6CeU6eK4o9ldjRGsAlGd7jEJucTJ44oFbnErneToX7T0XMWtCmX3suULYGB5cD8gMskYI8qXtGDZsJjMGrb6_0-o6JGC6TBuPHkVX_H4qz6MrMOMMJ5dRmwR9z2SwKiRdf6DxhqSAymb8J-JREiJQtgrLkMKEh6_jqg2HjDJYhJfNAK1MK8kgKCAis6aO3S1YeVDn2BLeggH5-57fKB6I3Ol-1I-LRXn7VlgTBIrf",
              }}
              className="w-full h-full object-contain"
            />
          </Pressable>

          {/* Animated Status */}
          <View className="flex-row items-center gap-2 bg-primary-container/10 px-4 py-2 rounded-full border border-primary/10">
            <ActivityIndicator color="#001caa" size="small" />
            <Text className="text-label-sm font-bold text-primary font-jakarta">Waiting for rider to scan...</Text>
          </View>
        </View>

        {/* Manual Override Actions */}
        <View className="w-full flex-row justify-center gap-3 mt-4">
          <Pressable
            onPress={() => router.back()}
            className="px-6 h-12 rounded-full border border-outline items-center justify-center active:bg-surface-container"
          >
            <Text className="text-secondary font-bold text-label-md font-jakarta">Cancel Scan</Text>
          </Pressable>
          <Pressable
            onPress={handleScanDone}
            className="px-6 h-12 rounded-full bg-surface-container-highest flex-row items-center justify-center gap-2 active:bg-surface-variant"
          >
            <DollarSign color="#001caa" size={16} />
            <Text className="text-primary font-bold text-label-md font-jakarta">Cash Received</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

