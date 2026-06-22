import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { Landmark, ArrowUpRight, TrendingUp, ShieldAlert, Award } from "lucide-react-native";

export default function DriverEarnings() {
  const { earnings } = useApp();
  const [balance, setBalance] = useState(4500);
  const [isCashingOut, setIsCashingOut] = useState(false);

  const handleCashout = () => {
    if (balance <= 0) return;
    setIsCashingOut(true);
    setTimeout(() => {
      setIsCashingOut(false);
      Alert.alert("Success", `₦ ${balance} has been successfully transferred to your linked bank account.`);
      setBalance(0);
    }, 1500);
  };

  const mockTrips = [
    { from: "FUTO Main Gate", to: "SBAS Building", time: "Today, 2:15 PM", fare: 400 },
    { from: "Eziobodo", to: "SEET Complex", time: "Today, 1:30 PM", fare: 500 },
    { from: "Umuchima", to: "FUTO Library", time: "Today, 11:45 AM", fare: 600 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest">
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Earnings Summary</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-margin-mobile py-6">
        
        {/* Available Balance Card */}
        <View className="bg-primary rounded-xl p-6 shadow-sm mb-6 relative overflow-hidden flex flex-col items-center text-center">
          <View className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none" />
          <Text className="text-label-sm text-primary-fixed-dim uppercase tracking-wider mb-2 font-bold">
            Available Balance
          </Text>
          <Text className="text-headline-lg-mobile font-black text-white mb-4">
            ₦ {balance.toLocaleString()}.00
          </Text>
          <Pressable
            onPress={handleCashout}
            disabled={isCashingOut || balance <= 0}
            className={`w-full h-12 rounded-lg items-center justify-center shadow-md flex-row gap-2 ${
              balance > 0 ? "bg-white active:bg-surface-container-low" : "bg-white/50"
            }`}
          >
            {isCashingOut ? (
              <ActivityIndicator color="#001caa" />
            ) : (
              <>
                <Landmark color="#001caa" size={16} />
                <Text className="text-primary text-action-lg font-bold">Cashout Now</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 text-center">
            <Text className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">
              Today's Trips
            </Text>
            <Text className="text-body-lg font-black text-on-surface">{earnings.tripsCount}</Text>
          </View>
          <View className="flex-1 bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 text-center">
            <Text className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-1">
              Weekly Total
            </Text>
            <Text className="text-body-lg font-black text-on-surface">₦ 28,400</Text>
          </View>
        </View>

        {/* Recent Trips */}
        <View>
          <View className="flex-row justify-between items-end mb-3 border-b border-outline-variant/20 pb-2">
            <Text className="text-body-lg font-bold text-on-surface">Recent Trips</Text>
            <Pressable>
              <Text className="text-label-sm text-primary font-bold">View All</Text>
            </Pressable>
          </View>

          <View className="flex flex-col gap-3 mt-3">
            {mockTrips.map((trip, idx) => (
              <View
                key={idx}
                className="flex-row justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-surface-container p-2 rounded-full">
                    <ArrowUpRight color="#5b5e66" size={18} />
                  </View>
                  <View>
                    <Text className="text-body-sm font-semibold text-on-surface">
                      {trip.from} to {trip.to}
                    </Text>
                    <Text className="text-[11px] text-secondary mt-0.5">{trip.time}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-body-md font-bold text-primary">₦ {trip.fare}</Text>
                  <View className="bg-success/10 px-2 py-0.5 rounded mt-1">
                    <Text className="text-[9px] font-bold text-success uppercase">Paid</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
