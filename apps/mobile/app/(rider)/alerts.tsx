import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Gift, AlertTriangle, ShieldCheck } from "lucide-react-native";

export default function Notifications() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "promos" | "system">("all");

  const notifications = [
    {
      id: "1",
      title: "Driver Nearby!",
      body: "Your driver Kelechi Okafor is 1 min away from SEET Roundabout.",
      time: "2 mins ago",
      type: "system",
      unread: true,
    },
    {
      id: "2",
      title: "Ride Booked Successfully",
      body: "Your ride request to Senate Building has been accepted by Kelechi Okafor.",
      time: "5 mins ago",
      type: "system",
      unread: false,
    },
    {
      id: "3",
      title: "Promo Code Added!",
      body: "Get 20% off your next 5 rides inside FUTO campus using code FUTOCAMPUS20.",
      time: "1 hour ago",
      type: "promos",
      unread: true,
    },
    {
      id: "4",
      title: "Security Update",
      body: "Emergency SOS services have been successfully upgraded. Stay safe on campus!",
      time: "1 day ago",
      type: "system",
      unread: false,
    }
  ];

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    return notif.type === filter;
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
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Notifications</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} className="flex-grow">
        {/* Filter Tabs */}
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
            onPress={() => setFilter("promos")}
            className={`px-4 py-2 rounded-full border ${
              filter === "promos" ? "bg-primary border-primary" : "bg-white border-outline-variant/15"
            }`}
          >
            <Text className={`font-jakarta text-body-sm font-bold ${filter === "promos" ? "text-white" : "text-secondary"}`}>
              Promos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("system")}
            className={`px-4 py-2 rounded-full border ${
              filter === "system" ? "bg-primary border-primary" : "bg-white border-outline-variant/15"
            }`}
          >
            <Text className={`font-jakarta text-body-sm font-bold ${filter === "system" ? "text-white" : "text-secondary"}`}>
              System
            </Text>
          </Pressable>
        </View>

        {/* Notifications List */}
        <View className="gap-4">
          {filteredNotifications.map((notif) => {
            const isPromo = notif.type === "promos";
            return (
              <View
                key={notif.id}
                className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm flex-row items-start gap-4 relative"
              >
                {/* Left side Icon Badge */}
                <View className={`w-11 h-11 rounded-2xl items-center justify-center shrink-0 ${
                  isPromo ? "bg-amber-100" : "bg-primary/10"
                }`}>
                  {isPromo ? (
                    <Gift color="#d97706" size={20} />
                  ) : (
                    <Bell color="#001caa" size={20} />
                  )}
                </View>

                {/* Middle content */}
                <View className="flex-1 pr-4">
                  <Text className="text-body-md font-bold text-on-surface font-jakarta">{notif.title}</Text>
                  <Text className="text-body-sm text-secondary font-jakarta leading-5 mt-1">{notif.body}</Text>
                  <Text className="text-[10px] text-secondary font-bold font-jakarta mt-2.5">{notif.time}</Text>
                </View>

                {/* Top Right Blue Unread Dot */}
                {notif.unread && (
                  <View className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
