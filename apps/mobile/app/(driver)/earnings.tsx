import { useRouter } from "expo-router";
import { ArrowLeft, Clock, Navigation, Wallet, Star, ChevronRight, TrendingUp } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DriverEarnings() {
  const router = useRouter();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [balance, setBalance] = useState(18450);

  const handleWithdraw = () => {
    if (balance <= 0) return;
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      Alert.alert(
        "Withdrawal Initiated",
        `Your payout of ${balance.toLocaleString()} cNGN is being processed and will arrive in your wallet shortly.`,
        [{ text: "OK", onPress: () => setBalance(0) }]
      );
    }, 1500);
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
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Earnings</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }} className="flex-1">
        {/* Today's Earnings Card */}
        <View className="bg-white rounded-[36px] border border-outline-variant/10 shadow-sm p-6 gap-6">
          <View className="items-center">
            <Text className="text-body-sm text-secondary font-jakarta">Today's Earnings</Text>
            <Text className="text-headline-xl font-bold text-primary font-jakarta mt-1">₦12,500.00</Text>
          </View>
          
          <View className="flex-row gap-4 border-t border-outline-variant/10 pt-5">
            {/* Stat 1 */}
            <View className="flex-1 items-center">
              <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mb-2">
                <Navigation color="#001caa" size={18} className="rotate-45" />
              </View>
              <Text className="text-headline-sm font-bold text-on-surface font-jakarta">14</Text>
              <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Trips Completed</Text>
            </View>

            {/* Stat 2 */}
            <View className="flex-grow items-center">
              <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mb-2">
                <Clock color="#001caa" size={18} />
              </View>
              <Text className="text-headline-sm font-bold text-on-surface font-jakarta">4h 20m</Text>
              <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Online Time</Text>
            </View>
          </View>
        </View>

        {/* cNGN Wallet Balance Card */}
        <View className="bg-white rounded-[36px] border border-outline-variant/10 shadow-sm p-6 gap-5">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center">
              <Wallet color="#001caa" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-bold text-on-surface font-jakarta">cNGN Wallet Balance</Text>
              <Text className="text-[10px] text-secondary font-jakarta font-mono mt-0.5">0xA3f5...9bC1d</Text>
            </View>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-outline-variant/5">
            <Text className="text-body-sm text-secondary font-jakarta">Available Balance</Text>
            <Text className="text-headline-md font-bold text-primary font-jakarta mt-1">
              {balance.toLocaleString()}.00 cNGN
            </Text>
            <Text className="text-body-sm text-secondary font-jakarta mt-0.5">
              ≈ ₦{balance.toLocaleString()}.00
            </Text>
          </View>

          <Pressable
            onPress={handleWithdraw}
            disabled={isWithdrawing || balance <= 0}
            className={`w-full h-14 rounded-full flex items-center justify-center shadow-md active:scale-[0.98] ${
              balance > 0 ? "bg-[#0b1c30]" : "bg-outline-variant/30"
            }`}
          >
            {isWithdrawing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className={`text-action-lg font-bold font-jakarta ${balance > 0 ? "text-white" : "text-secondary"}`}>
                Withdraw Payout
              </Text>
            )}
          </Pressable>
        </View>

        {/* Weekly Performance stats */}
        <View className="gap-2">
          <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider font-jakarta">Weekly Performance</Text>
          <View className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
            {/* Stat item 1 */}
            <View className="flex-row items-center justify-between p-4 border-b border-outline-variant/5">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-outline-variant/5">
                  <TrendingUp color="#001caa" size={20} />
                </View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Weekly Total Trips</Text>
              </View>
              <Text className="text-body-md font-bold text-on-surface font-jakarta">84 trips</Text>
            </View>

            {/* Stat item 2 */}
            <View className="flex-row items-center justify-between p-4 border-b border-outline-variant/5">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-outline-variant/5">
                  <Star color="#001caa" size={20} />
                </View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Acceptance Rate</Text>
              </View>
              <Text className="text-body-md font-bold text-on-surface font-jakarta">98%</Text>
            </View>

            {/* Stat item 3 */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-outline-variant/5">
                  <Star color="#eab308" fill="#eab308" size={20} />
                </View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Driver Rating</Text>
              </View>
              <Text className="text-body-md font-bold text-on-surface font-jakarta">4.9</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
