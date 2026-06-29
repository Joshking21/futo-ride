import { useRouter } from "expo-router";
import {
  Bell,
  Clock,
  MapPin,
  Menu,
  Navigation,
  Radar,
  Star,
  WifiOff,
} from "lucide-react-native";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import KekeIcon from "../../components/KekeIcon";

export default function DriverHome() {
  const router = useRouter();
  const {
    isOnline,
    setOnline,
    activeTrip,
    triggerMockIncomingRequest,
    confirmBooking,
  } = useApp();

  const handleToggleOnline = () => {
    setOnline(!isOnline);
  };

  const handleAcceptRequest = () => {
    confirmBooking();
    router.push("/(driver)/active");
  };

  const isRequestPending =
    activeTrip.status === "searching" && activeTrip.pickup === "SOES Building";

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top"]}>
      {/* Top Header Overlay */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[64px] bg-white border-b border-outline-variant/10 z-20">
        <Pressable className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-outline-variant/10 shadow-sm active:bg-surface-container">
          <Menu color="#0B1C30" size={20} />
        </Pressable>

        {/* Online Status Pill */}
        <Pressable
          onPress={handleToggleOnline}
          className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full border ${
            isOnline ? "bg-success/10 border-success/30" : "bg-surface border-outline-variant/15"
          }`}
        >
          <View className="w-2 h-2 rounded-full relative">
            <View className={`absolute inset-0 rounded-full ${isOnline ? "bg-success animate-ping" : "bg-secondary"}`} />
            <View className={`w-2 h-2 rounded-full ${isOnline ? "bg-success" : "bg-secondary"}`} />
          </View>
          <Text className={`font-jakarta text-body-sm font-bold ${isOnline ? "text-success" : "text-secondary"}`}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </Pressable>

        <Pressable className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-outline-variant/10 shadow-sm active:bg-surface-container relative">
          <Bell color="#0B1C30" size={20} />
          <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-error border border-white rounded-full" />
        </Pressable>
      </View>

      {/* Main Content Area */}
      <View className="flex-grow relative z-0">
        {/* Interactive Map Background */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0okzKR0KPq91lUrgoEl5fyfMy1B5eqVhArkpdos9nGZDnDI-ks7j4edISnFdnY4EKDclvfu-tXw48XWwCwLTHkiWgUdTJPzw0-Wbjb64syVe-qicEEPGdmkI1X7mJoq5k_B3J8K-Wlt3yAZ33Dzy6Q9HBEh9IjQITFz8IxurvIKiiZPmecWT2IRE_rFhmA4LK39TpJEwR6einizhW-wxyX5mP-M4C_rzF5V9nyd4VRIX-5fdOl05wnH6PWCU_MI8wXXgOBBcGS5kv",
          }}
          className="w-full h-[280px]"
        />

        {/* Floating location marker in map */}
        <View className="absolute top-[120px] left-[50%] -ml-6 -mt-6 bg-white p-2 rounded-2xl border border-outline-variant/10 shadow-md">
          <KekeIcon size={28} color="#001caa" />
        </View>

        {/* Bottom Sheet / Stats Container */}
        <ScrollView className="flex-1 bg-white rounded-t-[36px] border-t border-outline-variant/10 px-margin-mobile pt-5 -mt-6 z-10">
          <View className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto mb-4" />

          {/* Today's Earnings Header */}
          <View className="flex-row justify-between items-center bg-primary/5 rounded-3xl p-5 border border-primary/10 mb-4">
            <View>
              <Text className="text-body-sm text-secondary font-jakarta">Today's Earnings</Text>
              <Text className="text-headline-lg font-bold text-primary font-jakarta mt-0.5">₦12,500</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(driver)/earnings")}
              className="bg-white border border-outline-variant/15 rounded-2xl px-4 py-2.5 active:bg-surface"
            >
              <Text className="text-body-sm font-bold text-on-surface font-jakarta">Details</Text>
            </Pressable>
          </View>

          {/* Bento Stats Grid */}
          <View className="flex-row gap-4 mb-5">
            {/* Trips Card */}
            <View className="flex-1 bg-surface border border-outline-variant/10 rounded-3xl p-4 flex-row items-center gap-3">
              <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center">
                <Navigation color="#001caa" size={20} className="rotate-45" />
              </View>
              <View>
                <Text className="text-headline-sm font-bold text-on-surface font-jakarta">14</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Trips</Text>
              </View>
            </View>

            {/* Online Time Card */}
            <View className="flex-1 bg-surface border border-outline-variant/10 rounded-3xl p-4 flex-row items-center gap-3">
              <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center">
                <Clock color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-headline-sm font-bold text-on-surface font-jakarta">4h 20m</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Online</Text>
              </View>
            </View>
          </View>

          {/* Incoming Request OR Search Panel */}
          <View className="pb-12">
            {!isOnline ? (
              <View className="bg-error-container/20 border border-error-container rounded-3xl p-5 items-center justify-center gap-3 text-center">
                <WifiOff color="#ba1a1a" size={32} />
                <Text className="text-body-md font-bold text-error font-jakarta">You are currently offline</Text>
                <Text className="text-body-sm text-secondary text-center px-4 leading-5 font-jakarta">
                  Go online to start receiving ride requests across campus.
                </Text>
              </View>
            ) : isRequestPending ? (
              /* Request Card Alert */
              <View className="bg-white rounded-3xl border-2 border-primary p-5 shadow-lg gap-4">
                <View className="flex-row justify-between items-center border-b border-outline-variant/10 pb-3">
                  <Text className="text-headline-sm font-bold text-primary font-jakarta">Incoming Ride</Text>
                  <View className="bg-primary px-3 py-1.5 rounded-full">
                    <Text className="text-white font-bold text-body-sm font-jakarta">₦850</Text>
                  </View>
                </View>

                {/* Passenger Info */}
                <View className="flex-row items-center gap-3.5">
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                    }}
                    className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/10"
                  />
                  <View>
                    <Text className="text-body-md font-bold text-on-surface font-jakarta">Alex</Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Star color="#eab308" fill="#eab308" size={14} />
                      <Text className="text-body-sm text-secondary font-jakarta">4.9 • Student</Text>
                    </View>
                  </View>
                </View>

                {/* Route details */}
                <View className="bg-surface rounded-2xl p-4 gap-3 border border-outline-variant/5">
                  <View className="flex-row items-center gap-2">
                    <MapPin color="#001caa" size={16} />
                    <Text className="text-body-sm text-secondary font-jakarta">
                      From: <Text className="font-bold text-on-surface">SOES Building</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <MapPin color="#ba1a1a" size={16} />
                    <Text className="text-body-sm text-secondary font-jakarta">
                      To: <Text className="font-bold text-on-surface">Senate Building</Text>
                    </Text>
                  </View>
                </View>

                {/* Accept Button */}
                <Pressable
                  onPress={handleAcceptRequest}
                  className="w-full bg-[#0b1c30] h-14 rounded-full flex items-center justify-center shadow-md active:scale-[0.98]"
                >
                  <Text className="text-white text-action-lg font-bold font-jakarta">Accept Request</Text>
                </Pressable>
              </View>
            ) : (
              /* Finding Rides Panel */
              <View className="bg-primary/5 border border-primary/10 rounded-3xl p-6 items-center justify-center gap-3 shadow-sm">
                <Radar color="#001caa" size={32} />
                <Text className="text-body-md font-bold text-primary font-jakarta">Finding rides...</Text>
                <Text className="text-body-sm text-secondary text-center px-4 leading-5 font-jakarta">
                  Stay near high-demand areas like SEET Head, Hall C or FUTO Gate.
                </Text>

                {/* Simulator Trigger */}
                <Pressable
                  onPress={triggerMockIncomingRequest}
                  className="bg-white border border-outline-variant/15 w-full h-12 rounded-2xl flex items-center justify-center active:bg-surface mt-2 shadow-sm"
                >
                  <Text className="text-body-sm font-bold text-on-surface font-jakarta">
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
