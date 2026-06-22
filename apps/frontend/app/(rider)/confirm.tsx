import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, TrendingUp, Info, Zap, CreditCard, ChevronRight, Check } from "lucide-react-native";

export default function ConfirmRide() {
  const router = useRouter();
  const { activeTrip, confirmBooking } = useApp();
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet">("cash");

  const basePrice = activeTrip.price || 300;
  const totalPrice = basePrice + (isPriority ? 100 : 0);

  const handleConfirm = () => {
    confirmBooking();
    router.replace("/(rider)/tracking");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-margin-mobile h-touch-target bg-surface border-b border-outline-variant/30 z-30">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-surface-container">
            <ArrowLeft color="#001caa" size={24} />
          </Pressable>
          <Text className="text-headline-md font-bold text-primary font-jakarta">Confirm Ride</Text>
        </View>
        <Pressable className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 1,850</Text>
        </Pressable>
      </View>

      {/* Map View Background */}
      <View className="flex-grow w-full relative z-0">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          className="w-full h-full object-cover opacity-80"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none" />

        {/* Route Overlay Info */}
        <View className="absolute top-4 left-4 right-4 bg-surface/90 backdrop-blur-sm border border-outline-variant/50 p-3 rounded-lg flex-row items-center justify-between shadow-sm">
          <View className="flex-1">
            <Text className="text-[11px] text-secondary uppercase font-bold">Route</Text>
            <Text className="text-body-sm font-semibold text-on-surface truncate">
              {activeTrip.pickup || "FUTO Main Gate"} ➔ {activeTrip.destination || "SEET Head"}
            </Text>
          </View>
        </View>
      </View>

      {/* Ride Options Bottom Sheet */}
      <View className="bg-surface w-full rounded-t-2xl shadow-xl border-t border-outline-variant/60 p-margin-mobile gap-4 z-10">
        
        {/* Surge Pricing Banner */}
        <View className="bg-tertiary-container text-on-tertiary-container rounded-lg p-3 flex-row items-center gap-2">
          <TrendingUp color="#ffffff" size={16} />
          <Text className="text-body-sm font-bold text-white flex-1">Surge Pricing Active</Text>
          <Text className="text-[11px] text-white/80 font-semibold uppercase bg-white/20 px-2 py-0.5 rounded">High Demand</Text>
        </View>

        {/* Matched Vehicle Card */}
        <View className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 flex-row justify-between items-center shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-surface-container flex items-center justify-center rounded-xl">
              <Text className="text-2xl">{activeTrip.rideType === "keke" ? "🛺" : "🚌"}</Text>
            </View>
            <View>
              <Text className="text-body-lg font-bold text-on-surface">
                {activeTrip.rideType === "keke" ? "Campus Keke" : "Campus Bus"}
              </Text>
              <Text className="text-body-sm text-secondary">0.8km away • Seats {activeTrip.rideType === "keke" ? "3" : "18"}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-headline-sm font-black text-primary">₦ {totalPrice}</Text>
            <Text className="text-[11px] text-secondary">Estimated Fare</Text>
          </View>
        </View>

        {/* Priority Queue Toggle */}
        <View className="border border-outline-variant/40 rounded-xl p-4 flex-row justify-between items-center bg-surface-container-lowest">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center gap-1.5">
              <Zap color="#001caa" size={16} fill="#001caa" />
              <Text className="text-body-md font-bold text-on-surface">Priority Dispatch</Text>
            </View>
            <Text className="text-body-sm text-secondary mt-0.5">Skip the queue (+₦100 fee)</Text>
          </View>
          <Switch
            value={isPriority}
            onValueChange={setIsPriority}
            trackColor={{ false: "#dfe2eb", true: "#001caa" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Payment Selector */}
        <View className="gap-2">
          <Text className="text-[11px] text-secondary uppercase font-bold tracking-wider">Payment Method</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setPaymentMethod("cash")}
              className={`flex-1 flex-row items-center justify-center gap-2 h-12 rounded-xl border ${
                paymentMethod === "cash"
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant/50 bg-surface-container-lowest"
              }`}
            >
              <CreditCard color={paymentMethod === "cash" ? "#001caa" : "#5b5e66"} size={16} />
              <Text className={`font-bold text-body-sm ${paymentMethod === "cash" ? "text-primary" : "text-secondary"}`}>
                Naira Cash
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod("wallet")}
              className={`flex-1 flex-row items-center justify-center gap-2 h-12 rounded-xl border ${
                paymentMethod === "wallet"
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant/50 bg-surface-container-lowest"
              }`}
            >
              <Wallet color={paymentMethod === "wallet" ? "#001caa" : "#5b5e66"} size={16} />
              <Text className={`font-bold text-body-sm ${paymentMethod === "wallet" ? "text-primary" : "text-secondary"}`}>
                cNGN Wallet
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Confirm Action Button */}
        <Pressable
          onPress={handleConfirm}
          className="w-full bg-primary hover:bg-primary-container h-14 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-[0.98] transition-all"
        >
          <Text className="text-on-primary text-action-lg font-bold">Confirm Ride</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}
