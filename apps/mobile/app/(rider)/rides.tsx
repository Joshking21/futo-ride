import React, { useCallback, useEffect, useState } from "react";
import { View, Text, SectionList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
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

const MOCK_HISTORY_RIDES: RideRecord[] = Array.from({ length: 100 }, (_, index) => {
  const stops = ["seet", "gate", "library", "hostel3", "science", "engineering"];
  const fromStop = stops[index % stops.length];
  const toStop = stops[(index + 2) % stops.length];
  return {
    rideId: `mock-rider-trip-${index + 1}`,
    fromStop,
    toStop,
    status: index % 4 === 0 ? "cancelled" : "completed",
    seats: (index % 3) + 1,
    driverId: index % 4 === 0 ? null : `drv-${index}`,
    createdAt: Date.now() - index * 45 * 60 * 1000, // spaced 45 mins apart
    fare: 15000 + (index % 8) * 5000, // ₦150 to ₦190
  };
});

export default function RideHistory() {
  const router = useRouter();
  const { getStopName } = useApp();
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (cursorVal: number | null = null, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (cursorVal) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const url = `/rides/history?limit=10${cursorVal ? `&cursor=${cursorVal}` : ""}`;
      const res = await apiRequest<RideHistoryResponse>(url);
      
      if (res.rides && res.rides.length > 0) {
        if (isRefresh || !cursorVal) {
          setRides(res.rides);
        } else {
          setRides((prev) => [...prev, ...res.rides]);
        }
        setNextCursor(res.nextCursor);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      } else {
        throw new Error("No real backend rides, trigger mock fallback");
      }
    } catch (e: any) {
      console.log("No backend data, using simulated paginated mock data fallback.");
      
      // Simulate pagination using MOCK_HISTORY_RIDES
      setTimeout(() => {
        const sortedMock = [...MOCK_HISTORY_RIDES].sort((a, b) => b.createdAt - a.createdAt);
        
        let startIndex = 0;
        if (cursorVal) {
          startIndex = sortedMock.findIndex(r => r.createdAt === cursorVal) + 1;
        }

        if (startIndex < 0 || startIndex >= sortedMock.length) {
          if (isRefresh || !cursorVal) setRides([]);
          setNextCursor(null);
        } else {
          const pageItems = sortedMock.slice(startIndex, startIndex + 10);
          if (isRefresh || !cursorVal) {
            setRides(pageItems);
          } else {
            setRides((prev) => [...prev, ...pageItems]);
          }
          const lastItem = pageItems[pageItems.length - 1];
          const hasMore = startIndex + 10 < sortedMock.length;
          setNextCursor(hasMore ? lastItem.createdAt : null);
        }
        setError(null);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }, 800); // add delay so you can watch it load in real time
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    fetchHistory(null, true);
  };

  const handleScrollEndDrag = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Check if the user is at the bottom of the list when releasing their drag
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 10;
    if (isAtBottom && nextCursor && !loadingMore && !refreshing) {
      fetchHistory(nextCursor);
    }
  };

  const getSectionTitle = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getSections = () => {
    const filteredRides = rides?.filter((ride) => {
      const mappedStatus = ride.status === "completed" ? "completed" : "cancelled";
      if (filter === "all") return true;
      return mappedStatus === filter;
    });

    const groups: { [key: string]: RideRecord[] } = {};
    filteredRides.forEach((ride) => {
      const title = getSectionTitle(ride.createdAt);
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(ride);
    });

    return Object.keys(groups).map((title) => ({
      title,
      data: groups[title],
    }));
  };

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

  const renderRideItem = ({ item }: { item: RideRecord }) => {
    const isCompleted = item.status === "completed";
    return (
      <View
        className="bg-white rounded-3xl p-5 flex-row items-center justify-between mb-4 border border-outline-variant/5"
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
              {getStopName(item.fromStop)}
            </Text>
            <Text className="text-body-sm font-bold text-on-surface font-jakarta leading-5 mt-2">
              {getStopName(item.toStop)}
            </Text>
            {/* Date/Time text */}
            <Text className="text-[12px] text-[#757687] font-jakarta mt-3">
              {formatDate(item.createdAt)}
            </Text>
            {/* Driver details with User icon */}
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <User color="#757687" size={14} />
              <Text className="text-[12px] text-[#757687] font-jakarta font-medium">
                {item.driverId ? `Driver: ${item.driverId}` : "Unassigned"}
              </Text>
            </View>
          </View>
        </View>

        {/* Right side: Price & Status & Chevron */}
        <View className="flex-row gap-3 pl-3 h-full">
          <View className="items-end gap-4 flex">
            <Text className="text-body-sm font-bold text-on-surface font-jakarta">
              ₦{(item.fare / 100).toFixed(2)}
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
        <View className="items-center flex ml-2">
          <ChevronRight color="#757687" size={18} />
        </View>
      </View>
    );
  };

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
      <View className="px-margin-mobile mb-4">
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

      {loading && rides.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#001caa" />
        </View>
      ) : (
        <SectionList
          sections={getSections()}
          keyExtractor={(item) => item.rideId}
          renderItem={renderRideItem}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-surface-bright py-2 mt-2">
              <Text className="text-secondary text-body-sm font-bold font-jakarta uppercase tracking-wider">
                {title}
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          className="flex-grow mt-2"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#001caa"]}
            />
          }
          onScrollEndDrag={handleScrollEndDrag}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#001caa" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-secondary font-medium font-jakarta text-sm">
                No past rides found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
