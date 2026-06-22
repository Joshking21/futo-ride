import React, { useState } from "react";
import { View, Text, Pressable, Image, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, Wallet, Route, Clock, Star, ArrowRight } from "lucide-react-native";

export default function TripReceipt() {
  const router = useRouter();
  const { activeTrip, clearActiveTrip } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleDone = () => {
    clearActiveTrip();
    router.replace("/(rider)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-container-low" edges={["top"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-margin-mobile py-6 justify-center">
        <View className="w-full max-w-md bg-surface rounded-xl shadow-lg border border-outline-variant/30 p-6 flex flex-col gap-6 mx-auto">
          
          {/* Success Header */}
          <View className="items-center text-center gap-2 pt-2">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center shadow-md mb-2">
              <CheckCircle2 color="#001caa" size={48} />
            </View>
            <Text className="text-headline-lg-mobile font-bold text-on-surface">Trip Complete!</Text>
            <Text className="text-body-sm text-secondary">Thanks for riding with Futo Ride.</Text>
          </View>

          {/* Receipt Info Card */}
          <View className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 flex flex-col gap-3">
            <View className="flex-row justify-between items-center border-b border-outline-variant/30 pb-3">
              <Text className="text-body-md text-on-surface-variant font-medium">Total Fare</Text>
              <Text className="text-headline-sm font-black text-primary">₦ {activeTrip.price || 400}</Text>
            </View>
            
            <View className="flex-row justify-between items-center py-1">
              <View className="flex-row items-center gap-2">
                <Wallet color="#5b5e66" size={16} />
                <Text className="text-body-sm text-secondary font-medium">Payment Method</Text>
              </View>
              <Text className="text-body-sm text-on-surface font-bold">Naira Cash</Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <View className="flex-row items-center gap-2">
                <Route color="#5b5e66" size={16} />
                <Text className="text-body-sm text-secondary font-medium">Distance</Text>
              </View>
              <Text className="text-body-sm text-on-surface font-semibold">2.4 km</Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <View className="flex-row items-center gap-2">
                <Clock color="#5b5e66" size={16} />
                <Text className="text-body-sm text-secondary font-medium">Duration</Text>
              </View>
              <Text className="text-body-sm text-on-surface font-semibold">12 mins</Text>
            </View>
          </View>

          {/* Driver Rating Card */}
          <View className="items-center gap-3 pt-2">
            <Text className="text-body-lg font-bold text-on-surface">How was your driver?</Text>
            <View className="flex-row items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 w-full mb-1">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
                }}
                className="w-12 h-12 rounded-full object-cover"
              />
              <View>
                <Text className="text-body-md font-bold text-on-surface">Chidi</Text>
                <Text className="text-body-sm text-secondary">Keke Operator</Text>
              </View>
            </View>

            {/* Stars mechanism */}
            <View className="flex-row justify-center gap-2 my-2 w-full">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)} className="p-1">
                  <Star
                    color={star <= rating ? "#eab308" : "#c5c5d8"}
                    fill={star <= rating ? "#eab308" : "transparent"}
                    size={32}
                  />
                </Pressable>
              ))}
            </View>

            {/* Comments input */}
            <TextInput
              multiline
              numberOfLines={3}
              placeholder="Leave a comment (optional)..."
              placeholderTextColor="#c5c5d8"
              value={comment}
              onChangeText={setComment}
              className="w-full h-20 bg-surface rounded-lg border border-outline-variant/50 p-3 text-body-sm text-on-surface focus:border-on-surface"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Action button */}
          <View className="pt-2">
            <Pressable
              onPress={handleDone}
              className="w-full bg-primary hover:bg-primary-container h-12 rounded-lg flex-row items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
            >
              <Text className="text-on-primary text-action-lg font-bold">Done</Text>
              <ArrowRight color="#ffffff" size={16} />
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
