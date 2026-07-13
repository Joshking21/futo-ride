import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Filter, User } from "lucide-react-native";
import { apiRequest } from "../../config/apiHelper";
import { useApp } from "../../context/AppContext";

interface RideRecord {
  rideId: string;
  fromStop: string;
  toStop: string;
  status: string;
  seats: number;
  fare: number;
  driverId: string | null;
  createdAt: number;
}

interface RideHistoryResponse {
  rides: RideRecord[];
  nextCursor: number | null;
}

const DUMMY_RIDES: RideRecord[] = [
  {
    rideId: "dummy-1",
    fromStop: "seet",
    toStop: "gate",
    status: "completed",
    seats: 2,
    fare: 35000,
    driverId: "drv-1",
    createdAt: Date.now() - 3600000 * 2, // 2 hours ago
  },
  {
    rideId: "dummy-2",
    fromStop: "library",
    toStop: "seet",
    status: "completed",
    seats: 1,
    fare: 15000,
    driverId: "drv-2",
    createdAt: Date.now() - 3600000 * 24, // 1 day ago
  },
  {
    rideId: "dummy-3",
    fromStop: "gate",
    toStop: "library",
    status: "cancelled",
    seats: 1,
    fare: 15000,
    driverId: null,
    createdAt: Date.now() - 3600000 * 28, // 1.2 days ago
  },
  {
    rideId: "dummy-4",
    fromStop: "library",
    toStop: "gate",
    status: "completed",
    seats: 3,
    fare: 50000,
    driverId: "drv-3",
    createdAt: Date.now() - 3600000 * 48, // 2 days ago
  },
  {
    rideId: "dummy-5",
    fromStop: "seet",
    toStop: "town",
    status: "completed",
    seats: 1,
    fare: 20000,
    driverId: "drv-4",
    createdAt: Date.now() - 3600000 * 72, // 3 days ago
  },
];

export default function RideHistory() {
  const router = useRouter();
  const { getStopName } = useApp();
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [rides, setRides] = useState<RideRecord[]>(DUMMY_RIDES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await apiRequest<RideHistoryResponse>("/rides/history");
        console.log("Ride history response:", res);
        setRides([...(res.rides || []), ...DUMMY_RIDES]);
      } catch (e: any) {
        console.error("Failed to fetch ride history, using fallback:", e);
        setRides(DUMMY_RIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredRides = rides?.filter((ride) => {
    const mappedStatus = ride.status === "completed" ? "completed" : "cancelled";
    if (filter === "all") return true;
    return mappedStatus === filter;
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

        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#001caa" />
          </View>
        ) : error ? (
          <View className="py-12 items-center justify-center px-6">
            <Text className="text-secondary font-jakarta text-center">{error}</Text>
          </View>
        ) : filteredRides.length === 0 ? (
          <View className="py-12 items-center justify-center px-6">
            <Text className="text-secondary font-jakarta text-center">No rides found.</Text>
          </View>
        ) : (
          <View className="px-margin-mobile gap-4 pb-8">
            {filteredRides.map((ride) => {
              const isCompleted = ride.status === "completed";
              return (
                <View
                  key={ride.rideId}
                  className="bg-white rounded-3xl p-5 flex-row items-center justify-between"
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
                        {getStopName(ride.fromStop)}
                      </Text>
                      <Text className="text-body-sm font-bold text-on-surface font-jakarta leading-5 mt-2">
                        {getStopName(ride.toStop)}
                      </Text>
                      {/* Date/Time text */}
                      <Text className="text-[12px] text-[#757687] font-jakarta mt-3">
                        {formatDate(ride.createdAt)}
                      </Text>
                      {/* Driver details with User icon */}
                      <View className="flex-row items-center gap-1.5 mt-1.5">
                        <User color="#757687" size={14} />
                        <Text className="text-[12px] text-[#757687] font-jakarta font-medium">
                          Driver
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right side: Price & Status & Chevron */}
                  <View className="flex-row gap-3 pl-3 h-full">
                    <View className="items-end gap-4 flex">
                      <Text className="text-body-sm font-bold text-on-surface font-jakarta">
                        ₦{(ride.fare / 100).toFixed(2)}
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
                  <View className="items-center flex">
                    <ChevronRight color="#757687" size={18} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
