import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Wallet, Navigation, Radar, ShieldCheck, Compass, Sparkles, Star } from "lucide-react-native";

export default function DriverHome() {
  const router = useRouter();
  const { isOnline, setOnline, activeTrip, triggerMockIncomingRequest, confirmBooking } = useApp();

  const handleToggleOnline = (status: boolean) => {
    setOnline(status);
  };

  const handleAcceptRequest = () => {
    confirmBooking();
    router.push("/(driver)/active");
  };

  const isRequestPending = activeTrip.status === "searching" && activeTrip.pickup === "SOES Building";

  return (
    <SafeAreaView className="flex-1 bg-surface relative" edges={["top"]}>
      {/* Top Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex-row items-center justify-between z-30">
        <Text className="text-headline-md font-bold text-primary font-jakarta">Driver Portal</Text>
        <View className="bg-success/15 px-3 py-1 rounded-full">
          <Text className="text-[11px] font-bold text-success uppercase">
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Main Content Canvas */}
      <View className="flex-1 relative z-10 bg-surface-container-low">
        {/* Map View */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBplF4lizcuWCAAxeQDrMFyXLlFRlAMZFM-ah_-AGh7YIZ8KDIpCKfPWuGbBdBfUR-WIZXFi_Cojg4zJ3020nXZrx0mvZbV0VaF_i0cZ6PdLAMgZQXYPanCo3Wbaw14likLaGkCJ9DHhA3Z6mkfcrMfiPnFdA8LY0cnbc3J4BAMIy0HMTB4KVZ4kUx4hCy4XTD3HnzDcjQrhudHRtkadCC3rJoQa3vjqYnQXFsBCWDTT7hxyIvB1HYLBNa59wsVRBatDzKiLAGUwQ1Z",
          }}
          className="w-full h-[320px] object-cover"
        />

        {/* Driver Status Switch Overlay */}
        <View className="absolute top-4 left-margin-mobile right-margin-mobile z-20 flex-row justify-center">
          <View className="bg-surface-container-lowest border border-outline-variant/30 rounded-full p-1 flex-row shadow-md">
            <Pressable
              onPress={() => handleToggleOnline(false)}
              className={`px-6 py-2 rounded-full min-w-[100px] items-center ${
                !isOnline ? "bg-inverse-surface" : "bg-transparent"
              }`}
            >
              <Text className={`text-label-sm font-bold ${!isOnline ? "text-inverse-on-surface" : "text-secondary"}`}>
                Offline
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleOnline(true)}
              className={`px-6 py-2 rounded-full min-w-[100px] items-center ${
                isOnline ? "bg-primary" : "bg-transparent"
              }`}
            >
              <Text className={`text-label-sm font-bold ${isOnline ? "text-white" : "text-secondary"}`}>
                Online
              </Text>
            </Pressable>
          </View>
        </View>

        {/* User Location marker indicator */}
        <View className="absolute top-[160px] left-[50%] -mt-2 -ml-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />

        {/* Bottom Sheet Card details */}
        <ScrollView className="flex-1 bg-surface px-margin-mobile pt-4 rounded-t-2xl -mt-4 shadow-xl border-t border-outline-variant/40">
          
          {/* Today's Earnings Summary Card */}
          <View className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col gap-2 mb-6">
            <View className="flex-row justify-between items-center">
              <Text className="text-body-md text-on-surface font-bold">Today's Earnings</Text>
              <Sparkles color="#001caa" size={18} />
            </View>
            <Text className="text-headline-lg font-black text-primary">₦ 12,500.00</Text>
            
            <View className="h-[1px] bg-outline-variant/20 my-1 w-full" />
            
            <View className="flex-row justify-between pt-1">
              <View>
                <Text className="text-[10px] text-secondary uppercase font-bold">Trips</Text>
                <Text className="text-body-md font-bold text-on-surface">14 completed</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] text-secondary uppercase font-bold">Online Time</Text>
                <Text className="text-body-md font-bold text-on-surface">4h 20m</Text>
              </View>
            </View>
          </View>

          {/* Finding Rides / Incoming Request Panel */}
          <View className="pb-16">
            {!isOnline ? (
              <View className="border border-outline-variant/30 bg-surface-container-lowest p-6 rounded-xl items-center text-center">
                <Text className="text-body-lg font-bold text-on-surface">You are currently offline</Text>
                <Text className="text-body-sm text-secondary text-center mt-1">
                  Go online to start receiving ride requests across campus.
                </Text>
              </View>
            ) : isRequestPending ? (
              /* Request Card Alert */
              <View className="bg-surface-container-lowest border-2 border-primary rounded-xl p-4 shadow-lg flex flex-col gap-4 animate-bounce">
                <View className="flex-row justify-between items-center">
                  <Text className="text-headline-sm font-bold text-primary font-jakarta">Incoming Ride</Text>
                  <Text className="text-label-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">₦ 300</Text>
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
                    <Text className="text-body-md font-bold text-on-surface">Alex</Text>
                    <View className="flex-row items-center gap-1">
                      <Star color="#eab308" fill="#eab308" size={13} />
                      <Text className="text-body-sm text-secondary font-bold">4.9 • Student</Text>
                    </View>
                  </View>
                </View>

                {/* Route */}
                <View className="bg-surface-container-low rounded-lg p-3">
                  <Text className="text-body-sm text-on-surface"><Text className="font-bold text-primary">From:</Text> SOES Building</Text>
                  <Text className="text-body-sm text-on-surface mt-1"><Text className="font-bold text-primary">To:</Text> Senate Building</Text>
                </View>

                {/* Actions */}
                <Pressable
                  onPress={handleAcceptRequest}
                  className="w-full bg-primary hover:bg-primary-container h-12 rounded-lg items-center justify-center shadow-md active:scale-95"
                >
                  <Text className="text-on-primary text-action-lg font-bold">Accept Request</Text>
                </Pressable>
              </View>
            ) : (
              /* Radar Pulse Search Panel */
              <View className="bg-surface-container-lowest border border-outline-variant/40 p-6 rounded-xl items-center">
                <View className="relative w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                  <Radar color="#001caa" size={32} />
                </View>
                <Text className="text-body-md font-bold text-on-surface">Finding rides...</Text>
                <Text className="text-body-sm text-secondary text-center mt-1 max-w-[240px]">
                  Stay in high-demand areas like SEET Head, Hall C or FUTO Gate.
                </Text>

                <Pressable
                  onPress={triggerMockIncomingRequest}
                  className="mt-6 bg-surface-container border border-outline-variant/80 px-4 py-2 rounded-lg active:bg-surface-container-low"
                >
                  <Text className="text-[11px] text-primary font-bold uppercase tracking-wider">
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
