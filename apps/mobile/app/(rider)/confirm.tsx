import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, AlertTriangle, Info, Zap, CreditCard, ChevronRight, Check, ShieldAlert } from "lucide-react-native";

export default function ConfirmRide() {
  const router = useRouter();
  const { activeTrip, confirmBooking } = useApp();
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet">("cash");

  const basePrice = activeTrip.price || 300;
  const priorityFee = 100;
  const totalPrice = basePrice + (isPriority ? priorityFee : 0);

  const handleConfirm = () => {
    confirmBooking();
    router.replace("/(rider)/tracking");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 h-16 bg-surface border-b border-outline-variant">
        <Pressable onPress={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors">
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary font-jakarta">Confirm Ride</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Red Surge Pricing Banner */}
        <View className="bg-error-container rounded-xl p-4 flex-row items-center gap-3 shadow-sm">
          <ShieldAlert color="#93000a" size={24} />
          <View className="flex-1">
            <Text className="text-body-md font-bold text-on-error-container font-jakarta">High Demand</Text>
            <Text className="text-body-sm text-on-error-container font-jakarta">Fares are slightly higher due to increased campus traffic.</Text>
          </View>
        </View>

        {/* Campus Map Preview Container */}
        <View className="w-full h-48 bg-surface-container rounded-xl overflow-hidden shadow-sm relative">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
            }}
            className="w-full h-full object-cover"
          />
        </View>

        {/* Ride Detail Card */}
        <View className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center gap-4 flex-1 pr-2">
            <View className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center">
              <Text className="text-3xl">{activeTrip.rideType === "keke" ? "🛺" : "🚌"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-headline-sm font-bold text-on-surface font-jakarta">
                {activeTrip.rideType === "keke" ? "Campus Keke" : "Campus Bus"}
              </Text>
              <Text className="text-body-sm text-secondary font-jakarta">3 min away • 0.8 km</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Text className="text-secondary text-xs">👤</Text>
                <Text className="text-label-sm text-secondary font-jakarta">
                  {activeTrip.rideType === "keke" ? "3 seats available" : "18 seats available"}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-headline-md font-bold text-on-surface font-jakarta">₦{basePrice}</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-label-sm text-secondary font-jakarta">Est. fare</Text>
              <Info color="#5b5e66" size={12} />
            </View>
          </View>
        </View>

        {/* Priority Queue Toggle */}
        <View className="bg-surface-container-low rounded-xl p-4 flex-row items-center justify-between border border-outline-variant shadow-sm">
          <View className="flex-row items-center gap-3 flex-1 pr-4">
            <View className="w-10 h-10 bg-primary-fixed-dim rounded-lg flex items-center justify-center">
              <Zap color="#001caa" size={20} fill="#001caa" />
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-bold text-on-surface font-jakarta">Priority — skip the queue</Text>
              <Text className="text-body-sm text-secondary font-jakarta">Get matched faster (+₦100)</Text>
            </View>
          </View>
          <Switch
            value={isPriority}
            onValueChange={setIsPriority}
            trackColor={{ false: "#c5c5d8", true: "#001caa" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Payment Method Selector */}
        <View className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm">
          <Text className="text-label-md font-bold text-on-surface mb-4 font-jakarta">Payment method</Text>
          
          {/* Option 1: Naira */}
          <Pressable
            onPress={() => setPaymentMethod("cash")}
            className={`flex-row items-center justify-between p-3 border-2 rounded-xl mb-3 ${
              paymentMethod === "cash" ? "border-primary bg-surface-bright" : "border-outline-variant"
            }`}
          >
            <div className="flex-row items-center gap-3" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <View className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cash" ? "border-primary" : "border-outline-variant"}`}>
                {paymentMethod === "cash" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </View>
              <View className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Text className="text-on-primary font-bold text-lg font-jakarta">₦</Text>
              </View>
              <Text className="text-body-md text-on-surface font-medium font-jakarta">Naira</Text>
            </div>
            <View className="flex-row items-center gap-1">
              <Text className="text-body-sm text-secondary font-jakarta">Balance: ₦1,200</Text>
              <ChevronRight color="#5b5e66" size={16} />
            </View>
          </Pressable>

          {/* Option 2: cNGN */}
          <Pressable
            onPress={() => setPaymentMethod("wallet")}
            className={`flex-row items-center justify-between p-3 border rounded-xl ${
              paymentMethod === "wallet" ? "border-2 border-primary bg-surface-bright" : "border-outline-variant"
            }`}
          >
            <div className="flex-row items-center gap-3" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <View className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "wallet" ? "border-primary" : "border-outline-variant"}`}>
                {paymentMethod === "wallet" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </View>
              <View className="w-8 h-8 bg-on-surface rounded-full flex items-center justify-center">
                <Text className="text-on-primary text-[10px] font-bold font-jakarta">cNGN</Text>
              </View>
              <Text className="text-body-md text-on-surface font-medium font-jakarta">cNGN Wallet</Text>
            </div>
            <View className="flex-row items-center gap-1">
              <Text className="text-body-sm text-secondary font-jakarta">Balance: cNGN 50.00</Text>
              <ChevronRight color="#5b5e66" size={16} />
            </View>
          </Pressable>
        </View>

        {/* Fare Breakdown */}
        <View className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-body-sm text-secondary font-jakarta">Fare</Text>
            <Text className="text-body-sm text-secondary font-jakarta">₦{basePrice}</Text>
          </View>
          {isPriority && (
            <View className="flex-row justify-between items-center border-b border-dashed border-outline-variant pb-2">
              <Text className="text-body-sm text-secondary font-jakarta">Priority (skip the queue)</Text>
              <Text className="text-body-sm text-secondary font-jakarta">₦{priorityFee}</Text>
            </View>
          )}
          <View className="flex-row justify-between items-center pt-2">
            <Text className="text-headline-sm font-bold text-on-surface font-jakarta">Total</Text>
            <Text className="text-headline-sm font-bold text-on-surface font-jakarta">₦{totalPrice}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant p-4 z-40">
        <Pressable
          onPress={handleConfirm}
          className="w-full h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg active:scale-[0.98] transition-all"
        >
          <Text className="text-on-primary text-headline-md font-bold font-jakarta">Confirm Ride</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

