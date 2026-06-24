import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, CreditCard, Wallet, Check, ShieldCheck, Lock, ArrowRight, Car } from "lucide-react-native";

export default function Payment() {
  const router = useRouter();
  const { activeTrip } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<"monnify" | "privy">("monnify");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const baseFare = activeTrip.price || 300;
  const priorityFee = 100;
  const total = baseFare + priorityFee;

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    }, 1800);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-4 h-16 bg-surface border-b border-outline-variant">
        <Pressable onPress={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors">
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary font-jakarta">Checkout</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-4 py-6">
        {paymentSuccess ? (
          <View className="flex-1 items-center justify-center py-10">
            <View className="w-16 h-16 rounded-full bg-success/20 items-center justify-center mb-4">
              <Check color="#22c55e" size={32} />
            </View>
            <Text className="text-headline-md font-bold text-on-surface font-jakarta">Payment Successful</Text>
            <Text className="text-body-sm text-secondary mt-1 font-jakarta">Directing you back to your trip...</Text>
          </View>
        ) : (
          <View className="flex-grow gap-6">
            <View className="mobile-only-header md:hidden">
              <Text className="text-headline-lg-mobile font-bold text-on-surface font-jakarta">Payment Summary</Text>
            </View>

            {/* Ride Detail Card */}
            <View className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm gap-4">
              <View className="flex-row items-center gap-3 border-b border-surface-container pb-4">
                <View className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                  <Car color="#ffffff" size={20} />
                </View>
                <View>
                  <Text className="font-bold text-label-md text-on-surface font-jakarta">
                    Futo Ride - {activeTrip.rideType === "keke" ? "Campus Keke" : "Campus Bus"}
                  </Text>
                  <Text className="text-body-sm text-secondary font-jakarta">
                    {activeTrip.pickup || "Campus Gate"} to {activeTrip.destination || "Hostel C"}
                  </Text>
                </View>
              </View>

              {/* Breakdown */}
              <View className="gap-2.5 py-1">
                <View className="flex-row justify-between items-center">
                  <Text className="text-body-md text-on-surface-variant font-jakarta">Base Fare</Text>
                  <Text className="text-body-md text-on-surface font-medium font-jakarta">₦{baseFare}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-body-md text-on-surface-variant font-jakarta">Priority Fee</Text>
                  <Text className="text-body-md text-on-surface font-medium font-jakarta">₦{priorityFee}</Text>
                </View>
              </View>

              {/* Total */}
              <View className="flex-row justify-between items-center border-t border-surface-container pt-4">
                <Text className="text-headline-md font-bold text-on-surface font-jakarta">Total</Text>
                <Text className="text-headline-md font-bold text-primary font-jakarta">₦{total}</Text>
              </View>
            </View>

            {/* Payment Methods */}
            <View className="bg-surface-container-lowest/85 rounded-xl p-5 border border-outline-variant shadow-sm gap-4">
              <Text className="font-bold text-label-md text-secondary uppercase tracking-wider font-jakarta">Payment Method</Text>
              <View className="gap-3">
                
                {/* Method 1: Monnify */}
                <Pressable
                  onPress={() => setSelectedMethod("monnify")}
                  className={`flex-row items-center gap-3 p-4 rounded-xl border-2 ${
                    selectedMethod === "monnify" ? "border-primary bg-surface-container-low" : "border-outline-variant bg-surface"
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === "monnify" ? "border-primary" : "border-outline-variant"}`}>
                    {selectedMethod === "monnify" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </View>
                  <View className="flex-row flex-1 items-center justify-between" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <View className="flex-row items-center gap-2" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <CreditCard color={selectedMethod === "monnify" ? "#001caa" : "#5b5e66"} size={20} />
                      <Text className="text-body-md text-on-surface font-medium font-jakarta">Card / Bank Transfer</Text>
                    </View>
                    <View className="bg-surface px-2 py-0.5 rounded-full border border-outline-variant">
                      <Text className="text-label-sm text-secondary font-jakarta">Monnify</Text>
                    </View>
                  </View>
                </Pressable>

                {/* Method 2: Privy */}
                <Pressable
                  onPress={() => setSelectedMethod("privy")}
                  className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                    selectedMethod === "privy" ? "border-2 border-primary bg-surface-container-low" : "border-outline-variant bg-surface"
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === "privy" ? "border-primary" : "border-outline-variant"}`}>
                    {selectedMethod === "privy" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </View>
                  <View className="flex-row flex-1 items-center justify-between" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <View className="flex-row items-center gap-2" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Wallet color={selectedMethod === "privy" ? "#001caa" : "#5b5e66"} size={20} />
                      <Text className="text-body-md text-on-surface font-medium font-jakarta">cNGN Wallet</Text>
                    </View>
                    <View className="bg-surface-container px-2 py-0.5 rounded-full">
                      <Text className="text-label-sm text-secondary font-jakarta">Privy</Text>
                    </View>
                  </View>
                </Pressable>

              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      {!paymentSuccess && (
        <View className="bg-surface border-t border-outline-variant p-4 z-50">
          <View className="flex-col gap-2 max-w-[600px] mx-auto w-full">
            <View className="flex-row items-center justify-center gap-1 mb-1">
              <Lock color="#5b5e66" size={14} />
              <Text className="text-label-sm text-secondary font-jakarta">Secure encrypted processing</Text>
            </View>
            <Pressable
              onPress={handlePayNow}
              disabled={isProcessing}
              className="w-full bg-primary h-14 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
            >
              {isProcessing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text className="text-on-primary font-bold text-headline-md font-jakarta">Pay ₦{total} Now</Text>
                  <ArrowRight color="#ffffff" size={20} />
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

