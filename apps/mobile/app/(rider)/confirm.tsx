import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Zap, ChevronRight, ShieldAlert, Info } from "lucide-react-native";
import KekeIcon from "../../components/KekeIcon";

export default function ConfirmRide() {
  const router = useRouter();
  const { activeTrip, confirmBooking } = useApp();
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"naira" | "cngn">("naira");

  const basePrice = 850;
  const serviceFee = 100;
  const priorityFee = 100;
  const totalPrice = basePrice + serviceFee + (isPriority ? priorityFee : 0);

  const handleConfirm = () => {
    confirmBooking();
    router.replace("/(rider)/tracking");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top", "bottom"]}>
      {/* Top Header with Back Button */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[64px] bg-white border-b border-outline-variant/10 z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Confirm Ride</Text>
        <View className="w-12" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 120 }}>
        {/* Map Preview Card */}
        <View className="w-full h-48 bg-surface-container rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10 relative">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
            }}
            className="w-full h-full object-cover"
          />
          {/* Simulated route icons overlay */}
          <View className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <View className="absolute top-[40%] left-[30%] w-3 h-3 rounded-full bg-primary border-2 border-white" />
            <View className="absolute top-[50%] left-[60%] w-3.5 h-3.5 rounded-full bg-primary border-2 border-white" />
            <View className="absolute top-[45%] left-[35%] w-[45%] h-1 bg-primary/80 rotate-[18deg]" />
            <View className="absolute top-[38%] left-[48%] bg-white p-1 rounded-lg border border-outline-variant/10 shadow-sm">
              <KekeIcon size={20} color="#001caa" />
            </View>
          </View>
        </View>

        {/* Ride Option Details Card */}
        <View className="bg-white border border-outline-variant/10 rounded-3xl p-5 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center gap-4 flex-1">
            <View className="w-14 h-14 bg-surface rounded-2xl items-center justify-center border border-outline-variant/5">
              <KekeIcon size={38} color="#001caa" />
            </View>
            <View className="flex-1">
              <Text className="text-headline-sm font-bold text-on-surface font-jakarta">
                {activeTrip.rideType === "keke" ? "Keke" : "Bus"}
              </Text>
              <Text className="text-body-sm text-secondary font-jakarta mt-0.5">5 min away • 1.6 km</Text>
              <Text className="text-body-sm text-secondary font-jakarta font-semibold mt-1">👤 4 seats available</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-headline-md font-bold text-on-surface font-jakarta">₦{basePrice}</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Text className="text-label-sm text-secondary font-jakarta">Estimated fare</Text>
              <Info color="#757687" size={12} />
            </View>
          </View>
        </View>

        {/* Priority Toggle Card */}
        <View className="bg-surface rounded-3xl p-4 flex-row items-center justify-between border border-outline-variant/10 shadow-sm">
          <View className="flex-row items-center gap-3.5 flex-1 pr-4">
            <View className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Zap color="#001caa" size={20} fill="#001caa" />
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-bold text-on-surface font-jakarta">Priority — skip the queue</Text>
              <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Get matched faster</Text>
            </View>
          </View>
          <Switch
            value={isPriority}
            onValueChange={setIsPriority}
            trackColor={{ false: "#c5c5d8", true: "#001caa" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Payment Method Selector Card */}
        <View className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm gap-4">
          <Text className="text-label-sm font-bold text-secondary uppercase tracking-wider font-jakarta">Payment method</Text>
          
          {/* Option 1: Naira */}
          <Pressable
            onPress={() => setPaymentMethod("naira")}
            className={`flex-row items-center justify-between p-3.5 border rounded-2xl ${
              paymentMethod === "naira" ? "border-primary bg-primary/5" : "border-outline-variant/15"
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === "naira" ? "border-primary" : "border-outline-variant"
              }`}>
                {paymentMethod === "naira" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </View>
              <View className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Text className="text-white font-bold text-lg font-jakarta">₦</Text>
              </View>
              <Text className="text-body-md text-on-surface font-bold font-jakarta">Naira</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-body-sm text-secondary font-jakarta">Balance: ₦5,200</Text>
              <ChevronRight color="#757687" size={16} />
            </View>
          </Pressable>

          {/* Option 2: cNGN */}
          <Pressable
            onPress={() => setPaymentMethod("cngn")}
            className={`flex-row items-center justify-between p-3.5 border rounded-2xl ${
              paymentMethod === "cngn" ? "border-primary bg-primary/5" : "border-outline-variant/15"
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === "cngn" ? "border-primary" : "border-outline-variant"
              }`}>
                {paymentMethod === "cngn" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </View>
              <View className="w-8 h-8 bg-on-surface rounded-full flex items-center justify-center">
                <Text className="text-white text-[10px] font-bold font-jakarta">cNGN</Text>
              </View>
              <Text className="text-body-md text-on-surface font-bold font-jakarta">cNGN</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-body-sm text-secondary font-jakarta">Balance: cNGN 12.50</Text>
              <ChevronRight color="#757687" size={16} />
            </View>
          </Pressable>
        </View>

        {/* Fare Breakdown */}
        <View className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm gap-2.5">
          <View className="flex-row justify-between items-center">
            <Text className="text-body-sm text-secondary font-jakarta">Fare</Text>
            <Text className="text-body-sm text-on-surface font-medium font-jakarta">₦{basePrice}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-body-sm text-secondary font-jakarta">Service fee</Text>
            <Text className="text-body-sm text-on-surface font-medium font-jakarta">₦{serviceFee}</Text>
          </View>
          {isPriority && (
            <View className="flex-row justify-between items-center">
              <Text className="text-body-sm text-secondary font-jakarta">Priority (skip the queue)</Text>
              <Text className="text-body-sm text-on-surface font-medium font-jakarta">₦{priorityFee}</Text>
            </View>
          )}
          <View className="flex-row justify-between items-center border-t border-outline-variant/10 pt-3 mt-1">
            <Text className="text-headline-sm font-bold text-on-surface font-jakarta">Total</Text>
            <Text className="text-headline-sm font-bold text-on-surface font-jakarta">₦{totalPrice}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-outline-variant/10 p-4 z-40">
        <View className="max-w-[600px] mx-auto w-full">
          <Pressable
            onPress={handleConfirm}
            className="w-full h-14 bg-[#0b1c30] rounded-full flex items-center justify-center shadow-md active:scale-[0.98]"
          >
            <Text className="text-white text-action-lg font-bold font-jakarta">Confirm Ride</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

