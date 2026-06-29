import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star, Clock } from "lucide-react-native";

export default function RideHistory() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");

  const rides = [
    {
      id: "1",
      driverName: "Kelechi Okafor",
      date: "27 June 2026, 04:32 PM",
      pickup: "SEET Roundabout",
      destination: "Senate Building",
      price: "950.00",
      status: "completed",
      vehicle: "Keke",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7"
    },
    {
      id: "2",
      driverName: "Chukwuemeka O.",
      date: "25 June 2026, 11:15 AM",
      pickup: "FUTO Main Gate",
      destination: "Hall C Hostel",
      price: "850.00",
      status: "completed",
      vehicle: "Keke",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIG7wmf5FAP2-UmEzriD84RuYs2fB7Z10TJT8FNdR1y1ISI3Nc8LZuGLgXYwq4srjRU2Gs_PF0X-0IpbBOlm-6Exiq_azESmJGy4bGVW6WKIQLsfeguHHLzqB8DSyRsL6_uycAB59bNo2fWUbaVVW-1W2F8jFRh_kcry_-s8P52ZAne20wBLNgZlufCFaflD_CbHcsB48s7sTq16uXnBAANGNpkWcUMXKboqF8UuN-zMLKBMvgiAO44oIoONPbZZ-38BCE5CFv3bHb"
    },
    {
      id: "3",
      driverName: "Kelechi Okafor",
      date: "24 June 2026, 02:40 PM",
      pickup: "Health Centre",
      destination: "PGS Complex",
      price: "900.00",
      status: "completed",
      vehicle: "Keke",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7"
    },
    {
      id: "4",
      driverName: "Nonso E.",
      date: "22 June 2026, 09:05 AM",
      pickup: "FUTO Main Gate",
      destination: "SEET Head",
      price: "300.00",
      status: "cancelled",
      vehicle: "Bus",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIG7wmf5FAP2-UmEzriD84RuYs2fB7Z10TJT8FNdR1y1ISI3Nc8LZuGLgXYwq4srjRU2Gs_PF0X-0IpbBOlm-6Exiq_azESmJGy4bGVW6WKIQLsfeguHHLzqB8DSyRsL6_uycAB59bNo2fWUbaVVW-1W2F8jFRh_kcry_-s8P52ZAne20wBLNgZlufCFaflD_CbHcsB48s7sTq16uXnBAANGNpkWcUMXKboqF8UuN-zMLKBMvgiAO44oIoONPbZZ-38BCE5CFv3bHb"
    }
  ];

  const filteredRides = rides.filter((ride) => {
    if (filter === "all") return true;
    return ride.status === filter;
  });

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
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Ride History</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} className="flex-grow">
        {/* Filter Tab Row */}
        <View className="flex-row gap-2.5">
          <Pressable
            onPress={() => setFilter("all")}
            className={`px-4 py-2 rounded-full border ${
              filter === "all" ? "bg-primary border-primary" : "bg-white border-outline-variant/15"
            }`}
          >
            <Text className={`font-jakarta text-body-sm font-bold ${filter === "all" ? "text-white" : "text-secondary"}`}>
              All
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("completed")}
            className={`px-4 py-2 rounded-full border ${
              filter === "completed" ? "bg-primary border-primary" : "bg-white border-outline-variant/15"
            }`}
          >
            <Text className={`font-jakarta text-body-sm font-bold ${filter === "completed" ? "text-white" : "text-secondary"}`}>
              Completed
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-full border ${
              filter === "cancelled" ? "bg-primary border-primary" : "bg-white border-outline-variant/15"
            }`}
          >
            <Text className={`font-jakarta text-body-sm font-bold ${filter === "cancelled" ? "text-white" : "text-secondary"}`}>
              Cancelled
            </Text>
          </Pressable>
        </View>

        {/* Ride History Cards List */}
        <View className="gap-4">
          {filteredRides.map((ride) => {
            const isCompleted = ride.status === "completed";
            return (
              <View
                key={ride.id}
                className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm flex-row items-center justify-between"
              >
                {/* Left Side: Avatar & rating */}
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="items-center">
                    <View className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/10">
                      <Image source={{ uri: ride.avatar }} className="w-full h-full object-cover" />
                    </View>
                    {isCompleted && (
                      <View className="flex-row items-center gap-0.5 mt-1.5 bg-surface px-1.5 py-0.5 rounded-full border border-outline-variant/5">
                        <Star color="#f59e0b" fill="#f59e0b" size={10} />
                        <Text className="text-[9px] font-bold text-on-surface font-jakarta">4.9</Text>
                      </View>
                    )}
                  </View>

                  {/* Middle Info: Name, Date, Route */}
                  <View className="flex-grow">
                    <Text className="text-body-md font-bold text-on-surface font-jakarta">{ride.driverName}</Text>
                    <Text className="text-body-sm text-secondary font-jakarta mt-0.5">{ride.date}</Text>
                    <View className="flex-row items-center mt-2.5 bg-surface px-2.5 py-1.5 rounded-xl border border-outline-variant/5 self-start">
                      <Text className="text-[10px] text-secondary font-bold font-jakarta">
                        {ride.pickup} <Text className="text-primary font-bold">➔</Text> {ride.destination}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Side: Price & Status Pill */}
                <View className="items-end gap-2 shrink-0 pl-2">
                  <Text className="text-body-md font-bold text-on-surface font-jakarta">₦{ride.price}</Text>
                  <View className={`px-3 py-1 rounded-full ${
                    isCompleted ? "bg-success/10" : "bg-error/10"
                  }`}>
                    <Text className={`text-[10px] font-bold font-jakarta uppercase tracking-wider ${
                      isCompleted ? "text-success" : "text-error"
                    }`}>
                      {ride.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
