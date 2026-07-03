import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { X, Check, Star } from "lucide-react-native";

export default function TripReceipt() {
  const router = useRouter();
  const { activeTrip } = useApp();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  const handleDone = () => {
    router.replace("/(rider)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top", "bottom"]}>
      {/* Top Header Row with Close Button */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[64px] bg-white border-b border-outline-variant/10 z-20">
        <Pressable
          onPress={handleDone}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <X color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Trip Receipt</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }} className="flex-1">
        {/* Success checkmark banner */}
        <View className="items-center py-4">
          <View className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-3">
            <Check color="#22c55e" size={32} strokeWidth={3} />
          </View>
          <Text className="text-headline-lg font-bold text-on-surface text-center font-jakarta">
            Trip Completed!
          </Text>
          <Text className="text-body-sm text-secondary text-center font-jakarta mt-1">
            Thank you for riding with Futo Ride
          </Text>
        </View>

        {/* Total Paid box */}
        <View className="bg-primary/5 rounded-3xl p-5 border border-primary/10 items-center justify-center gap-1">
          <Text className="text-body-sm text-secondary font-jakarta">Total Paid</Text>
          <Text className="text-headline-xl font-bold text-primary font-jakarta">₦950.00</Text>
          <Text className="text-body-sm text-secondary font-jakarta font-semibold mt-1">
            Paid with cNGN Wallet
          </Text>
          <Text className="text-[11px] text-secondary font-jakarta font-mono">0xA3f5...9bC1d</Text>
        </View>

        {/* Receipt Details Box */}
        <View className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm gap-4">
          <Text className="text-label-sm font-bold text-secondary uppercase tracking-wider font-jakarta">Receipt Details</Text>
          
          <View className="flex-row justify-between items-center pb-2 border-b border-outline-variant/5">
            <Text className="text-body-sm text-secondary font-jakarta">Trip ID</Text>
            <Text className="text-body-sm text-on-surface font-mono font-bold">FUTO-984-KLX</Text>
          </View>

          <View className="flex-row justify-between items-center pb-2 border-b border-outline-variant/5">
            <Text className="text-body-sm text-secondary font-jakarta">Date & Time</Text>
            <Text className="text-body-sm text-on-surface font-jakarta font-bold">27 June 2026, 04:32 PM</Text>
          </View>

          <View className="flex-col gap-1 pb-2 border-b border-outline-variant/5">
            <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">Pickup</Text>
            <Text className="text-body-sm text-on-surface font-jakarta font-bold">{activeTrip.pickup || "SEET Roundabout, FUTO"}</Text>
          </View>

          <View className="flex-col gap-1">
            <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">Destination</Text>
            <Text className="text-body-sm text-on-surface font-jakarta font-bold">{activeTrip.destination || "Senate Building, FUTO"}</Text>
          </View>
        </View>

        {/* Rate Driver Section */}
        <View className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm gap-4">
          <Text className="text-label-sm font-bold text-secondary uppercase tracking-wider font-jakarta text-center">Rate your driver</Text>
          
          {/* Star selector */}
          <View className="flex-row items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} className="p-1 active:scale-110">
                <Star
                  color={star <= rating ? "#f59e0b" : "#c5c5d8"}
                  fill={star <= rating ? "#f59e0b" : "transparent"}
                  size={32}
                />
              </Pressable>
            ))}
          </View>

          {/* Optional comments input */}
          <TextInput
            placeholder="Write feedback (optional)"
            placeholderTextColor="#c5c5d8"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
            className="w-full bg-surface border border-outline-variant/10 rounded-2xl p-4 text-body-md text-on-surface font-jakarta"
          />
        </View>

        {/* Done Button */}
        <Pressable
          onPress={handleDone}
          className="w-full bg-[#0b1c30] h-14 rounded-full flex items-center justify-center shadow-md active:scale-[0.98] mt-2"
        >
          <Text className="text-white text-action-lg font-bold font-jakarta">Done</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
