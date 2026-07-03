import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Filter, User } from "lucide-react-native";

export default function RideHistory() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");

  const rides = [
    {
      id: "1",
      driverName: "Chinedu (KEK-1234)",
      date: "May 16, 2025 • 10:18 AM",
      pickup: "New Hall",
      destination: "Main Gate",
      price: "150.00",
      status: "completed",
    },
    {
      id: "2",
      driverName: "Usman (KEK-5678)",
      date: "May 15, 2025 • 4:42 PM",
      pickup: "Library Complex",
      destination: "Engineering Building",
      price: "120.00",
      status: "completed",
    },
    {
      id: "3",
      driverName: "Aminu (KEK-9012)",
      date: "May 15, 2025 • 1:15 PM",
      pickup: "Hostel 7",
      destination: "Student Union",
      price: "100.00",
      status: "completed",
    },
    {
      id: "4",
      driverName: "Chinedu (KEK-1234)",
      date: "May 14, 2025 • 6:30 PM",
      pickup: "Science Building",
      destination: "Parañaque City Gate",
      price: "150.00",
      status: "cancelled",
    },
    {
      id: "5",
      driverName: "Usman (KEK-5678)",
      date: "May 14, 2025 • 11:05 AM",
      pickup: "Sports Complex",
      destination: "New Hall",
      price: "130.00",
      status: "completed",
    },
    {
      id: "6",
      driverName: "Aminu (KEK-9012)",
      date: "May 13, 2025 • 8:20 AM",
      pickup: "Main Gate",
      destination: "ICT Building",
      price: "110.00",
      status: "completed",
    },
  ];

  const filteredRides = rides.filter((ride) => {
    if (filter === "all") return true;
    return ride.status === filter;
  });

  return (
    <SafeAreaView className="flex-grow flex-1 bg-surface-bright" edges={["top"]}>
      {/* Top Header Section */}
      <View className="flex-row items-center justify-between px-margin-mobile pt-4 pb-2 z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center active:bg-surface-container"
          style={{ elevation: 1 }}
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>

        <Text className="text-headline-sm font-bold text-on-surface font-jakarta">
          Ride History
        </Text>

        <Pressable
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center active:bg-surface-container relative"
          style={{ elevation: 1 }}
        >
          <Filter color="#0B1C30" size={20} />
          {/* Small blue dot notification */}
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#001caa",
            }}
          />
        </Pressable>
      </View>

      {/* Header Subtitle */}
      <Text className="text-center text-[#757687] text-body-sm font-jakarta mb-4">
        View your past rides and trip details.
      </Text>

      {/* Filter Tabs Container */}
      <View className="px-margin-mobile mb-6">
        <View className="flex-row bg-white rounded-2xl p-1.5">
          <Pressable
            onPress={() => setFilter("all")}
            className="flex-1 p-3 rounded-2xl items-center justify-center"
            style={
              filter === "all"
                ? { backgroundColor: "#eff4ff" }
                : { backgroundColor: "transparent" }
            }
          >
            <Text
              className="font-jakarta text-body-sm font-bold"
              style={
                filter === "all" ? { color: "#001caa" } : { color: "#757687" }
              }
            >
              All Rides
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("completed")}
            className="flex-1 py-3 rounded-xl items-center justify-center"
            style={
              filter === "completed"
                ? { backgroundColor: "#eff4ff" }
                : { backgroundColor: "transparent" }
            }
          >
            <Text
              className="font-jakarta text-body-sm font-bold"
              style={
                filter === "completed"
                  ? { color: "#001caa" }
                  : { color: "#757687" }
              }
            >
              Completed
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("cancelled")}
            className="flex-1 py-3 rounded-xl items-center justify-center"
            style={
              filter === "cancelled"
                ? { backgroundColor: "#eff4ff" }
                : { backgroundColor: "transparent" }
            }
          >
            <Text
              className="font-jakarta text-body-sm font-bold"
              style={
                filter === "cancelled"
                  ? { color: "#001caa" }
                  : { color: "#757687" }
              }
            >
              Cancelled
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-grow">
        {/* Section Heading */}
        <Text className="px-margin-mobile text-secondary text-body-sm font-bold font-jakarta mb-3">
          Recent Rides
        </Text>

        {/* List of Ride Cards */}
        <View className="px-margin-mobile gap-4 pb-8">
          {filteredRides.map((ride) => {
            const isCompleted = ride.status === "completed";
            return (
              <View
                key={ride.id}
                className="bg-white rounded-3xl p-5 flex-row items-center justify-between"
                // style={{ elevation: 1 }}
              >
                {/* Left side: Timeline & Route Info */}
                <View className="flex-row items-stretch gap-4 flex-1">
                  {/* Timeline Graphic Column */}
                  <View className="items-center justify-between py-1.5 w-4">
                    {/* Pickup dot (green border) */}
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: "#10b981",
                        backgroundColor: "#ffffff",
                      }}
                    />
                    {/* Dashed connector line */}
                    <View
                      style={{
                        flex: 1,
                        width: 1,
                        borderStyle: "dashed",
                        borderWidth: 0.8,
                        borderColor: "rgba(117, 118, 135, 0.3)",
                        marginVertical: 4,
                      }}
                    />
                    {/* Dropoff dot (blue border for completed, red for cancelled) */}
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: isCompleted ? "#001caa" : "#ba1a1a",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </View>

                  {/* Address Details */}
                  <View className="flex-1 justify-between">
                    <Text className="text-body-sm font-bold text-on-surface font-jakarta leading-5">
                      {ride.pickup}
                    </Text>
                    <Text className="text-body-sm font-bold text-on-surface font-jakarta leading-5 mt-2">
                      {ride.destination}
                    </Text>
                    {/* Date/Time text */}
                    <Text className="text-[12px] text-[#757687] font-jakarta mt-3">
                      {ride.date}
                    </Text>
                    {/* Driver details with User icon */}
                    <View className="flex-row items-center gap-1.5 mt-1.5">
                      <User color="#757687" size={14} />
                      <Text className="text-[12px] text-[#757687] font-jakarta font-medium">
                        {ride.driverName}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right side: Price & Status & Chevron */}
                <View className="flex-row  gap-3 pl-3  h-full">
                  <View className="items-end gap-4  flex">
                    <Text className="text-body-sm font-bold text-on-surface font-jakarta">
                      ₦{ride.price}
                    </Text>
                    <View
                      style={{
                        backgroundColor: isCompleted
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(186, 26, 26, 0.1)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: isCompleted ? "#10b981" : "#ba1a1a",
                          fontSize: 8,
                          fontWeight: "700",
                          fontFamily: "Plus Jakarta Sans",
                        }}
                      >
                        {isCompleted ? "Completed" : "Cancelled"}
                      </Text>
                    </View>
                  </View>
                  
                </View>
                <View className=" items-center flex ">
                  <ChevronRight color="#757687" size={18} />
                  </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
