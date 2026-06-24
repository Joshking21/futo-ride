import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Menu, Wifi, WifiOff, Bell, Navigation, Clock, Star, Radar, Compass, Sparkles, Wallet, MapPin, CheckCircle2 } from "lucide-react-native";

export default function DriverHome() {
  const router = useRouter();
  const { isOnline, setOnline, activeTrip, triggerMockIncomingRequest, confirmBooking } = useApp();

  const handleToggleOnline = () => {
    setOnline(!isOnline);
  };

  const handleAcceptRequest = () => {
    confirmBooking();
    router.push("/(driver)/active");
  };

  const isRequestPending = activeTrip.status === "searching" && activeTrip.pickup === "SOES Building";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top Header Overlay */}
      <View className="flex-row justify-between items-center px-4 h-16 bg-surface border-b border-outline-variant z-20 shadow-sm">
        <Pressable className="w-10 h-10 bg-surface-container-lowest rounded-full border border-outline-variant items-center justify-center">
          <Menu color="#001caa" size={20} />
        </Pressable>

        {/* Online Status Pill */}
        <Pressable
          onPress={handleToggleOnline}
          className={`flex-row items-center gap-2 px-4 py-1.5 rounded-full border ${
            isOnline ? "border-primary bg-primary-container/10" : "border-outline-variant bg-surface-container"
          }`}
        >
          <View className="relative flex h-2 w-2">
            <View className={`absolute h-full w-full rounded-full opacity-75 ${isOnline ? "bg-success animate-ping" : "bg-secondary"}`} />
            <View className={`h-2 w-2 rounded-full ${isOnline ? "bg-success" : "bg-secondary"}`} />
          </View>
          <Text className={`text-label-sm font-bold font-jakarta ${isOnline ? "text-primary" : "text-secondary"}`}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </Pressable>

        <Pressable className="w-10 h-10 bg-surface-container-lowest rounded-full border border-outline-variant items-center justify-center relative">
          <Bell color="#001caa" size={20} />
          <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border border-white" />
        </Pressable>
      </View>

      {/* Main Content Area */}
      <View className="flex-1 relative z-0">
        {/* Interactive Map Background */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0okzKR0KPq91lUrgoEl5fyfMy1B5eqVhArkpdos9nGZDnDI-ks7j4edISnFdnY4EKDclvfu-tXw48XWwCwLTHkiWgUdTJPzw0-Wbjb64syVe-qicEEPGdmkI1X7mJoq5k_B3J8K-Wlt3yAZ33Dzy6Q9HBEh9IjQITFz8IxurvIKiiZPmecWT2IRE_rFhmA4LK39TpJEwR6einizhW-wxyX5mP-M4C_rzF5V9nyd4VRIX-5fdOl05wnH6PWCU_MI8wXXgOBBcGS5kv",
          }}
          className="w-full h-[280px] object-cover"
        />

        {/* Floating location marker in map */}
        <View className="absolute top-[120px] left-[50%] -mt-4 -ml-4 w-8 h-8 bg-primary rounded-full border-4 border-white shadow-md flex items-center justify-center">
          <Text className="text-[12px] text-white">🛺</Text>
        </View>

        {/* Bottom Sheet / Stats Container */}
        <ScrollView className="flex-1 bg-surface px-4 pt-4 rounded-t-[24px] border-t border-outline-variant shadow-lg -mt-6">
          <View className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-4" />

          {/* Today's Earnings Header */}
          <View className="flex-row justify-between items-end mb-4">
            <View>
              <Text className="font-bold text-label-sm text-secondary uppercase font-jakarta">Today's Earnings</Text>
              <Text className="text-headline-xl font-bold text-on-surface font-jakarta">₦12,500</Text>
            </View>
            <Pressable onPress={() => router.push("/(driver)/earnings")} className="active:opacity-75">
              <Text className="text-primary font-bold text-label-md font-jakarta">Details ➔</Text>
            </Pressable>
          </View>

          {/* Bento Stats Grid */}
          <View className="flex-row gap-3 mb-6">
            {/* Trips Card */}
            <View className="flex-1 bg-surface-container p-4 rounded-xl border border-outline-variant flex-row items-center gap-3">
              <View className="w-10 h-10 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-sm">
                <Navigation color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-headline-md font-bold text-on-surface font-jakarta">14</Text>
                <Text className="text-label-sm text-secondary font-jakarta">Trips</Text>
              </View>
            </View>

            {/* Online Time Card */}
            <View className="flex-1 bg-surface-container p-4 rounded-xl border border-outline-variant flex-row items-center gap-3">
              <View className="w-10 h-10 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-sm">
                <Clock color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-headline-md font-bold text-on-surface font-jakarta">4h 20m</Text>
                <Text className="text-label-sm text-secondary font-jakarta">Online</Text>
              </View>
            </View>
          </View>

          {/* Incoming Request OR Search Panel */}
          <View className="pb-16">
            {!isOnline ? (
              <View className="border border-outline-variant bg-surface-container-lowest p-6 rounded-xl items-center text-center">
                <WifiOff color="#ba1a1a" size={32} />
                <Text className="text-body-lg font-bold text-on-surface mt-3 font-jakarta">You are currently offline</Text>
                <Text className="text-body-sm text-secondary text-center mt-1 font-jakarta">
                  Go online to start receiving ride requests across campus.
                </Text>
              </View>
            ) : isRequestPending ? (
              /* Request Card Alert */
              <View className="bg-surface-container-lowest border-2 border-primary rounded-xl p-4 shadow-lg gap-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-headline-md font-bold text-primary font-jakarta">Incoming Ride</Text>
                  <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <Text className="text-label-md font-bold text-primary font-jakarta">₦300</Text>
                  </View>
                </View>

                {/* Passenger Info */}
                <View className="flex-row items-center gap-3">
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                    }}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <View>
                    <Text className="text-body-md font-bold text-on-surface font-jakarta">Alex</Text>
                    <View className="flex-row items-center gap-1">
                      <Star color="#eab308" fill="#eab308" size={13} />
                      <Text className="text-body-sm text-secondary font-jakarta">4.9 • Student</Text>
                    </View>
                  </View>
                </View>

                {/* Route details */}
                <View className="bg-surface-container-low rounded-lg p-3 gap-2">
                  <View className="flex-row items-center gap-1.5">
                    <MapPin color="#001caa" size={14} />
                    <Text className="text-body-sm text-on-surface font-jakarta">
                      <Text className="font-bold text-primary">From:</Text> SOES Building
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <MapPin color="#ba1a1a" size={14} />
                    <Text className="text-body-sm text-on-surface font-jakarta">
                      <Text className="font-bold text-primary">To:</Text> Senate Building
                    </Text>
                  </View>
                </View>

                {/* Accept Button */}
                <Pressable
                  onPress={handleAcceptRequest}
                  className="w-full bg-primary h-12 rounded-lg items-center justify-center shadow-md active:scale-95 transition-all"
                >
                  <Text className="text-on-primary text-action-lg font-bold font-jakarta">Accept Request</Text>
                </Pressable>
              </View>
            ) : (
              /* Finding Rides Panel */
              <View className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl items-center shadow-sm">
                <View className="relative w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                  <Radar color="#001caa" size={32} />
                </View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Finding rides...</Text>
                <Text className="text-body-sm text-secondary text-center mt-1 max-w-[240px] font-jakarta">
                  Stay near high-demand areas like SEET Head, Hall C or FUTO Gate.
                </Text>

                {/* Simulator Trigger */}
                <Pressable
                  onPress={triggerMockIncomingRequest}
                  className="mt-6 bg-surface border border-outline-variant px-4 py-2.5 rounded-lg active:bg-surface-container-low"
                >
                  <Text className="text-[11px] text-primary font-bold uppercase tracking-wider font-jakarta">
                    Trigger Simulated Request
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

