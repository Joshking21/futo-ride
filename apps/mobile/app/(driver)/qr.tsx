import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, Wallet, Maximize } from "lucide-react-native";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";

export default function DriverQR() {
  const router = useRouter();
  const { activeTrip, completeTrip } = useApp();

  const handleScanDone = () => {
    completeTrip();
    router.replace("/(driver)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[64px] bg-white border-b border-outline-variant/10 z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Payout QR</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, alignItems: "center" }} className="flex-1">
        <Text className="text-body-sm text-secondary text-center leading-5 font-jakarta px-4">
          Let passenger scan this QR code to verify trip completion and release payment.
        </Text>

        {/* QR Code Card Box */}
        <View className="w-full bg-white rounded-[36px] border border-outline-variant/10 shadow-sm p-6 items-center gap-5">
          <View className="items-center">
            <Text className="text-body-sm text-secondary font-jakarta">Trip Payout</Text>
            <Text className="text-headline-xl font-bold text-primary font-jakarta mt-0.5">₦950.00</Text>
          </View>

          {/* QR Scan Scanner Box Frame */}
          <View className="relative w-56 h-56 items-center justify-center p-4 border border-outline-variant/10 rounded-3xl bg-surface">
            {/* Corner styling anchors */}
            <View className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <View className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <View className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <View className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />

            <Pressable onPress={handleScanDone} className="w-full h-full rounded-2xl overflow-hidden p-1.5 active:opacity-90">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwU9p-p3MAM0M5CJ_uCAQo00mPIGbk1LtH9mb6CeU6eK4o9ldjRGsAlGd7jEJucTJ44oFbnErneToX7T0XMWtCmX3suULYGB5cD8gMskYI8qXtGDZsJjMGrb6_0-o6JGC6TBuPHkVX_H4qz6MrMOMMJ5dRmwR9z2SwKiRdf6DxhqSAymb8J-JREiJQtgrLkMKEh6_jqg2HjDJYhJfNAK1MK8kgKCAis6aO3S1YeVDn2BLeggH5-57fKB6I3Ol-1I-LRXn7VlgTBIrf",
                }}
                className="w-full h-full object-contain"
              />
            </Pressable>
          </View>

          <View className="items-center">
            <Text className="text-body-sm font-bold text-on-surface font-jakarta">Verify payout</Text>
            <Text className="text-body-sm text-secondary font-mono mt-0.5">Trip ID: FUTO-984-KLX</Text>
          </View>
        </View>

        {/* Security Encryption Details Box */}
        <View className="bg-success/5 rounded-3xl p-5 border border-success/10 flex-row items-start gap-4 w-full">
          <View className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck color="#22c55e" size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-body-md font-bold text-on-surface font-jakarta">Secure Transaction</Text>
            <Text className="text-body-sm text-secondary font-jakarta leading-5 mt-1">
              Payments are held securely in cNGN smart contracts and released immediately upon scanning.
            </Text>
          </View>
        </View>

        {/* Complete & Return Button */}
        <Pressable
          onPress={handleScanDone}
          className="w-full h-14 bg-[#0b1c30] rounded-full flex items-center justify-center shadow-md active:scale-[0.98] mt-4"
        >
          <Text className="text-white text-action-lg font-bold font-jakarta">Complete & Return</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
