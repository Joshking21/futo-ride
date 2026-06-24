import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, XCircle, MapPin, Car, Ban, Star, Sliders, Wallet } from "lucide-react-native";

export default function RideHistory() {
  const { rideHistory } = useApp();
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");

  const filteredRides = rideHistory.filter((ride) => {
    if (filter === "all") return true;
    return ride.status === filter;
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top Header */}
      <View className="px-4 h-16 bg-surface border-b border-outline-variant flex-row items-center justify-between">
        <Text className="text-headline-md font-bold text-primary font-jakarta">Futo Ride</Text>
        <Pressable className="p-2 rounded-full active:bg-surface-container-high">
          <Wallet color="#001caa" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-4 py-6">
        {/* Title and Subtitle */}
        <View className="mb-6">
          <Text className="text-headline-lg-mobile font-bold text-on-surface font-jakarta">Your Rides</Text>
          <Text className="text-body-md text-secondary mt-1 font-jakarta">Review your past trips and transactions.</Text>
        </View>

        {/* Filter Tab Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6 gap-2" contentContainerStyle={{ gap: 8 }}>
          <Pressable
            onPress={() => setFilter("all")}
            className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${
              filter === "all" ? "bg-primary-container border-primary" : "bg-surface-container border-outline-variant"
            }`}
          >
            <CheckCircle2 color={filter === "all" ? "#ffffff" : "#0b1c30"} size={16} />
            <Text className={`text-label-md font-bold font-jakarta ${filter === "all" ? "text-white" : "text-on-surface"}`}>
              All Rides
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("completed")}
            className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${
              filter === "completed" ? "bg-primary-container border-primary" : "bg-surface-container border-outline-variant"
            }`}
          >
            <CheckCircle2 color={filter === "completed" ? "#ffffff" : "#0b1c30"} size={16} />
            <Text className={`text-label-md font-bold font-jakarta ${filter === "completed" ? "text-white" : "text-on-surface"}`}>
              Completed
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("cancelled")}
            className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${
              filter === "cancelled" ? "bg-primary-container border-primary" : "bg-surface-container border-outline-variant"
            }`}
          >
            <Ban color={filter === "cancelled" ? "#ffffff" : "#0b1c30"} size={16} />
            <Text className={`text-label-md font-bold font-jakarta ${filter === "cancelled" ? "text-white" : "text-on-surface"}`}>
              Cancelled
            </Text>
          </Pressable>
        </ScrollView>

        {/* Ride List */}
        <View className="gap-4">
          {filteredRides.length === 0 ? (
            <View className="items-center justify-center py-20 bg-surface-container rounded-xl border border-outline-variant p-6">
              <Text className="text-body-md text-secondary font-jakarta">No rides found in this category.</Text>
            </View>
          ) : (
            filteredRides.map((ride) => {
              const isCompleted = ride.status === "completed";

              return (
                <View
                  key={ride.id}
                  className="bg-surface-container rounded-xl border border-outline-variant p-4 shadow-sm gap-4"
                >
                  {/* Card Header */}
                  <View className="flex-row justify-between items-start border-b border-outline-variant pb-3">
                    <View className="flex-row items-center gap-3">
                      <View className={`p-2 rounded-full ${isCompleted ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}`}>
                        {isCompleted ? <Car color="#001caa" size={20} /> : <Ban color="#ba1a1a" size={20} />}
                      </View>
                      <View>
                        <Text className="text-label-md font-bold text-on-surface font-jakarta">{ride.date}</Text>
                        <Text className="text-body-sm text-secondary font-jakarta">Standard Ride</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`text-headline-md font-bold text-on-surface font-jakarta ${!isCompleted && "line-through text-outline"}`}>
                        ₦{ride.price}
                      </Text>
                      <View className={`px-2 py-0.5 rounded ${isCompleted ? "bg-[#dcfce7]" : "bg-error-container"}`}>
                        <Text className={`text-[10px] font-bold uppercase tracking-wider ${isCompleted ? "text-[#166534]" : "text-on-error-container"}`}>
                          {ride.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Route Timeline */}
                  <View className="relative pl-6 py-1">
                    {/* Visual Line */}
                    <View className="absolute left-[11px] top-[24px] bottom-[24px] w-[2px] bg-outline-variant" />
                    
                    {/* Pickup */}
                    <View className="relative flex-row items-start mb-4">
                      <View className="absolute left-[-20px] top-1.5 w-3 h-3 rounded-full bg-primary" />
                      <View className="pl-2">
                        <Text className="text-body-sm text-secondary font-jakarta">Pickup</Text>
                        <Text className="text-body-md font-medium text-on-surface font-jakarta">{ride.pickup}</Text>
                      </View>
                    </View>

                    {/* Dropoff */}
                    <View className="relative flex-row items-start">
                      <View className="absolute left-[-20px] top-1.5 w-3 h-3 rounded-sm bg-primary" />
                      <View className="pl-2">
                        <Text className="text-body-sm text-secondary font-jakarta">Dropoff</Text>
                        <Text className="text-body-md font-medium text-on-surface font-jakarta">{ride.destination}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Driver Card Footer */}
                  {isCompleted ? (
                    <View className="flex-row items-center justify-between bg-surface-container-low rounded-lg p-3 mt-1">
                      <View className="flex-row items-center gap-3">
                        <Image
                          source={{
                            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIG7wmf5FAP2-UmEzriD84RuYs2fB7Z10TJT8FNdR1y1ISI3Nc8LZuGLgXYwq4srjRU2Gs_PF0X-0IpbBOlm-6Exiq_azESmJGy4bGVW6WKIQLsfeguHHLzqB8DSyRsL6_uycAB59bNo2fWUbaVVW-1W2F8jFRh_kcry_-s8P52ZAne20wBLNgZlufCFaflD_CbHcsB48s7sTq16uXnBAANGNpkWcUMXKboqF8UuN-zMLKBMvgiAO44oIoONPbZZ-38BCE5CFv3bHb",
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
                        />
                        <View>
                          <Text className="text-label-md font-bold text-on-surface font-jakarta">{ride.driverName}</Text>
                          <View className="flex-row items-center gap-1">
                            <Star color="#fbbf24" fill="#fbbf24" size={12} />
                            <Text className="text-label-sm text-secondary font-jakarta">4.9 • Campus Keke</Text>
                          </View>
                        </View>
                      </View>
                      <Pressable className="active:opacity-75">
                        <Text className="text-primary text-label-md font-bold font-jakarta">Receipt</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="bg-surface-container-low rounded-lg p-3 mt-1">
                      <Text className="text-body-sm text-secondary italic font-jakarta">Trip cancelled by rider.</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

