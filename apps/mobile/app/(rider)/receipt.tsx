import React, { useState } from "react";
import { View, Text, Pressable, Image, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, Wallet, Route, Clock, Star, ArrowRight, X } from "lucide-react-native";

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
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-4 h-16 bg-surface border-b border-outline-variant">
        <Pressable onPress={handleDone} className="p-2 -ml-2 rounded-full active:bg-surface-container-high transition-colors">
          <X color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-sm font-bold text-primary font-jakarta">Futo Ride</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Success Header */}
        <View className="items-center text-center mb-8 pt-2">
          <View className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-4 shadow-lg shadow-primary-container/20">
            <CheckCircle2 color="#ffffff" size={40} fill="#1d35d1" />
          </View>
          <Text className="text-headline-md font-bold text-on-background mb-2 font-jakarta">Trip Complete</Text>
          <Text className="text-body-md text-secondary font-jakarta text-center">Hope you enjoyed your ride across campus.</Text>
        </View>

        {/* Receipt Card */}
        <View className="bg-surface-container rounded-xl p-5 border border-outline-variant shadow-sm mb-6">
          <View className="flex-row justify-between items-end border-b border-outline-variant pb-4 mb-4">
            <View>
              <Text className="text-label-md text-secondary mb-1 font-jakarta">Total Fare</Text>
              <Text className="text-headline-xl font-bold text-primary font-jakarta">₦{activeTrip.price || 400}</Text>
            </View>
            <View className="bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant">
              <Text className="text-label-sm text-on-surface font-jakarta">Naira Cash</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between pt-1">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                <Route color="#001caa" size={18} />
              </View>
              <View>
                <Text className="text-label-sm text-secondary font-jakarta">Distance</Text>
                <Text className="text-body-md text-on-surface font-medium font-jakarta">2.4 km</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                <Clock color="#001caa" size={18} />
              </View>
              <View>
                <Text className="text-label-sm text-secondary font-jakarta">Duration</Text>
                <Text className="text-body-md text-on-surface font-medium font-jakarta">12 mins</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm mb-6">
          <Text className="text-headline-sm font-bold text-on-background mb-4 text-center font-jakarta">How was your driver?</Text>
          
          <View className="flex-col items-center mb-4">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
              }}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-container mb-2"
            />
            <Text className="text-body-lg font-bold text-on-surface font-jakarta">Chukwuemeka O.</Text>
            <Text className="text-label-sm text-secondary font-jakarta">Keke Napep • FTO-492-XA</Text>
          </View>

          {/* Stars Row */}
          <View className="flex-row justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} className="p-1">
                <Star
                  color={star <= rating ? "#001caa" : "#757687"}
                  fill={star <= rating ? "#001caa" : "transparent"}
                  size={32}
                />
              </Pressable>
            ))}
          </View>

          {/* Comment/Compliment Input */}
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="Leave a compliment or comment (optional)"
            placeholderTextColor="#757687"
            value={comment}
            onChangeText={setComment}
            className="w-full bg-surface rounded-lg border border-outline-variant p-4 text-body-md text-on-surface font-jakarta"
            style={{ textAlignVertical: "top", minHeight: 80 }}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest p-4 border-t border-outline-variant z-40">
        <Pressable
          onPress={handleDone}
          className="w-full h-12 bg-primary rounded-lg flex items-center justify-center shadow-md active:scale-[0.98] transition-all"
        >
          <Text className="text-on-primary text-label-md font-bold font-jakarta">Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

