import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Navigation,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";

export default function DriverEarnings() {
  const router = useRouter();
  const { earnings } = useApp();
  const [balance, setBalance] = useState(4500);
  const [isCashingOut, setIsCashingOut] = useState(false);

  const handleCashout = () => {
    if (balance <= 0) return;
    setIsCashingOut(true);
    setTimeout(() => {
      setIsCashingOut(false);
      Alert.alert(
        "Success",
        `₦ ${balance} has been successfully transferred to your linked bank account.`,
      );
      setBalance(0);
    }, 1500);
  };

  const mockTrips = [
    {
      from: "FUTO Main Gate",
      to: "SOES Building",
      time: "Today, 10:45 AM",
      fare: 450,
    },
    { from: "Senate Bldg", to: "Hostel C", time: "Today, 09:15 AM", fare: 300 },
    {
      from: "Owerri Road",
      to: "FUTO Gate",
      time: "Yesterday, 04:30 PM",
      fare: 1200,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="px-4 h-16 bg-surface border-b border-outline-variant flex-row items-center justify-between z-30">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors"
        >
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-lg font-bold text-primary font-jakarta">
          Earnings Summary
        </Text>
        <Pressable className="w-10 h-10 bg-surface-container-lowest rounded-full border border-outline-variant items-center justify-center">
          <Wallet color="#001caa" size={20} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 px-4 py-6"
      >
        {/* Available Balance Card */}
        <View className="bg-primary rounded-xl p-6 shadow-md mb-6 relative overflow-hidden flex-col items-center">
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <View className="absolute right-10 bottom-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <View className="items-center z-10 w-full">
            <Text className="text-label-sm font-bold text-white/80 uppercase tracking-wider mb-2 font-jakarta">
              Available Balance
            </Text>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-headline-xl font-bold text-white font-jakarta">
                ₦{balance.toLocaleString()}
              </Text>
              <Text className="text-label-md font-bold text-white/80 font-jakarta">
                .00
              </Text>
            </View>

            <Pressable
              onPress={handleCashout}
              disabled={isCashingOut || balance <= 0}
              className={`w-full h-12 rounded-full items-center justify-center flex-row gap-2 shadow-sm ${
                balance > 0
                  ? "bg-white active:bg-surface-container"
                  : "bg-white/50"
              }`}
            >
              <View className="flex-row flex justify-center items-center">
                <Text className="text-primary text-label-md text-center flex justify-center items-center font-bold font-jakarta">
                  Cashout Now
                </Text>
                {isCashingOut ? (
                  <ActivityIndicator color="#001caa" size="small" />
                ) : (
                  <>
                    <ArrowRight color="#001caa" size={16} />
                  </>
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Bento Stats Grid */}
        <View className="flex-row gap-4 mb-6">
          {/* Today's Trips Card */}
          <View className="flex-1 bg-surface-container-lowest  rounded-2xl p-4 shadow-2xl justify-between">
            <View className="flex-row items-center gap-2 text-secondary mb-4">
              <View className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                <Navigation color="#001caa" size={16} />
              </View>
              <Text className="text-label-sm font-bold text-secondary font-jakarta">
                Today's Trips
              </Text>
            </View>
            <View className="flex-row justify-between items-end">
              <Text className="text-headline-lg-mobile font-bold text-on-surface font-jakarta">
                {earnings.tripsCount || 12}
              </Text>
              <View className="flex-row items-center gap-0.5">
                <TrendingUp color="#354be2" size={12} />
                <Text className="text-4 font-bold text-primary font-jakarta">
                  +2
                </Text>
              </View>
            </View>
          </View>

          {/* Weekly Total Card */}
          <View className="flex-1 bg-surface-container-lowest  rounded-2xl p-4 shadow-2xl justify-between">
            <View className="flex-row items-center gap-2 text-secondary mb-4">
              <View className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                <Calendar color="#001caa" size={16} />
              </View>
              <Text className="text-label-sm font-bold text-secondary font-jakarta">
                Weekly Total
              </Text>
            </View>
            <Text className="text-headline-sm font-bold text-on-surface font-jakarta">
              ₦28,400
            </Text>
          </View>
        </View>

        {/* Recent Trips Section */}
        <View>
          <View className="flex-row justify-between items-center mb-4 px-1">
            <Text className="text-headline-md font-bold text-on-surface font-jakarta">
              Recent Trips
            </Text>
            <Pressable className="active:opacity-75">
              <Text className="text-label-md font-bold text-primary font-jakarta">
                View All
              </Text>
            </Pressable>
          </View>

          <View className=" rounded-xl w-full ">
            {mockTrips.map((trip, idx) => (
              <View
                key={idx}
                className="p-4 flex-row justify-between w-full items-center border-b border-secondary/10"
              >
                <View className="flex-row items-center  w-[60%] gap-3">
                  <View className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <MapPin color="#001caa" size={18} />
                  </View>
                  <View className=" flex ">
                    <Text className="text-label-md font-bold text-on-surface font-jakarta">
                      {trip.from} to {trip.to}
                    </Text>
                    <Text className="text-body-sm text-secondary  mt-0.5 font-jakarta">
                      {trip.time}
                    </Text>
                  </View>
                </View>
                <View className="items-end w-[40%] ">
                  <Text className="text-label-md font-bold text-on-surface font-jakarta">
                    ₦{trip.fare}
                  </Text>
                  <Text className="text-[10px] font-bold text-primary uppercase font-jakarta mt-0.5">
                    Completed
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
