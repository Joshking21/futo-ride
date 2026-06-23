import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, CreditCard, Wallet, Check, ShieldCheck } from "lucide-react-native";

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
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-margin-mobile h-touch-target border-b border-outline-variant bg-surface-container-lowest">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-surface-container">
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary font-jakarta">Checkout</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-margin-mobile py-6">
        {paymentSuccess ? (
          <View className="flex-1 items-center justify-center py-10">
            <View className="w-16 h-16 rounded-full bg-success/20 items-center justify-center mb-4">
              <Check color="#22c55e" size={32} />
            </View>
            <Text className="text-headline-md font-bold text-on-surface">Payment Successful</Text>
            <Text className="text-body-sm text-secondary mt-1">Directing you back to your trip...</Text>
          </View>
        ) : (
          <View className="flex-1 max-w-md mx-auto w-full">
            
            {/* Summary Card */}
            <View className="mb-8">
              <Text className="text-headline-sm font-semibold text-on-surface mb-3">Ride Summary</Text>
              <View className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-body-md text-secondary font-medium">Base Fare</Text>
                  <Text className="text-body-md text-on-surface font-semibold">₦ {baseFare}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-body-md text-secondary font-medium">Priority Fee</Text>
                  <Text className="text-body-md text-on-surface font-semibold">₦ {priorityFee}</Text>
                </View>
                <View className="border-t border-outline-variant/20 my-2 pt-3 flex-row justify-between items-end">
                  <Text className="text-body-lg font-bold text-on-surface">Total</Text>
                  <Text className="text-headline-lg-mobile font-black text-primary">₦ {total}</Text>
                </View>
              </View>
            </View>

            {/* Payment Methods */}
            <View className="mb-8">
              <Text className="text-headline-sm font-semibold text-on-surface mb-4">Payment Method</Text>
              <View className="gap-3">
                
                {/* Option 1: Monnify */}
                <Pressable
                  onPress={() => setSelectedMethod("monnify")}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    selectedMethod === "monnify"
                      ? "bg-primary/5 border-primary border-2"
                      : "bg-surface-container-lowest border-outline-variant/40 border"
                  }`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                    selectedMethod === "monnify" ? "bg-primary/10 text-primary" : "bg-surface-container text-secondary"
                  }`}>
                    <CreditCard color={selectedMethod === "monnify" ? "#001caa" : "#5b5e66"} size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-lg font-bold text-on-surface">Monnify</Text>
                    <Text className="text-body-sm text-secondary">Card or Bank Transfer</Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full items-center justify-center ${
                    selectedMethod === "monnify" ? "bg-primary shadow-sm" : "border border-outline-variant"
                  }`}>
                    {selectedMethod === "monnify" && <Check color="#ffffff" size={14} />}
                  </View>
                </Pressable>

                {/* Option 2: Privy */}
                <Pressable
                  onPress={() => setSelectedMethod("privy")}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    selectedMethod === "privy"
                      ? "bg-primary/5 border-primary border-2"
                      : "bg-surface-container-lowest border-outline-variant/40 border"
                  }`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                    selectedMethod === "privy" ? "bg-primary/10 text-primary" : "bg-surface-container text-secondary"
                  }`}>
                    <Wallet color={selectedMethod === "privy" ? "#001caa" : "#5b5e66"} size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-lg font-bold text-on-surface">Privy</Text>
                    <Text className="text-body-sm text-secondary">cNGN Wallet</Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full items-center justify-center ${
                    selectedMethod === "privy" ? "bg-primary shadow-sm" : "border border-outline-variant"
                  }`}>
                    {selectedMethod === "privy" && <Check color="#ffffff" size={14} />}
                  </View>
                </Pressable>

              </View>
            </View>

          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      {!paymentSuccess && (
        <View className="bg-surface border-t border-outline-variant/30 px-margin-mobile py-4 z-20">
          <View className="max-w-md mx-auto w-full">
            <Pressable
              onPress={handlePayNow}
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary-container h-14 rounded-xl items-center justify-center shadow-md active:scale-[0.98] transition-transform"
            >
              {isProcessing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-on-primary text-action-lg font-bold">Pay Now</Text>
              )}
            </Pressable>
            <View className="flex-row items-center justify-center mt-3 text-secondary gap-1">
              <ShieldCheck color="#5b5e66" size={14} />
              <Text className="text-label-sm text-secondary">Secure SSL Processing</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
